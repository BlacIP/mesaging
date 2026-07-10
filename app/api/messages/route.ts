import { NextRequest, NextResponse } from "next/server";
import { getAccount, unauthorized } from "@/lib/auth";
import { addMessage, cancelForcedNext, deleteMessage, forceNextMessage, isPeriod, listBankMessages, updateMessage } from "@/lib/db";

export async function GET(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  return NextResponse.json({ messages: await listBankMessages(account.id) });
}

export async function POST(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const body = await request.json();

  if (body.action === "add") {
    if (!isPeriod(body.period) || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "A period and message text are required." }, { status: 400 });
    }

    await addMessage(account.id, body.period, body.text.trim());
    return NextResponse.json({ messages: await listBankMessages(account.id) });
  }

  if (body.action === "delete") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid message id is required." }, { status: 400 });
    }

    await deleteMessage(account.id, id);
    return NextResponse.json({ messages: await listBankMessages(account.id) });
  }

  if (body.action === "edit") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0 || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json({ error: "A valid message id and text are required." }, { status: 400 });
    }

    const message = await updateMessage(account.id, id, body.text.trim());
    if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    return NextResponse.json({ messages: await listBankMessages(account.id) });
  }

  if (body.action === "force_next") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid message id is required." }, { status: 400 });
    }

    const result = await forceNextMessage(account.id, id);
    if (!result) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    return NextResponse.json({ messages: await listBankMessages(account.id) });
  }

  if (body.action === "cancel_force") {
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid message id is required." }, { status: 400 });
    }

    const result = await cancelForcedNext(account.id, id);
    if (!result) return NextResponse.json({ error: "This message is not forced as next." }, { status: 404 });

    return NextResponse.json({ messages: await listBankMessages(account.id) });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
