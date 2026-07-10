import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
import { getConfig, listBankMessages } from "@/lib/db";

export async function GET(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const [messages, config] = await Promise.all([listBankMessages(account.id), getConfig(account.id)]);

  return NextResponse.json({ messages, config });
}
