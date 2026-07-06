import { AppConfig, BankMessage, Message } from "@/lib/types";

type BankCache = {
  messages: BankMessage[] | Message[];
  config: Partial<AppConfig>;
  savedAt: number;
};

const bankCacheKey = "sweet-messages-bank-cache";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });

  if (!response.ok) throw new Error((await response.text()) || response.statusText);
  return response.json();
}

export function readBankCache<T extends BankCache>() {
  const cached = window.sessionStorage.getItem(bankCacheKey);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as T;
  } catch {
    return null;
  }
}

export function writeBankCache(messages: BankCache["messages"], config: Partial<AppConfig>) {
  window.sessionStorage.setItem(
    bankCacheKey,
    JSON.stringify({ config, messages, savedAt: Date.now() })
  );
}

export function readableError(error: unknown, fallback = "Could not load data") {
  if (!(error instanceof Error)) return fallback;

  try {
    return (JSON.parse(error.message) as { error?: string }).error ?? fallback;
  } catch {
    return error.message || fallback;
  }
}

export function applyName(message: string, herName: string) {
  return message.replaceAll("{name}", herName || "My Love");
}

export function formatPeriod(period: string) {
  return period === "morning" ? "Morning" : "Night";
}
