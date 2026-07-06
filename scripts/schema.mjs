export async function createSchema(sql) {
  await sql`
    create table if not exists messages (
      id bigserial primary key,
      period text not null check (period in ('morning', 'night')),
      body text not null,
      active boolean not null default true,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists message_sends (
      id bigserial primary key,
      message_id bigint not null references messages(id) on delete cascade,
      period text not null check (period in ('morning', 'night')),
      channel text not null default 'shortcut',
      sent_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists app_settings (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create index if not exists messages_period_active_idx
    on messages(period, active, id)
  `;

  await sql`
    create index if not exists message_sends_message_id_idx
    on message_sends(message_id)
  `;
}
