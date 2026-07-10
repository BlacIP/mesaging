import { AppConfig, BankMessage, Message } from "@/lib/types";

type BankCache = {
  messages: BankMessage[] | Message[];
  config: Partial<AppConfig>;
  savedAt: number;
};

const bankCacheKey = "sweet-messages-bank-cache";

// how long the session cache is treated as authoritative: within this window
// pages render from cache without hitting the server at all. Mutations always
// rewrite the cache, so this only bounds staleness from OTHER sources (the
// iPhone Shortcut marking sends, or edits made on another device).
export const BANK_CACHE_TTL_MS = 5 * 60 * 1000;

export function isCacheFresh(cache: { savedAt: number } | null): cache is { savedAt: number } {
  return cache !== null && Date.now() - cache.savedAt < BANK_CACHE_TTL_MS;
}

const inflightGets = new Map<string, Promise<unknown>>();

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") return request<T>(path, options);

  // simultaneous identical GETs (Strict Mode double-mounts, sibling
  // components) share one network call instead of hitting Neon twice
  const pending = inflightGets.get(path);
  if (pending) return pending as Promise<T>;

  const fresh = request<T>(path, options).finally(() => inflightGets.delete(path));
  inflightGets.set(path, fresh);
  return fresh;
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const key = getStoredKey();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "x-app-key": key } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = new Error((await response.text()) || response.statusText) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return response.json();
}

const appKeyStorage = "sweet-messages-app-key";

export function getStoredKey() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(appKeyStorage);
}

export function setStoredKey(key: string) {
  // switching accounts must not leak the previous account's cached bank
  if (window.localStorage.getItem(appKeyStorage) !== key.trim()) clearBankCache();
  window.localStorage.setItem(appKeyStorage, key.trim());
}

export function clearBankCache() {
  window.sessionStorage.removeItem(bankCacheKey);
}

export function clearStoredKey() {
  window.localStorage.removeItem(appKeyStorage);
  clearBankCache();
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof Error && (error as Error & { status?: number }).status === 401;
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
