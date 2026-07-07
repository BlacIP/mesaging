import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { getConfig, listBankMessages, previewNextMessage } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const [messages, config, morningPreview, nightPreview] = await Promise.all([
    listBankMessages(),
    getConfig(),
    previewNextMessage("morning"),
    previewNextMessage("night")
  ]);

  return NextResponse.json({ config, messages, previews: { morning: morningPreview, night: nightPreview } });
}
