import { NextRequest, NextResponse } from "next/server";
import { AiProviderError, createAiMessages } from "@/lib/ai/messages";
import { getAccount, unauthorized } from "@/lib/auth";
import { isPeriod, recordGeneration } from "@/lib/db";

export async function POST(request: NextRequest) {
  const account = await getAccount(request);
  if (!account) return unauthorized();

  const body = await request.json();

  if (!isPeriod(body.period) || !["generate", "edit"].includes(body.mode)) {
    return NextResponse.json({ error: "A valid period and AI mode are required." }, { status: 400 });
  }

  const params = {
    draft: typeof body.draft === "string" ? body.draft : "",
    focus: typeof body.focus === "string" ? body.focus : "",
    herName: typeof body.herName === "string" ? body.herName : "",
    length: typeof body.length === "string" ? body.length : "medium",
    mode: body.mode as "generate" | "edit",
    period: body.period,
    tone: typeof body.tone === "string" ? body.tone : "romantic"
  };

  try {
    const texts = await createAiMessages(params);

    let generationId: number | null = null;
    let suggestions = texts.map((text, index) => ({ id: -(index + 1), body: text }));
    try {
      const saved = await recordGeneration(
        account.id,
        { period: params.period, mode: params.mode, tone: params.tone, length: params.length, focus: params.focus, draft: params.draft },
        texts
      );
      generationId = saved.generationId;
      suggestions = saved.suggestions;
    } catch (error) {
      // history persistence must never block showing fresh suggestions
      console.error("[ai] failed to record generation history", error);
    }

    return NextResponse.json({ generationId, suggestions });
  } catch (error) {
    const status = error instanceof AiProviderError ? error.status : 500;
    const message = error instanceof Error ? error.message : "AI failed.";

    console.error("[ai] message generation failed", { message, status });
    return NextResponse.json({ error: message }, { status });
  }
}
