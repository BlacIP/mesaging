import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
import { createAccount, resetPasscodeByName, updatePasscode } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";

  // signed-in user picks a new passcode
  if (body.action === "change_passcode") {
    const account = await getAccount(request);
    if (!account) return unauthorized();
    if (account.is_admin) {
      return NextResponse.json({ error: "The owner passcode is managed by APP_PASSCODE on the server." }, { status: 400 });
    }
    if (passcode.length < 6) {
      return NextResponse.json({ error: "Choose a passcode of at least 6 characters." }, { status: 400 });
    }

    const result = await updatePasscode(account.id, passcode);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  // forgot passcode: only works after the owner approved a reset for this name
  if (body.action === "reset_passcode") {
    if (name.length < 2 || passcode.length < 6) {
      return NextResponse.json({ error: "Enter your space name and a new passcode of at least 6 characters." }, { status: 400 });
    }

    const result = await resetPasscodeByName(name, passcode);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ account: { name: result.name } });
  }

  // default: sign-up — create a new private space
  if (name.length < 2) {
    return NextResponse.json({ error: "Enter a space name of at least 2 characters." }, { status: 400 });
  }
  if (passcode.length < 6) {
    return NextResponse.json({ error: "Choose a passcode of at least 6 characters." }, { status: 400 });
  }

  const result = await createAccount(name, passcode);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ account: { name: result.name } });
}
