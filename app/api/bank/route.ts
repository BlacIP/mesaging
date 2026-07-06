import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { getConfig, listBankMessages } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const [messages, config] = await Promise.all([listBankMessages(), getConfig()]);

  return NextResponse.json({ messages, config });
}
