export { ensureSchema, getSql } from "./database/client";
export {
  getSuggestion,
  linkSuggestionToMessage,
  listGenerations,
  markSuggestionUsed,
  recordGeneration
} from "./database/ai-history";
export type { AiGenerationRecord, AiSuggestionRecord } from "./database/ai-history";
export { getConfig, saveConfig } from "./database/config";
export { addMessage, deleteMessage, listBankMessages, listMessages, updateMessage } from "./database/messages";
export { forceNextMessage, isPeriod, pickNextMessage, previewNextMessage } from "./database/next-message";
export type { AppConfig, BankMessage, Message, Period } from "./types";
