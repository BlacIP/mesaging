import { Period } from "@/lib/types";
import { AiProviderError, readableProviderError } from "./common";
import { createWithGemini } from "./gemini";
import { createWithOpenAi } from "./openai";

type AiMode = "generate" | "edit";

export { AiProviderError };

export async function createAiMessages(params: {
  draft: string;
  focus: string;
  herName: string;
  length: string;
  mode: AiMode;
  period: Period;
  tone: string;
}) {
  const prompt = promptFor(params);

  if (!process.env.OPENAI_API_KEY) return createWithGemini(prompt);

  try {
    return await createWithOpenAi(prompt);
  } catch (error) {
    if (!process.env.GEMINI_API_KEY) throw error;
    console.warn("[ai] OpenAI failed, falling back to Gemini", readableProviderError(error));
    return createWithGemini(prompt);
  }
}

function promptFor(params: {
  draft: string;
  focus: string;
  herName: string;
  length: string;
  mode: AiMode;
  period: Period;
  tone: string;
}) {
  const { draft, focus, herName, length, mode, period, tone } = params;
  const action = mode === "edit" ? "Rewrite this message" : "Write new messages";

  return [
    "You write warm, sincere romantic messages from a husband to his wife.",
    "Match this personal style: affectionate, playful, worshipful, direct, and emotionally specific.",
    "Messages may start with a short header like Ayomi😍🥰😘, Cupcake😍💙, or 😍💙, followed by the body on a new line.",
    "Use pet names like my beautiful wife, my beautiful angel, my queen, my love, sweetheart, or cupcake.",
    `Do not write awkward phrases like "beautiful ${herName || "Ayomi"}"; use her name only as a direct address when it sounds natural.`,
    "Use emojis warmly but not randomly. Morning can use sun, crown, heart. Night can use moon, sleepy, heart, prayer.",
    "Good style examples:",
    "Ayomi😍🥰😘\nGood morning to the woman who somehow looks like a gorgeous goddess even with messy morning hair. I’m so lucky to wake up next to you, Ayomi❤️. Have an amazing day, and don't forget to miss me! ☀️👑💖",
    "Cupcake😍💙\nGood Morning, Ayomi. Just a reminder that of all the hearts in the world, yours is the one I'd choose every single time. 💝",
    `${action} for ${period}. Her name is ${herName || "Ayomi"}.`,
    `Tone: ${tone}. Length: ${length}.`,
    "Return exactly 5 complete options. Wrap each option in <message> and </message>. No numbering or quotation marks.",
    focus ? `Extra direction: ${focus}` : "",
    draft ? `Draft/context: ${draft}` : ""
  ].filter(Boolean).join("\n");
}
