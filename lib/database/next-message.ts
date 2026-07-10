import { Message, Period } from "@/lib/types";
import { ensureSchema, getSql, traceDb } from "./client";
import { getConfig } from "./config";

type NextMessage = {
  body: string;
  id: number;
  period: Period;
  message: string;
};

export async function pickNextMessage(accountId: number, period: Period) {
  await ensureSchema();
  const result = await findNextMessage(accountId, period, { resetWhenExhausted: true });
  if (!result) return null;

  await traceDb("next.mark_sent", () => getSql()`
    insert into message_sends (account_id, message_id, period, channel)
    values (${accountId}, ${result.id}, ${period}, 'shortcut')
  `);

  return result;
}

export async function previewNextMessage(accountId: number, period: Period) {
  await ensureSchema();
  return findNextMessage(accountId, period, { resetWhenExhausted: false });
}

export function isPeriod(value: unknown): value is Period {
  return value === "morning" || value === "night";
}

export async function forceNextMessage(accountId: number, id: number) {
  await ensureSchema();
  const rows = await traceDb("next.force", () => getSql()`
    insert into forced_next_messages (account_id, period, message_id, updated_at)
    select account_id, period, id, now()
    from messages
    where id = ${id}
      and account_id = ${accountId}
      and active = true
    on conflict (account_id, period) do update
      set message_id = excluded.message_id,
          updated_at = now()
    returning period
  `);

  return (rows as { period: Period }[])[0] ?? null;
}

export async function cancelForcedNext(accountId: number, messageId: number) {
  await ensureSchema();
  const rows = await traceDb("next.cancel_force", () => getSql()`
    delete from forced_next_messages
    where account_id = ${accountId}
      and message_id = ${messageId}
    returning period
  `);

  return (rows as { period: Period }[])[0] ?? null;
}

async function findNextMessage(
  accountId: number,
  period: Period,
  options: { resetWhenExhausted: boolean }
): Promise<NextMessage | null> {
  const message = await findForced(accountId, period, options.resetWhenExhausted)
    ?? await findUnsent(accountId, period)
    ?? await findAfterExhaustion(accountId, period, options.resetWhenExhausted);
  if (!message) return null;

  const config = await getConfig(accountId);
  return {
    body: message.body,
    id: message.id,
    period,
    message: message.body.replaceAll("{name}", config.her_name || "my love")
  };
}

async function findForced(accountId: number, period: Period, consume: boolean) {
  if (!consume) {
    const previewRows = await traceDb("next.preview_forced", () => getSql()`
      select m.id, m.period, m.body, m.active, m.created_at
      from forced_next_messages f
      join messages m on m.id = f.message_id
      where f.period = ${period}
        and f.account_id = ${accountId}
        and m.active = true
    `);

    return (previewRows as Message[])[0] ?? null;
  }

  const rows = await traceDb("next.consume_forced", () => getSql()`
    with forced as (
      delete from forced_next_messages
      where period = ${period}
        and account_id = ${accountId}
      returning message_id
    )
    select m.id, m.period, m.body, m.active, m.created_at
    from messages m
    join forced f on f.message_id = m.id
    where m.active = true
  `);

  return (rows as Message[])[0] ?? null;
}

async function findUnsent(accountId: number, period: Period) {
  const rows = await traceDb("next.find_unsent", () => getSql()`
    select m.id, m.period, m.body, m.active, m.created_at
    from messages m
    where m.period = ${period}
      and m.account_id = ${accountId}
      and m.active = true
      and not exists (select 1 from message_sends s where s.message_id = m.id)
    order by m.created_at asc, m.id asc
    limit 1
  `);

  return (rows as Message[])[0] ?? null;
}

async function findAfterExhaustion(accountId: number, period: Period, resetWhenExhausted: boolean) {
  const activeCount = await traceDb("next.active_count", () => getSql()`
    select count(*)::text as count
    from messages
    where period = ${period}
      and account_id = ${accountId}
      and active = true
  `);

  if (Number((activeCount as { count: string }[])[0]?.count ?? 0) === 0) return null;

  if (resetWhenExhausted) {
    await traceDb("next.reset_period", () => getSql()`
      delete from message_sends
      where period = ${period}
        and account_id = ${accountId}
    `);
  }

  const rows = await traceDb("next.pick_after_reset", () => getSql()`
    select id, period, body, active, created_at
    from messages
    where period = ${period}
      and account_id = ${accountId}
      and active = true
    order by created_at asc, id asc
    limit 1
  `);

  return (rows as Message[])[0] ?? null;
}
