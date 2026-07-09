import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import {
  addMessage,
  getConfig,
  getSuggestion,
  linkSuggestionToMessage,
  listBankMessages,
  listGenerations,
  markSuggestionUsed
} from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const [generations, config] = await Promise.all([listGenerations(), getConfig()]);
  return NextResponse.json({ generations, her_name: config.her_name });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const body = await request.json();
  const suggestionId = Number(body.suggestionId);

  if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
    return NextResponse.json({ error: "A valid suggestion id is required." }, { status: 400 });
  }

  if (body.action === "mark_used") {
    await markSuggestionUsed(suggestionId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "add_to_bank") {
    const suggestion = await getSuggestion(suggestionId);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    }
    if (suggestion.in_bank) {
      return NextResponse.json({ error: "This message is already in the bank." }, { status: 409 });
    }

    const message = await addMessage(suggestion.period, suggestion.body);
    await linkSuggestionToMessage(suggestionId, message.id);

    return NextResponse.json({
      message,
      messages: await listBankMessages(),
      generations: await listGenerations()
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
