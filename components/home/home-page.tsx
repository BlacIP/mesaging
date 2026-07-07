"use client";

import { useEffect, useMemo, useState } from "react";
import { api, readableError, writeBankCache } from "@/components/shared/client-data";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { AppConfig, Message, Period, emptyConfig } from "@/lib/types";
import { PreviewDialog } from "./dialogs";
import { Hero } from "./hero";
import { MessageBank } from "./message-bank";

type PreviewMessage = { body: string; id: number; message: string; period: Period };

export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [newMessage, setNewMessage] = useState<Record<Period, string>>({ morning: "", night: "" });
  const [addingPeriod, setAddingPeriod] = useState<Period | null>(null);
  const [previewingPeriod, setPreviewingPeriod] = useState<Period | null>(null);
  const [previewCache, setPreviewCache] = useState<Record<Period, PreviewMessage | null>>({ morning: null, night: null });
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
      const data = await api<{ config: AppConfig; messages: Message[]; previews: Record<Period, PreviewMessage | null> }>("/api/data");
      const nextConfig = { ...emptyConfig, ...data.config };
      setMessages(data.messages);
      setConfig(nextConfig);
      setPreviewCache(data.previews);
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
      void refreshPreview(period);
      setNotice(null);
      return true;
    } catch (error) {
      setNotice(readableError(error, "Could not add message"));
      return false;
    }
  }

  async function saveMessage(id: number, text: string) {
    const period = preview?.period;
    try {
      const data = await api<{ messages: Message[] }>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "edit", id, text })
      });
      setMessages(data.messages);
      writeBankCache(data.messages, config);
      setPreview(null);
      if (period) void refreshPreview(period);
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not save previewed message"));
      throw error;
    }
  }

  async function previewNext(period: Period) {
    const cached = previewCache[period];
    if (cached) {
      setNotice(null);
      setPreview({ id: cached.id, period: cached.period, body: cached.body });
      return;
    }
    await refreshPreview(period, true);
  }

  async function refreshPreview(period: Period, openAfter = false) {
    setPreviewingPeriod(period);
    try {
      const data = await api<PreviewMessage>(`/api/preview?period=${period}`);
      setPreviewCache((current) => ({ ...current, [period]: data }));
      setNotice(null);
      if (openAfter) setPreview({ id: data.id, period: data.period, body: data.body });
    } catch (error) {
      setPreviewCache((current) => ({ ...current, [period]: null }));
      setNotice(readableError(error, `No ${period} messages in the bank yet.`));
    } finally {
      setPreviewingPeriod(null);
    }
  }

  return (
    <main className="shell">
      <InstallPrompt variant="floating" />
      <Hero total={messages.length} />
      {notice && <p className="notice" role="alert">{notice}</p>}
      <section className="messages-grid">
        {(["morning", "night"] as Period[]).map((period) => (
          <MessageBank
            count={grouped[period].length}
            herName={config.her_name}
            isPreviewing={previewingPeriod === period}
            key={period}
            newValue={newMessage[period]}
            period={period}
            title={period === "morning" ? "Good Morning" : "Good Night"}
            isAdding={addingPeriod === period}
            onAdd={add}
            onChange={(value) => setNewMessage((current) => ({ ...current, [period]: value }))}
            onPreview={(nextPeriod) => void previewNext(nextPeriod)}
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
