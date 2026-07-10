"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { api, isUnauthorizedError, readableError, setStoredKey } from "@/components/shared/client-data";

type GateStatus = "checking" | "locked" | "open";
type GateMode = "unlock" | "create" | "reset";

export function KeyGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>("checking");
  const [mode, setMode] = useState<GateMode>("unlock");
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    setError(null);
    setStoredKey(passcode);
    try {
      await api("/api/config");
      setStatus("open");
    } catch (err) {
      setError(isUnauthorizedError(err) ? "That passcode is not right — try again." : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/account", {
        method: "POST",
        body: JSON.stringify({ name, passcode })
      });
      setStoredKey(passcode);
      await api("/api/config");
      setStatus("open");
    } catch (err) {
      setError(readableError(err, "Could not create your space."));
    } finally {
      setBusy(false);
    }
  }

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/account", {
        method: "POST",
        body: JSON.stringify({ action: "reset_passcode", name, passcode })
      });
      setStoredKey(passcode);
      await api("/api/config");
      setStatus("open");
    } catch (err) {
      setError(readableError(err, "Could not reset your passcode."));
    } finally {
      setBusy(false);
    }
  }

  function goTo(nextMode: GateMode) {
    setMode(nextMode);
    setError(null);
    setPasscode("");
  }

  if (status === "open") return <>{children}</>;
  if (status === "checking") return null;

  if (mode === "create") {
    return (
      <main className="gate">
        <form className="gate-card" onSubmit={create}>
          <p className="kicker">Sweet Messages</p>
          <h1>Create your own space</h1>
          <p>Pick a space name and a passcode. You get your own private message bank, settings, and AI history — nobody else can see them. The space name must be unique, and it is how you recover your space, so choose one you will remember.</p>
          <input
            autoFocus
            type="text"
            autoComplete="off"
            value={name}
            placeholder="Space name (e.g. Bade's love notes)"
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            value={passcode}
            placeholder="Choose a passcode (6+ characters)"
            onChange={(event) => setPasscode(event.target.value)}
          />
          {error && <p className="gate-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy || name.trim().length < 2 || passcode.trim().length < 6}>
            {busy ? "Creating..." : "Create my space"}
          </button>
          <button className="gate-switch" type="button" onClick={() => goTo("unlock")}>
            I already have a passcode
          </button>
        </form>
      </main>
    );
  }

  if (mode === "reset") {
    return (
      <main className="gate">
        <form className="gate-card" onSubmit={reset}>
          <p className="kicker">Sweet Messages</p>
          <h1>Reset your passcode</h1>
          <p>Enter your space name and choose a new passcode.</p>
          <input
            autoFocus
            type="text"
            autoComplete="off"
            value={name}
            placeholder="Your space name"
            onChange={(event) => setName(event.target.value)}
          />
          <input
            type="password"
            autoComplete="new-password"
            value={passcode}
            placeholder="New passcode (6+ characters)"
            onChange={(event) => setPasscode(event.target.value)}
          />
          {error && <p className="gate-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy || name.trim().length < 2 || passcode.trim().length < 6}>
            {busy ? "Resetting..." : "Set new passcode"}
          </button>
          <button className="gate-switch" type="button" onClick={() => goTo("unlock")}>
            Back to unlock
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="gate">
      <form className="gate-card" onSubmit={unlock}>
        <p className="kicker">Sweet Messages</p>
        <h1>For your eyes only</h1>
        <p>Enter your passcode to open your message bank. You only do this once per device.</p>
        <input
          autoFocus
          type="password"
          autoComplete="current-password"
          value={passcode}
          placeholder="Passcode"
          onChange={(event) => setPasscode(event.target.value)}
        />
        {error && <p className="gate-error" role="alert">{error}</p>}
        <button type="submit" disabled={busy || !passcode.trim()}>
          {busy ? "Checking..." : "Unlock"}
        </button>
        <button className="gate-switch" type="button" onClick={() => goTo("create")}>
          New here? Create your own space
        </button>
        <button className="gate-switch" type="button" onClick={() => goTo("reset")}>
          Forgot passcode?
        </button>
      </form>
    </main>
  );
}
