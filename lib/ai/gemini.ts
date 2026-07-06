import { AiProviderError, parseSuggestions, unique } from "./common";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

export async function createWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  let lastError: AiProviderError | null = null;

  for (const model of geminiModels()) {
    try {
      return await createWithGeminiModel(prompt, apiKey, model);
    } catch (error) {
      if (!(error instanceof AiProviderError)) throw error;
      lastError = error;
      console.warn("[ai] Gemini model failed", { message: error.message, model, status: error.status });
    }
  }

  throw lastError ?? new AiProviderError("Gemini request failed.", 500);
}

function geminiModels() {
  return unique([
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_MODELS?.split(",") ?? []),
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite"
  ]);
}

async function createWithGeminiModel(prompt: string, apiKey: string, model: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );

  if (!response.ok) {
    throw new AiProviderError(await geminiErrorMessage(response), response.status);
  }

  const data = await response.json() as GeminiResponse;
  const text = data.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n") ?? "";
  const suggestions = parseSuggestions(text);

  if (suggestions.length === 0) {
    throw new AiProviderError("Gemini returned no message suggestions.", 502);
  }

  return suggestions;
}

async function geminiErrorMessage(response: Response) {
  try {
    const data = await response.json() as { error?: { message?: string; status?: string } };
    return data.error?.message ?? data.error?.status ?? "Gemini request failed.";
  } catch {
    return `Gemini request failed with status ${response.status}.`;
  }
}
