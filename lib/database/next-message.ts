import { Message, Period } from "@/lib/types";
import { ensureSchema, getSql } from "./client";
import { getConfig } from "./config";

type NextMessage = {
  id: number;
  period: Period;
  message: string;
};

export async function pickNextMessage(period: Period) {
  await ensureSchema();
  const result = await findNextMessage(period, { resetWhenExhausted: true });
  if (!result) return null;

  await getSql()`
    insert into message_sends (message_id, period, channel)
    values (${result.id}, ${period}, 'shortcut')
  `;

  return result;
}

export async function previewNextMessage(period: Period) {
  await ensureSchema();
  return findNextMessage(period, { resetWhenExhausted: false });
}

export function isPeriod(value: unknown): value is Period {
  return value === "morning" || value === "night";
}

async function findNextMessage(period: Period, options: { resetWhenExhausted: boolean }): Promise<NextMessage | null> {
  const message = await findUnsent(period) ?? await findAfterExhaustion(period, options.resetWhenExhausted);
  if (!message) return null;

  const config = await getConfig();
  return {
    id: message.id,
    period,
    message: message.body.replaceAll("{name}", config.her_name || "my love")
  };
}

async function findUnsent(period: Period) {
  const rows = await getSql()`
    select m.id, m.period, m.body, m.active, m.created_at
    from messages m
    where m.period = ${period}
      and m.active = true
      and not exists (select 1 from message_sends s where s.message_id = m.id)
    order by random()
    limit 1
  `;

  return (rows as Message[])[0] ?? null;
}

async function findAfterExhaustion(period: Period, resetWhenExhausted: boolean) {
  const activeCount = await getSql()`
    select count(*)::text as count
    from messages
    where period = ${period}
      and active = true
  `;

  if (Number((activeCount as { count: string }[])[0]?.count ?? 0) === 0) return null;

  if (resetWhenExhausted) {
    await getSql()`delete from message_sends where period = ${period}`;
  }

  const rows = await getSql()`
    select id, period, body, active, created_at
    from messages
    where period = ${period}
      and active = true
    order by random()
    limit 1
  `;

  return (rows as Message[])[0] ?? null;
}
