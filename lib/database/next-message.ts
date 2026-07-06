import { Message, Period } from "@/lib/types";
import { ensureSchema, getSql, traceDb } from "./client";
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

  await traceDb("next.mark_sent", () => getSql()`
    insert into message_sends (message_id, period, channel)
    values (${result.id}, ${period}, 'shortcut')
  `);

  return result;
}

export async function previewNextMessage(period: Period) {
  await ensureSchema();
  return findNextMessage(period, { resetWhenExhausted: false });
}

export function isPeriod(value: unknown): value is Period {
  return value === "morning" || value === "night";
}

export async function forceNextMessage(id: number) {
  await ensureSchema();
  const rows = await traceDb("next.force", () => getSql()`
    insert into forced_next_messages (period, message_id, updated_at)
    select period, id, now()
    from messages
    where id = ${id}
      and active = true
    on conflict (period) do update
      set message_id = excluded.message_id,
          updated_at = now()
    returning period
  `);

  return (rows as { period: Period }[])[0] ?? null;
}

async function findNextMessage(period: Period, options: { resetWhenExhausted: boolean }): Promise<NextMessage | null> {
  const message = await findForced(period) ?? await findUnsent(period) ?? await findAfterExhaustion(period, options.resetWhenExhausted);
  if (!message) return null;

  const config = await getConfig();
  return {
    id: message.id,
    period,
    message: message.body.replaceAll("{name}", config.her_name || "my love")
  };
}

async function findForced(period: Period) {
  const rows = await traceDb("next.find_forced", () => getSql()`
    with forced as (
      delete from forced_next_messages
      where period = ${period}
      returning message_id
    )
    select m.id, m.period, m.body, m.active, m.created_at
    from messages m
    join forced f on f.message_id = m.id
    where m.active = true
  `);

  return (rows as Message[])[0] ?? null;
}

async function findUnsent(period: Period) {
  const rows = await traceDb("next.find_unsent", () => getSql()`
    select m.id, m.period, m.body, m.active, m.created_at
    from messages m
    where m.period = ${period}
      and m.active = true
      and not exists (select 1 from message_sends s where s.message_id = m.id)
    order by random()
    limit 1
  `);

  return (rows as Message[])[0] ?? null;
}

async function findAfterExhaustion(period: Period, resetWhenExhausted: boolean) {
  const activeCount = await traceDb("next.active_count", () => getSql()`
    select count(*)::text as count
    from messages
    where period = ${period}
      and active = true
  `);

  if (Number((activeCount as { count: string }[])[0]?.count ?? 0) === 0) return null;

  if (resetWhenExhausted) {
    await traceDb("next.reset_period", () => getSql()`delete from message_sends where period = ${period}`);
  }

  const rows = await traceDb("next.pick_after_reset", () => getSql()`
    select id, period, body, active, created_at
    from messages
    where period = ${period}
      and active = true
    order by random()
    limit 1
  `);

  return (rows as Message[])[0] ?? null;
}
