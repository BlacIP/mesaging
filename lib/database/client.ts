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

export async function traceDb<T>(label: string, action: () => Promise<T>) {
  const started = Date.now();

  try {
    const result = await action();
    if (process.env.DEBUG_DB === "1") {
      const count = Array.isArray(result) ? ` rows=${result.length}` : "";
      console.log(`[db] ${label} ok ${Date.now() - started}ms${count}`);
    }
    return result;
  } catch (error) {
    if (process.env.DEBUG_DB === "1") {
      console.error(`[db] ${label} failed ${Date.now() - started}ms`, error);
    }
    throw error;
  }
}

async function createSchema() {
  const sql = getSql();

  await sql`
    create table if not exists accounts (
      id bigserial primary key,
      name text not null,
      passcode_hash text not null unique,
      is_admin boolean not null default false,
      created_at timestamptz not null default now()
    )
  `;

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
    create table if not exists forced_next_messages (
      period text primary key check (period in ('morning', 'night')),
      message_id bigint not null references messages(id) on delete cascade,
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists ai_generations (
      id bigserial primary key,
      period text not null check (period in ('morning', 'night')),
      mode text not null default 'generate',
      tone text not null default '',
      length text not null default '',
      focus text not null default '',
      draft text not null default '',
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists ai_suggestions (
      id bigserial primary key,
      generation_id bigint not null references ai_generations(id) on delete cascade,
      position int not null default 0,
      body text not null,
      used boolean not null default false,
      added_message_id bigint references messages(id) on delete set null,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create index if not exists ai_suggestions_generation_idx
    on ai_suggestions(generation_id)
  `;

  await sql`
    create index if not exists messages_period_active_idx
    on messages(period, active, id)
  `;

  await sql`
    create index if not exists message_sends_message_id_idx
    on message_sends(message_id)
  `;

  // ---- multi-account migration: add account_id to every data table.
  // Existing rows are backfilled to the owner account in ensureAccountSystem.
  await sql`alter table messages add column if not exists account_id bigint references accounts(id) on delete cascade`;
  await sql`alter table message_sends add column if not exists account_id bigint references accounts(id) on delete cascade`;
  await sql`alter table app_settings add column if not exists account_id bigint references accounts(id) on delete cascade`;
  await sql`alter table forced_next_messages add column if not exists account_id bigint references accounts(id) on delete cascade`;
  await sql`alter table ai_generations add column if not exists account_id bigint references accounts(id) on delete cascade`;

  // settings and forced-next were keyed globally; they are now unique per account
  await sql`alter table app_settings drop constraint if exists app_settings_pkey`;
  await sql`create unique index if not exists app_settings_account_key_idx on app_settings(account_id, key)`;
  await sql`alter table forced_next_messages drop constraint if exists forced_next_messages_pkey`;
  await sql`create unique index if not exists forced_next_account_period_idx on forced_next_messages(account_id, period)`;

  await sql`create index if not exists messages_account_idx on messages(account_id, period, active)`;

  // space names are unique (case-insensitive) — they double as the recovery credential
  await sql`create unique index if not exists accounts_name_unique_idx on accounts (lower(name))`;
}
