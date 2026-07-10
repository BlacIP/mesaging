import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
import { getConfig, listBankMessages, previewNextMessage } from "@/lib/db";

export async function GET(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const [messages, config, morningPreview, nightPreview] = await Promise.all([
    listBankMessages(account.id),
    getConfig(account.id),
    previewNextMessage(account.id, "morning"),
    previewNextMessage(account.id, "night")
  ]);

  return NextResponse.json({ config, messages, previews: { morning: morningPreview, night: nightPreview } });
}
