import { AiProviderError, parseSuggestions } from "./common";

export async function createWithOpenAi(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt
    })
  });

  if (!response.ok) {
    throw new AiProviderError(await openAiErrorMessage(response), response.status);
  }

  const data = await response.json() as { output_text?: string };
  const suggestions = parseSuggestions(data.output_text ?? "");

  if (suggestions.length === 0) {
    throw new AiProviderError("OpenAI returned no message suggestions.", 502);
  }

  return suggestions;
}

async function openAiErrorMessage(response: Response) {
  try {
    const data = await response.json() as { error?: { message?: string; type?: string } };
    return data.error?.message ?? data.error?.type ?? "OpenAI request failed.";
  } catch {
    return `OpenAI request failed with status ${response.status}.`;
  }
}
