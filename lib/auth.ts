import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

// Browser requests: the app sends the passcode in a header (attached by the
// api() helper from localStorage after the one-time unlock screen).
export function isAdminRequest(request: NextRequest) {
  return hasAccess(request.headers.get("x-app-key"));
}

// iPhone Shortcut requests: header if the Shortcut sets one, otherwise a
// ?key= query param, which is easier to configure in the Shortcuts app.
export function isShortcutRequest(request: NextRequest) {
  return hasAccess(request.headers.get("x-app-key") ?? request.nextUrl.searchParams.get("key"));
}

function hasAccess(provided: string | null) {
  const secret = process.env.APP_PASSCODE?.trim();
  if (!secret) {
    console.warn("[auth] APP_PASSCODE is not set — the API is open to anyone.");
    return true;
  }
  if (!provided) return false;
  return safeEqual(provided, secret);
}

function safeEqual(a: string, b: string) {
  // hash both sides so lengths always match and comparison is constant-time
  const digestA = createHash("sha256").update(a).digest();
  const digestB = createHash("sha256").update(b).digest();
  return timingSafeEqual(digestA, digestB);
}
