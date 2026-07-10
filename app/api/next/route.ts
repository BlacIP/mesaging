import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
import { isPeriod, pickNextMessage } from "@/lib/db";

export async function GET(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const period = request.nextUrl.searchParams.get("period");

  if (!isPeriod(period)) {
    return NextResponse.json({ error: "Use period=morning or period=night." }, { status: 400 });
  }

  const result = await pickNextMessage(account.id, period);

  if (!result) {
    return NextResponse.json({ error: `No active ${period} messages found.` }, { status: 404 });
  }

  return NextResponse.json(result);
}
