import { BankMessage, Message, Period } from "@/lib/types";
import { ensureSchema, getSql } from "./client";

export async function listMessages() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    select id, period, body, active, created_at
    from messages
    where active = true
    order by period, created_at desc, id desc
  `;

  return rows as Message[];
}

export async function listBankMessages() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    select
      m.id,
      m.period,
      m.body,
      m.active,
      m.created_at,
      count(s.id)::int as send_count,
      max(s.sent_at)::text as last_sent_at
    from messages m
    left join message_sends s on s.message_id = m.id
    where m.active = true
    group by m.id, m.period, m.body, m.active, m.created_at
    order by m.period, m.created_at desc, m.id desc
  `;

  return (rows as Omit<BankMessage, "sent">[]).map((message) => ({
    ...message,
    sent: message.send_count > 0
  }));
}

export async function addMessage(period: Period, body: string) {
  await ensureSchema();
  const rows = await getSql()`
    insert into messages (period, body)
    values (${period}, ${body})
    returning id, period, body, active, created_at
  `;

  return (rows as Message[])[0];
}

export async function deleteMessage(id: number) {
  await ensureSchema();
  await getSql()`
    update messages
    set active = false
    where id = ${id}
  `;
}
