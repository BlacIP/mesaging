import { neon } from "@neondatabase/serverless";

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;
let schemaReady: Promise<void> | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }

  return sqlClient;
}

export async function ensureSchema() {
  // cache only successful runs — a transient connection failure must not
  // poison every later request with the same rejected promise
  schemaReady ??= createSchema().catch((error) => {
    schemaReady = null;
    throw error;
  });
  return schemaReady;
}

async function createSchema() {
  const sql = getSql();

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
