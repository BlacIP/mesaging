"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, readableError, writeBankCache } from "@/components/shared/client-data";
import { CopyButton } from "@/components/shared/copy-button";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { MobileActions } from "@/components/shared/mobile-actions";
import { SettingsForm } from "@/components/home/settings-form";
import { SettingsSavedDialog } from "@/components/home/dialogs";
import { AppConfig, Message, emptyConfig } from "@/lib/types";

export function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    void loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api<{ messages: Message[]; config: AppConfig }>("/api/data");
      setConfig({ ...emptyConfig, ...data.config });
      setMessages(data.messages);
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error));
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
      setEditing(false);
      setSaved(true);
    } catch (error) {
      setNotice(readableError(error, "Could not save settings"));
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="kicker">Sweet Messages</p>
          <h1>Settings</h1>
          <p>Private configuration for name replacement and future sender options.</p>
        </div>
        <div className="hero-actions">
          <Link className="link-button" href="/">Manage messages</Link>
        </div>
        <MobileActions items={[{ href: "/", label: "Manage messages" }]} />
      </section>
      {notice && <p className="notice" role="alert">{notice}</p>}
      <SettingsForm
        config={config}
        editing={editing}
        onCancel={() => { setEditing(false); void loadData(); }}
        onChange={setConfig}
        onEdit={() => setEditing(true)}
        onSave={saveSettings}
      />
      <InstallPrompt variant="settings" />
      <ShortcutFlow baseUrl={baseUrl} />
      {saved && <SettingsSavedDialog config={config} onClose={() => setSaved(false)} />}
    </main>
  );
}

function ShortcutFlow({ baseUrl }: { baseUrl: string }) {
  return (
    <section className="panel flow-panel">
      <h2>Shortcut Flow</h2>
      <div className="shortcut-endpoints">
        {(["morning", "night"] as const).map((period) => {
          const url = `${baseUrl}/api/next?period=${period}`;
          return (
            <label key={period}>
              {period} endpoint
              <div className="endpoint-field">
                <code>{url}</code>
                <CopyButton text={url} />
              </div>
            </label>
          );
        })}
      </div>
      <ol>
        <li>Create a Personal Automation for the morning or night time.</li>
        <li>Use Get Contents of URL with the matching endpoint above.</li>
        <li>Use Get Dictionary from Input, then get the value for <span className="inline-code">message</span>.</li>
        <li>Use Send Message for iMessage, or Open URL with your WhatsApp deep link.</li>
        <li>Turn off Ask Before Running after you have tested it.</li>
      </ol>
    </section>
  );
}
