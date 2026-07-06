import { NextRequest, NextResponse } from "next/server";
import { AiProviderError, createAiMessages } from "@/lib/ai/messages";
import { isAdminRequest, unauthorized } from "@/lib/auth";
import { isPeriod } from "@/lib/db";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorized();

  const body = await request.json();

  if (!isPeriod(body.period) || !["generate", "edit"].includes(body.mode)) {
    return NextResponse.json({ error: "A valid period and AI mode are required." }, { status: 400 });
  }

  try {
    const suggestions = await createAiMessages({
      draft: typeof body.draft === "string" ? body.draft : "",
      focus: typeof body.focus === "string" ? body.focus : "",
      herName: typeof body.herName === "string" ? body.herName : "",
      length: typeof body.length === "string" ? body.length : "medium",
      mode: body.mode,
      period: body.period,
      tone: typeof body.tone === "string" ? body.tone : "romantic"
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    const status = error instanceof AiProviderError ? error.status : 500;
    const message = error instanceof Error ? error.message : "AI failed.";

    console.error("[ai] message generation failed", { message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
