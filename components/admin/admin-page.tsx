"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, readableError } from "@/components/shared/client-data";
import { MobileActions } from "@/components/shared/mobile-actions";

type AccountRow = {
  id: number;
  name: string;
  is_admin: boolean;
  created_at: string;
  morning_count: number;
  night_count: number;
  send_count: number;
  generation_count: number;
  last_activity: string | null;
};

export function AdminPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const data = await api<{ accounts: AccountRow[] }>("/api/admin/accounts");
      setAccounts(data.accounts);
      setNotice(null);
    } catch (error) {
      setNotice(readableError(error, "Could not load accounts"));
    } finally {
      setLoaded(true);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="kicker">Sweet Messages</p>
          <h1>Accounts</h1>
          <p>Every space created on this app. Passcodes are stored hashed, so only names and activity are visible.</p>
        </div>
        <div className="hero-actions">
          <Link className="link-button" href="/">Manage messages</Link>
          <Link className="link-button" href="/settings">Settings</Link>
        </div>
        <MobileActions
          items={[
            { href: "/", label: "Manage messages" },
            { href: "/settings", label: "Settings", menuOnly: true }
          ]}
        />
      </section>

      {notice && <p className="notice" role="alert">{notice}</p>}

      {loaded && !notice && (
        <div className="table-wrap admin-table-wrap">
          <table className="bank-table admin-table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Role</th>
                <th>Morning</th>
                <th>Night</th>
                <th>Sends</th>
                <th>AI prompts</th>
                <th>Last activity</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.is_admin ? <span className="status-pill sent">Owner</span> : <span className="status-pill unsent">Member</span>}</td>
                  <td>{account.morning_count}</td>
                  <td>{account.night_count}</td>
                  <td>{account.send_count}</td>
                  <td>{account.generation_count}</td>
                  <td>{formatWhen(account.last_activity)}</td>
                  <td>{formatWhen(account.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
