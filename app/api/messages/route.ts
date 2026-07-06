import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { addMessage, deleteMessage, forceNextMessage, isPeriod, listBankMessages, updateMessage } from "@/lib/db";

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

  if (body.action === "edit") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0 || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "A valid message id and text are required." }, { status: 400 });
    }

    const message = await updateMessage(id, body.text.trim());
    if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    return NextResponse.json({ messages: await listBankMessages() });
  }

  if (body.action === "force_next") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid message id is required." }, { status: 400 });
    }

    const result = await forceNextMessage(id);
    if (!result) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    return NextResponse.json({ messages: await listBankMessages() });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
