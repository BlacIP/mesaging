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
    with next_by_period as (
      select
        p.period,
        coalesce(forced.id, unsent.id, cycle.id) as message_id,
        case
          when forced.id is not null then 'forced'
          when unsent.id is not null then 'queued'
          when cycle.id is not null then 'cycle'
          else null
        end as reason
      from (values ('morning'), ('night')) as p(period)
      left join lateral (
        select f.message_id as id
        from forced_next_messages f
        join messages m on m.id = f.message_id
        where f.period = p.period and m.active = true
        limit 1
      ) forced on true
      left join lateral (
        select id
        from messages m
        where m.period = p.period
          and m.active = true
          and not exists (select 1 from message_sends s where s.message_id = m.id)
        order by m.created_at asc, m.id asc
        limit 1
      ) unsent on true
      left join lateral (
        select id
        from messages m
        where m.period = p.period and m.active = true
        order by m.created_at asc, m.id asc
        limit 1
      ) cycle on true
    )
    select
      m.id,
      m.period,
      m.body,
      m.active,
      m.created_at,
      count(s.id)::int as send_count,
      max(s.sent_at)::text as last_sent_at,
      (f.message_id is not null) as forced_next,
      (n.message_id = m.id) as queued_next,
      case when n.message_id = m.id then n.reason else null end as next_reason
    from messages m
    left join message_sends s on s.message_id = m.id
    left join forced_next_messages f on f.message_id = m.id and f.period = m.period
    left join next_by_period n on n.message_id = m.id and n.period = m.period
    where m.active = true
    group by m.id, m.period, m.body, m.active, m.created_at, f.message_id, n.message_id, n.reason
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
