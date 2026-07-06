import { BankMessage, Message, Period } from "@/lib/types";
import { ensureSchema, getSql, traceDb } from "./client";

export async function listMessages() {
  await ensureSchema();
  const sql = getSql();
  const rows = await traceDb("messages.list", () => sql`
    select id, period, body, active, created_at
    from messages
    where active = true
    order by period, created_at desc, id desc
  `);

  return rows as Message[];
}

export async function listBankMessages() {
  await ensureSchema();
  const sql = getSql();
  const rows = await traceDb("messages.bank", () => sql`
    select
      m.id,
      m.period,
      m.body,
      m.active,
      m.created_at,
      count(s.id)::int as send_count,
      max(s.sent_at)::text as last_sent_at,
      (f.message_id is not null) as forced_next
    from messages m
    left join message_sends s on s.message_id = m.id
    left join forced_next_messages f on f.message_id = m.id and f.period = m.period
    where m.active = true
    group by m.id, m.period, m.body, m.active, m.created_at, f.message_id
    order by m.period, m.created_at desc, m.id desc
  `);

  return (rows as Omit<BankMessage, "sent">[]).map((message) => ({
    ...message,
    sent: message.send_count > 0
  }));
}

export async function addMessage(period: Period, body: string) {
  await ensureSchema();
  const rows = await traceDb("messages.add", () => getSql()`
    insert into messages (period, body)
    values (${period}, ${body})
    returning id, period, body, active, created_at
  `);

  return (rows as Message[])[0];
}

export async function deleteMessage(id: number) {
  await ensureSchema();
  await traceDb("messages.delete", () => getSql()`
    update messages
    set active = false
    where id = ${id}
  `);
}

export async function updateMessage(id: number, body: string) {
  await ensureSchema();
  const rows = await traceDb("messages.update", () => getSql()`
    update messages
    set body = ${body}
    where id = ${id}
      and active = true
    returning id, period, body, active, created_at
  `);

  return (rows as Message[])[0] ?? null;
}
