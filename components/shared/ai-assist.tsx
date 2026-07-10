"use client";

import Link from "next/link";
import { api, formatPeriod, readableError } from "@/components/shared/client-data";
import { Message, Period } from "@/lib/types";
import { RiAiGenerate, RiCloseLine, RiHistoryLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { useSheetDrag } from "./use-sheet-drag";

const loveLoadingLines = [
  "building love...",
  "love is sweet...",
  "love is kind...",
  "choosing tender words...",
  "warming the message...",
  "adding a little romance...",
  "finding the right feeling...",
  "polishing the butterflies..."
];

type Suggestion = {
  id: number;
  body: string;
  saved: boolean;
  saving: boolean;
};

export function AiAssist({
  draft,
  herName,
  onBankUpdated,
  onUse,
  period
}: {
  draft: string;
  herName: string;
  onBankUpdated?: (messages: Message[]) => void;
  onUse: (message: string) => void;
  period: Period;
}) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState("romantic");
  const [length, setLength] = useState("medium");
  const [focus, setFocus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { sheetRef, handleProps } = useSheetDrag(() => setOpen(false));

  useEffect(() => {
    if (!isGenerating) return;

    const timer = window.setInterval(() => {
      setLoadingIndex((current) => (current + 1) % loveLoadingLines.length);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [isGenerating]);

  async function generate() {
    setIsGenerating(true);
    setLoadingIndex(0);
    setNotice(null);

    try {
      const data = await api<{ suggestions: { id: number; body: string }[] }>("/api/ai/messages", {
        method: "POST",
        body: JSON.stringify({ draft, focus, herName, length, mode: draft ? "edit" : "generate", period, tone })
      });
      setSuggestions(data.suggestions.map((s) => ({ ...s, saved: false, saving: false })));
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not generate messages"));
    } finally {
      setIsGenerating(false);
    }
  }

  function use(suggestion: Suggestion) {
    onUse(suggestion.body);
    setOpen(false);
    if (suggestion.id > 0) {
      void api("/api/ai/history", {
        method: "POST",
        body: JSON.stringify({ action: "mark_used", suggestionId: suggestion.id })
      }).catch(() => undefined);
    }
  }

  async function saveToBank(suggestion: Suggestion) {
    if (suggestion.saved || suggestion.saving) return;
    setSuggestions((current) => current.map((s) => (s.id === suggestion.id ? { ...s, saving: true } : s)));

    try {
      const data = await api<{ messages: Message[] }>("/api/ai/history", {
        method: "POST",
        body: JSON.stringify({ action: "add_to_bank", suggestionId: suggestion.id })
      });
      setSuggestions((current) => current.map((s) => (s.id === suggestion.id ? { ...s, saved: true, saving: false } : s)));
      setNotice(null);
      onBankUpdated?.(data.messages);
    } catch (error) {
      setSuggestions((current) => current.map((s) => (s.id === suggestion.id ? { ...s, saving: false } : s)));
      setNotice(readableError(error, "Could not save to bank"));
    }
  }

  return (
    <span className="ai-anchor">
      <button className="icon-button ai-button" type="button" aria-label="AI assist" title="AI assist" onClick={() => setOpen(!open)}>
        <RiAiGenerate aria-hidden size={19} />
      </button>
      {open && <div className="ai-backdrop" role="presentation" onClick={() => setOpen(false)} />}
      {open && (
        <div className="ai-popover" role="dialog" aria-label="AI assist options" ref={sheetRef}>
          <div className="sheet-handle" aria-hidden {...handleProps} />
          <div className="ai-popover-head">
            <span className="ai-head-title">
              <strong>AI assist</strong>
              <span className={`period-pill ${period}`}>{formatPeriod(period)}</span>
            </span>
            <button type="button" aria-label="Close AI options" onClick={() => setOpen(false)}>
              <RiCloseLine aria-hidden size={18} />
            </button>
          </div>
          {notice && (
            <p className="inline-notice">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice(null)}>Clear</button>
            </p>
          )}
          <OptionRow label="Tone" options={["romantic", "playful", "deep"]} value={tone} onChange={setTone} />
          <OptionRow label="Length" options={["short", "medium", "long"]} value={length} onChange={setLength} />
          <input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="Mention mood, memory, prayer..." />
          <button className="ai-generate" type="button" disabled={isGenerating} onClick={() => void generate()}>
            {isGenerating ? loveLoadingLines[loadingIndex] : `Generate ${period} messages`}
          </button>
          {suggestions.length > 0 && (
            <button className="clear-suggestions" type="button" onClick={() => setSuggestions([])}>
              Clear suggestions
            </button>
          )}
          <div className="suggestion-list compact">
            {suggestions.map((suggestion) => (
              <div className="suggestion-card" key={suggestion.id}>
                <p>{suggestion.body}</p>
                <div className="suggestion-actions">
                  <button type="button" onClick={() => use(suggestion)}>Use</button>
                  <button
                    className={suggestion.saved ? "saved" : ""}
                    type="button"
                    disabled={suggestion.saved || suggestion.saving || suggestion.id <= 0}
                    onClick={() => void saveToBank(suggestion)}
                  >
                    {suggestion.saved ? "Saved to bank" : suggestion.saving ? "Saving..." : "Save to bank"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Link className="ai-history-footer" href="/history" onClick={() => setOpen(false)}>
            <RiHistoryLine aria-hidden size={16} /> View prompt history
          </Link>
        </div>
      )}
    </span>
  );
}

function OptionRow({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <div className="ai-option-row">
      <span>{label}</span>
      {options.map((option) => (
        <button className={option === value ? "active" : ""} key={option} type="button" onClick={() => onChange(option)}>
          {option}
        </button>
      ))}
    </div>
  );
}
