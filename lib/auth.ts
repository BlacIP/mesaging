import { NextRequest, NextResponse } from "next/server";
import { Account, findAccountByPasscode, findOwnerAccount } from "@/lib/database/accounts";

export type { Account };

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Not allowed") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Resolve the request's passcode (browser header or Shortcut ?key=) to its
 * account. Returns null when the passcode is missing or unknown. */
export async function getAccount(request: NextRequest): Promise<Account | null> {
  const key = request.headers.get("x-app-key") ?? request.nextUrl.searchParams.get("key");

  if (!process.env.APP_PASSCODE?.trim()) {
    // dev fallback: with no passcode configured everything is the owner
    console.warn("[auth] APP_PASSCODE is not set — all requests resolve to the owner account.");
    return findOwnerAccount();
  }

  if (!key?.trim()) return null;
  return findAccountByPasscode(key);
}
