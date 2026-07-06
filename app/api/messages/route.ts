import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { addMessage, deleteMessage, isPeriod, listBankMessages } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  return NextResponse.json({ messages: await listBankMessages() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return unauthorized();
  }

  const body = await request.json();

  if (body.action === "add") {
    if (!isPeriod(body.period) || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "A period and message text are required." }, { status: 400 });
    }

    await addMessage(body.period, body.text.trim());
    return NextResponse.json({ messages: await listBankMessages() });
  }

  if (body.action === "delete") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid message id is required." }, { status: 400 });
    }

    await deleteMessage(id);
    return NextResponse.json({ messages: await listBankMessages() });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
