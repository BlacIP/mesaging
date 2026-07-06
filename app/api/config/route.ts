import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { AppConfig, getConfig, saveConfig } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  return NextResponse.json({ config: await getConfig() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

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

  await saveConfig(config);
  return NextResponse.json({ config });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanTime(value: unknown, fallback: string) {
  const text = cleanText(value);
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}
