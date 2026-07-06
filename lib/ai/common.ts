export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export function parseSuggestions(text: string) {
  const tagged = [...text.matchAll(/<message>([\s\S]*?)<\/message>/gi)]
    .map((match) => match[1].trim())
    .filter(Boolean);

  if (tagged.length > 0) return tagged.slice(0, 5);

  return text
    .split("\n")
    .map((line) => line.replace(/^[-*\d. )]+/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export function readableProviderError(error: unknown) {
  return error instanceof Error ? { message: error.message } : { message: "Unknown provider error" };
}

export function unique(values: (string | undefined)[]) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean))] as string[];
}
