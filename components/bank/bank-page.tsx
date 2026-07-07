"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, readBankCache, readableError, writeBankCache } from "@/components/shared/client-data";
import { MobileActions } from "@/components/shared/mobile-actions";
import { BankMessage } from "@/lib/types";
import { FilterToolbar } from "./filter-toolbar";
import { BankMessageDialog } from "./message-dialog";
import { MessageTable } from "./message-table";
import { BankCache, BankConfig, PeriodFilter, StatusFilter } from "./types";

export function BankPage() {
  const [messages, setMessages] = useState<BankMessage[]>([]);
  const [config, setConfig] = useState<BankConfig>({ her_name: "My Love" });
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<{ editing: boolean; message: BankMessage } | null>(null);
  const [notice, setNotice] = useState("Loading bank...");

  useEffect(() => {
    const cached = readBankCache<BankCache>();
    if (cached) {
      setMessages(cached.messages);
      setConfig(cached.config);
      setNotice(`Showing ${cached.messages.length} active messages`);
    }
    void loadBank();
  }, []);

  const filtered = useMemo(
    () => messages.filter((message) => matchesFilters(message, period, status)),
    [messages, period, status]
  );

  const counts = useMemo(() => ({
    all: messages.length,
    morning: messages.filter((message) => message.period === "morning").length,
    night: messages.filter((message) => message.period === "night").length,
    sent: messages.filter((message) => message.sent).length,
    unsent: messages.filter((message) => !message.sent).length
  }), [messages]);

  async function loadBank() {
    try {
      const data = await api<{ messages: BankMessage[]; config: BankConfig }>("/api/bank");
      setMessages(data.messages);
      setConfig(data.config);
      writeBankCache(data.messages, data.config);
      setNotice(`Showing ${data.messages.length} active messages`);
    } catch (error) {
      setNotice(readableError(error, "Could not load bank"));
    }
  }

  async function saveMessage(id: number, text: string) {
    try {
      const data = await api<{ messages: BankMessage[] }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "edit", id, text })
      });
      setMessages(data.messages);
      writeBankCache(data.messages, config);
      const updated = data.messages.find((message) => message.id === id);
      setSelected(updated ? { editing: false, message: updated } : null);
      setNotice(`Showing ${data.messages.length} active messages`);
    } catch (error) {
      setNotice(readableError(error, "Could not save message"));
      throw error;
    }
  }

  async function forceNext(message: BankMessage) {
    try {
      const data = await api<{ messages: BankMessage[] }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "force_next", id: message.id })
      });
      setMessages(data.messages);
      writeBankCache(data.messages, config);
      setNotice(`${message.period} message #${message.id} will send next`);
    } catch (error) {
      setNotice(readableError(error, "Could not set next message"));
    }
  }

  return (
    <main className="shell">
      <Hero onRefresh={() => void loadBank()} />
      {notice.startsWith("Could not") && <p className="notice" role="alert">{notice}</p>}
      <FilterToolbar counts={counts} period={period} status={status} onPeriod={setPeriod} onStatus={setStatus} />
      <MessageTable
        herName={config.her_name}
        messages={filtered}
        onEdit={(message) => setSelected({ editing: true, message })}
        onForceNext={forceNext}
        onOpen={(message) => setSelected({ editing: false, message })}
      />
      {selected && (
        <BankMessageDialog
          herName={config.her_name}
          initialEditing={selected.editing}
          message={selected.message}
          onClose={() => setSelected(null)}
          onSave={saveMessage}
        />
      )}
    </main>
  );
}

function Hero({ onRefresh }: { onRefresh: () => void }) {
  return (
    <section className="hero bank-hero">
      <div>
        <p className="kicker">Sweet Messages</p>
        <h1>Message Bank</h1>
      </div>
      <div className="hero-actions">
        <Link className="link-button" href="/">Manage messages</Link>
        <button type="button" onClick={onRefresh}>Refresh</button>
      </div>
      <MobileActions items={[{ href: "/", label: "Manage messages" }, { label: "Refresh", onClick: onRefresh }]} />
    </section>
  );
}

function matchesFilters(message: BankMessage, period: PeriodFilter, status: StatusFilter) {
  const periodMatches = period === "all" || message.period === period;
  const statusMatches = status === "all" || (status === "sent" ? message.sent : !message.sent);
  return periodMatches && statusMatches;
}
