export type Period = "morning" | "night";

export type Message = {
  id: number;
  period: Period;
  body: string;
  active?: boolean;
  created_at?: string;
  sent?: boolean;
};

export type BankMessage = Message & {
  created_at: string;
  forced_next: boolean;
  send_count: number;
  last_sent_at: string | null;
  next_reason: "forced" | "queued" | "cycle" | null;
  queued_next: boolean;
  sent: boolean;
};

export type AppConfig = {
  her_name: string;
  imessage_to: string;
  whatsapp_phone: string;
  morning_time: string;
  night_time: string;
  send_imessage: boolean;
  send_whatsapp: boolean;
};

export const emptyConfig: AppConfig = {
  her_name: "",
  imessage_to: "",
  whatsapp_phone: "",
  morning_time: "07:00",
  night_time: "22:00",
  send_imessage: true,
  send_whatsapp: true
};
