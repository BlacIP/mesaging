import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
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
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const [generations, config] = await Promise.all([listGenerations(account.id), getConfig(account.id)]);
  return NextResponse.json({ generations, her_name: config.her_name });
}

export async function POST(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const body = await request.json();
  const suggestionId = Number(body.suggestionId);

  if (!Number.isInteger(suggestionId) || suggestionId <= 0) {
    return NextResponse.json({ error: "A valid suggestion id is required." }, { status: 400 });
  }

  if (body.action === "mark_used") {
    await markSuggestionUsed(account.id, suggestionId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "add_to_bank") {
    const suggestion = await getSuggestion(account.id, suggestionId);
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    }
    if (suggestion.in_bank) {
      return NextResponse.json({ error: "This message is already in the bank." }, { status: 409 });
    }

    const message = await addMessage(account.id, suggestion.period, suggestion.body);
    await linkSuggestionToMessage(account.id, suggestionId, message.id);

    return NextResponse.json({
      message,
      messages: await listBankMessages(account.id),
      generations: await listGenerations(account.id)
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
