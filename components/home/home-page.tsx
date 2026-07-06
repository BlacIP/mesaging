"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, applyName, readableError, writeBankCache } from "@/components/shared/client-data";
import { AppConfig, Message, Period, emptyConfig } from "@/lib/types";
import { PreviewDialog, SettingsSavedDialog } from "./dialogs";
import { MessageBank } from "./message-bank";
import { SettingsForm } from "./settings-form";

export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [newMessage, setNewMessage] = useState<Record<Period, string>>({ morning: "", night: "" });
  const [preview, setPreview] = useState<{ period: Period; message: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => void loadData(), []);

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

    try {
      const data = await api<{ messages: Message[] }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "add", period, text })
      });
      setMessages(data.messages);
      writeBankCache(data.messages, config);
      setNewMessage((current) => ({ ...current, [period]: "" }));
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not add message"));
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await api<{ config: AppConfig }>("/api/config", {
        method: "POST",
        body: JSON.stringify(config)
      });
      setConfig(data.config);
      writeBankCache(messages, data.config);
      setNotice(null);
      setEditing(false);
      setSettingsSaved(true);
      window.setTimeout(() => setSettingsSaved(false), 3500);
    } catch (error) {
      setNotice(readableError(error, "Could not save settings"));
    }
  }

  function previewNext(period: Period) {
    const periodMessages = grouped[period];
    if (periodMessages.length === 0) return setNotice(`No ${period} messages in the bank yet.`);

    const unsent = periodMessages.filter((message) => !message.sent);
    const pool = unsent.length > 0 ? unsent : periodMessages;
    const message = pool[Math.floor(Math.random() * pool.length)];
    setNotice(null);
    setPreview({ period, message: applyName(message.body, config.her_name) });
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
            shortcutUrl={`/api/next?period=${period}`}
            title={period === "morning" ? "Good Morning" : "Good Night"}
            onAdd={add}
            onChange={(value) => setNewMessage((current) => ({ ...current, [period]: value }))}
            onPreview={previewNext}
          />
        ))}
      </section>
      <SettingsForm
        config={config}
        editing={editing}
        onCancel={() => { setEditing(false); void loadData(); }}
        onChange={setConfig}
        onEdit={() => setEditing(true)}
        onSave={saveSettings}
      />
      {settingsSaved && <SettingsSavedDialog config={config} onClose={() => setSettingsSaved(false)} />}
      {preview && <PreviewDialog message={preview} onClose={() => setPreview(null)} />}
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
      </div>
    </section>
  );
}
