"use client";

import Link from "next/link";
import { RiArrowDownSLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import { api, applyName, formatPeriod, readBankCache, readableError, writeBankCache } from "@/components/shared/client-data";
import { MobileActions } from "@/components/shared/mobile-actions";
import { Message, Period } from "@/lib/types";

type Suggestion = {
  id: number;
  body: string;
  used: boolean;
  added_message_id: number | null;
  in_bank: boolean;
};

type Generation = {
  id: number;
  period: Period;
  mode: string;
  tone: string;
  length: string;
  focus: string;
  draft: string;
  created_at: string;
  suggestions: Suggestion[];
};

type PeriodFilter = "all" | Period;

export function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [herName, setHerName] = useState("");
  const [filter, setFilter] = useState<PeriodFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => generations.filter((generation) => filter === "all" || generation.period === filter),
    [generations, filter]
  );

  async function load() {
    try {
      const data = await api<{ generations: Generation[]; her_name?: string }>("/api/ai/history");
      setGenerations(data.generations);
      if (data.her_name) setHerName(data.her_name);
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not load prompt history"));
    } finally {
      setLoaded(true);
    }
  }

  async function addToBank(suggestion: Suggestion) {
    setSavingId(suggestion.id);
    try {
      const data = await api<{ generations: Generation[]; messages: Message[] }>("/api/ai/history", {
        method: "POST",
        body: JSON.stringify({ action: "add_to_bank", suggestionId: suggestion.id })
      });
      setGenerations(data.generations);
      // keep home/bank caches current so they show the new message without refetching
      const cached = readBankCache();
      writeBankCache(data.messages, cached?.config ?? { her_name: herName });
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not add message to the bank"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="kicker">Sweet Messages</p>
          <h1>Prompt History</h1>
          <p>Every AI prompt you have run. Tap one to see all the options it wrote.</p>
        </div>
        <div className="hero-actions">
          <Link className="link-button" href="/">Manage messages</Link>
          <Link className="link-button" href="/bank">View bank table</Link>
        </div>
        <MobileActions items={[{ href: "/", label: "Manage messages" }, { href: "/bank", label: "View bank table" }]} />
      </section>

      {notice && <p className="notice" role="alert">{notice}</p>}

      <div className="history-filter filter-group" role="group" aria-label="Filter prompts by period">
        {(["all", "morning", "night"] as PeriodFilter[]).map((option) => (
          <button
            className={`filter-button ${option === filter ? "active" : ""}`}
            key={option}
            type="button"
            onClick={() => setFilter(option)}
          >
            {option === "all" ? `All (${generations.length})` : formatPeriod(option)}
          </button>
        ))}
      </div>

      {loaded && filtered.length === 0 && (
        <section className="panel history-empty">
          <h2>Nothing here yet</h2>
          <p>
            Prompt history is recorded from now on. Generate messages with AI assist on the
            {" "}<Link href="/">home page</Link> and every option will be kept here — including the ones you did not pick.
          </p>
        </section>
      )}

      <div className="history-list">
        {filtered.map((generation) => {
          const expanded = expandedId === generation.id;
          return (
            <section className={`panel history-card ${generation.period} ${expanded ? "open" : ""}`} key={generation.id}>
              <button
                className="history-summary"
                type="button"
                aria-expanded={expanded ? "true" : "false"}
                onClick={() => setExpandedId(expanded ? null : generation.id)}
              >
                <span className={`period-pill ${generation.period}`}>{formatPeriod(generation.period)}</span>
                <span className="history-snippet">{promptLabel(generation)}</span>
                <span className="history-count">{generation.suggestions.length} options</span>
                <time dateTime={generation.created_at}>{formatWhen(generation.created_at)}</time>
                <RiArrowDownSLine className="history-chevron" aria-hidden size={18} />
              </button>

              {expanded && (
                <div className="history-detail">
                  <p className="history-tags">
                    {generation.tone && <em>{generation.tone}</em>}
                    {generation.length && <em>{generation.length}</em>}
                    <em>{generation.mode === "edit" ? "rewrite" : "new message"}</em>
                  </p>

                  {(generation.focus || generation.draft) && (
                    <p className="history-prompt">
                      {generation.mode === "edit" && generation.draft
                        ? <>Rewriting: &ldquo;{generation.draft}&rdquo;{generation.focus ? <> &middot; {generation.focus}</> : null}</>
                        : generation.focus}
                    </p>
                  )}

                  <ul className="history-suggestions">
                    {generation.suggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <p>{applyName(suggestion.body, herName)}</p>
                        <div className="history-suggestion-meta">
                          {suggestion.used && <span className="status-pill sent">Used</span>}
                          {suggestion.in_bank ? (
                            <span className="status-pill sent">In bank</span>
                          ) : (
                            <button
                              type="button"
                              disabled={savingId === suggestion.id}
                              onClick={() => void addToBank(suggestion)}
                            >
                              {savingId === suggestion.id ? "Adding..." : "Add to bank"}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function promptLabel(generation: Generation) {
  if (generation.focus) return generation.focus;
  if (generation.mode === "edit" && generation.draft) return `Rewriting: “${generation.draft}”`;
  return `${generation.tone || "romantic"} · ${generation.length || "medium"}`;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}
