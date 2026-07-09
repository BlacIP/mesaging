"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { api, isUnauthorizedError, setStoredKey } from "@/components/shared/client-data";

type GateStatus = "checking" | "locked" | "open";

export function KeyGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    void check();
  }, []);

  async function check() {
    try {
      await api("/api/config");
      setStatus("open");
    } catch (err) {
      if (isUnauthorizedError(err)) {
        setStatus("locked");
      } else {
        // network/server trouble is not an auth failure — let the pages
        // render (from cache) and surface their own errors
        setStatus("open");
      }
    }
  }

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passcode.trim()) return;
    setVerifying(true);
    setError(null);
    setStoredKey(passcode);
    try {
      await api("/api/config");
      setStatus("open");
    } catch (err) {
      setError(isUnauthorizedError(err) ? "That passcode is not right — try again." : "Could not reach the server.");
    } finally {
      setVerifying(false);
    }
  }

  if (status === "open") return <>{children}</>;
  if (status === "checking") return null;

  return (
    <main className="gate">
      <form className="gate-card" onSubmit={unlock}>
        <p className="kicker">Sweet Messages</p>
        <h1>For your eyes only</h1>
        <p>Enter your passcode to open the message bank. You only do this once per device.</p>
        <input
          autoFocus
          type="password"
          autoComplete="current-password"
          value={passcode}
          placeholder="Passcode"
          onChange={(event) => setPasscode(event.target.value)}
        />
        {error && <p className="gate-error" role="alert">{error}</p>}
        <button type="submit" disabled={verifying || !passcode.trim()}>
          {verifying ? "Checking..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}
