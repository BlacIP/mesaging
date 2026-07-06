import { NextRequest, NextResponse } from "next/server";

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function isAdminRequest(_request: NextRequest) {
  return true;
}

export function isShortcutRequest(_request: NextRequest) {
  return true;
}
