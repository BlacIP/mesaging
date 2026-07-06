"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, applyName, readableError, writeBankCache } from "@/components/shared/client-data";
import { MobileActions } from "@/components/shared/mobile-actions";
import { AppConfig, Message, Period, emptyConfig } from "@/lib/types";
import { PreviewDialog } from "./dialogs";
import { MessageBank } from "./message-bank";

export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [newMessage, setNewMessage] = useState<Record<Period, string>>({ morning: "", night: "" });
  const [addingPeriod, setAddingPeriod] = useState<Period | null>(null);
  const [preview, setPreview] = useState<{ id: number; period: Period; body: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const grouped = useMemo(() => ({
    morning: messages.filter((message) => message.period === "morning"),
    night: messages.filter((message) => message.period === "night")
  }), [messages]);

  async function loadData() {
    try {
      const data = await api<{ messages: Message[]; config: AppConfig }>("/api/data");
      const nextConfig = { ...emptyConfig, ...data.config };
      setMessages(data.messages);
      setConfig(nextConfig);
      writeBankCache(data.messages, nextConfig);
      setNotice(null);
    } catch (error) {
      setMessages([]);
      setConfig(emptyConfig);
      setNotice(readableError(error));
    }
  }

  async function add(period: Period) {
    const text = newMessage[period].trim();
    if (!text) return;

    setAddingPeriod(period);
    const added = await addText(period, text);
    if (added) setNewMessage((current) => ({ ...current, [period]: "" }));
    setAddingPeriod(null);
  }

  async function addText(period: Period, text: string) {
    try {
      const data = await api<{ messages: Message[] }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "add", period, text })
      });
      setMessages(data.messages);
      writeBankCache(data.messages, config);
      setNotice(null);
      return true;
    } catch (error) {
      setNotice(readableError(error, "Could not add message"));
      return false;
    }
  }

  async function saveMessage(id: number, text: string) {
    try {
      const data = await api<{ messages: Message[] }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "edit", id, text })
      });
      setMessages(data.messages);
      writeBankCache(data.messages, config);
      setPreview(null);
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not save previewed message"));
      throw error;
    }
  }

  function previewNext(period: Period) {
    const periodMessages = grouped[period];
    if (periodMessages.length === 0) return setNotice(`No ${period} messages in the bank yet.`);

    const unsent = periodMessages.filter((message) => !message.sent);
    const pool = unsent.length > 0 ? unsent : periodMessages;
    const message = pool[Math.floor(Math.random() * pool.length)];
    setNotice(null);
    setPreview({ id: message.id, period, body: message.body });
  }

  return (
    <main className="shell">
      <Hero total={messages.length} />
      {notice && <p className="notice" role="alert">{notice}</p>}
      <section className="messages-grid">
        {(["morning", "night"] as Period[]).map((period) => (
          <MessageBank
            count={grouped[period].length}
            herName={config.her_name}
            key={period}
            newValue={newMessage[period]}
            period={period}
            title={period === "morning" ? "Good Morning" : "Good Night"}
            isAdding={addingPeriod === period}
            onAdd={add}
            onChange={(value) => setNewMessage((current) => ({ ...current, [period]: value }))}
            onPreview={previewNext}
          />
        ))}
      </section>
      {preview && (
        <PreviewDialog
          herName={config.her_name}
          message={preview}
          onClose={() => setPreview(null)}
          onSave={saveMessage}
        />
      )}
    </main>
  );
}

function Hero({ total }: { total: number }) {
  return (
    <section className="hero">
      <div>
        <h1>Sweet Messages</h1>
        <p>Manage {total} messages your iPhone Shortcuts can use for morning and night.</p>
      </div>
      <div className="hero-actions">
        <Link className="link-button" href="/bank">View bank table</Link>
        <Link className="link-button" href="/settings">Settings</Link>
      </div>
      <MobileActions items={[{ href: "/bank", label: "View bank table" }, { href: "/settings", label: "Settings" }]} />
    </section>
  );
}
