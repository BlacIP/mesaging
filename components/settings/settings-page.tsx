"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, clearStoredKey, getStoredKey, readBankCache, readableError, setStoredKey, writeBankCache } from "@/components/shared/client-data";
import { CopyButton } from "@/components/shared/copy-button";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { MobileActions } from "@/components/shared/mobile-actions";
import { SettingsForm } from "@/components/home/settings-form";
import { SettingsSavedDialog } from "@/components/home/dialogs";
import { AppConfig, emptyConfig } from "@/lib/types";

export function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>(emptyConfig);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [shortcutKey, setShortcutKey] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    setShortcutKey(getStoredKey() ?? "");
    void loadData();
  }, []);

  async function loadData() {
    try {
      const data = await api<{ config: AppConfig; account?: { name: string; is_admin: boolean } }>("/api/config");
      setConfig({ ...emptyConfig, ...data.config });
      setIsAdmin(Boolean(data.account?.is_admin));
      setAccountName(data.account?.name ?? "");
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error));
    }
  }

  function switchAccount() {
    clearStoredKey();
    window.location.href = "/"; // full reload so the passcode gate reappears
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const data = await api<{ config: AppConfig }>("/api/config", {
        method: "POST",
        body: JSON.stringify(config)
      });
      setConfig(data.config);
      // keep the bank page's instant-paint cache in sync without
      // refetching the whole bank just for a config change
      const cached = readBankCache();
      if (cached) writeBankCache(cached.messages, data.config);
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
          <p>
            {accountName ? <>Your space: <strong>{accountName}</strong>. </> : null}
            Private configuration for name replacement and future sender options.
          </p>
        </div>
        <div className="hero-actions">
          {isAdmin && <Link className="link-button" href="/admin">Accounts</Link>}
          <Link className="link-button" href="/">Manage messages</Link>
          <button type="button" onClick={switchAccount}>
            {isAdmin ? "Switch account" : "Sign out"}
          </button>
        </div>
        <MobileActions
          items={[
            ...(isAdmin ? [{ href: "/admin", label: "Accounts" }] : []),
            { href: "/", label: "Manage messages" }
          ]}
          menuItems={[{ label: isAdmin ? "Switch account" : "Sign out", onClick: switchAccount }]}
        />
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
      {!isAdmin && <PasscodePanel onChanged={(next) => setShortcutKey(next)} />}
      <ShortcutFlow baseUrl={baseUrl} shortcutKey={shortcutKey} />
      {saved && <SettingsSavedDialog config={config} onClose={() => setSaved(false)} />}
    </main>
  );
}

function PasscodePanel({ onChanged }: { onChanged: (next: string) => void }) {
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function change(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api("/api/account", {
        method: "POST",
        body: JSON.stringify({ action: "change_passcode", passcode: value })
      });
      setStoredKey(value); // this device stays signed in with the new passcode
      onChanged(value.trim());
      setValue("");
      setMessage("Passcode changed. This device stays signed in — update your Shortcut link below.");
    } catch (error) {
      setMessage(readableError(error, "Could not change passcode"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel passcode-panel" onSubmit={change}>
      <h2>Passcode</h2>
      <p>Pick a new passcode for this space. Other devices will need the new one.</p>
      <div className="passcode-row">
        <input
          type="password"
          autoComplete="new-password"
          value={value}
          placeholder="New passcode (6+ characters)"
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit" disabled={busy || value.trim().length < 6}>
          {busy ? "Changing..." : "Change passcode"}
        </button>
      </div>
      {message && <p className="inline-notice">{message}</p>}
    </form>
  );
}

function ShortcutFlow({ baseUrl, shortcutKey }: { baseUrl: string; shortcutKey: string }) {
  return (
    <section className="panel flow-panel">
      <h2>Shortcut Flow</h2>
      <div className="shortcut-endpoints">
        {(["morning", "night"] as const).map((period) => {
          const url = `${baseUrl}/api/next?period=${period}${shortcutKey ? `&key=${encodeURIComponent(shortcutKey)}` : ""}`;
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
        <li>Use Get Contents of URL with the matching endpoint above — the link includes your passcode so the Shortcut is allowed in.</li>
        <li>Use Get Dictionary from Input, then get the value for <span className="inline-code">message</span>.</li>
        <li>Use Send Message for iMessage, or Open URL with your WhatsApp deep link.</li>
        <li>Turn off Ask Before Running after you have tested it.</li>
      </ol>
    </section>
  );
}
