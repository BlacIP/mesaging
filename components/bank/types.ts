import { BankMessage } from "@/lib/types";

export type PeriodFilter = "all" | "morning" | "night";
export type StatusFilter = "all" | "sent" | "unsent";

export type BankConfig = {
  her_name: string;
};

export type BankCache = {
  messages: BankMessage[];
  config: BankConfig;
  savedAt: number;
};
