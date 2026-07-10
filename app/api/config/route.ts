import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
import { AppConfig, getConfig, saveConfig } from "@/lib/db";

export async function GET(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  return NextResponse.json({
    config: await getConfig(account.id),
    account: { name: account.name, is_admin: account.is_admin }
  });
}

export async function POST(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const body = await request.json();
  const config: AppConfig = {
    her_name: cleanText(body.her_name) || "My Love",
    imessage_to: cleanText(body.imessage_to),
    whatsapp_phone: cleanText(body.whatsapp_phone).replace(/\D/g, ""),
    morning_time: cleanTime(body.morning_time, "07:00"),
    night_time: cleanTime(body.night_time, "22:00"),
    send_imessage: body.send_imessage !== false,
    send_whatsapp: body.send_whatsapp !== false
  };

  await saveConfig(account.id, config);
  return NextResponse.json({ config });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTime(value: unknown, fallback: string) {
  const text = cleanText(value);
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}
