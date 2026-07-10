import { createHash } from "node:crypto";
import { ensureSchema, getSql, traceDb } from "./client";

export type Account = {
  id: number;
  name: string;
  is_admin: boolean;
};

export type AccountStats = {
  id: number;
  name: string;
  is_admin: boolean;
  created_at: string;
  morning_count: number;
  night_count: number;
  send_count: number;
  generation_count: number;
  last_activity: string | null;
};

export function hashPasscode(passcode: string) {
  return createHash("sha256").update(passcode.trim()).digest("hex");
}

let accountSystemReady: Promise<void> | null = null;

/** Make sure the owner account exists (synced to APP_PASSCODE) and that any
 * pre-account rows are assigned to it. Cached per process; cache cleared on
 * failure so a transient outage does not poison later requests. */
export async function ensureAccountSystem() {
  accountSystemReady ??= bootstrapAccounts().catch((error) => {
    accountSystemReady = null;
    throw error;
  });
  return accountSystemReady;
}

async function bootstrapAccounts() {
  await ensureSchema();
  const sql = getSql();
  const secret = process.env.APP_PASSCODE?.trim();

  let owner = ((await sql`
    select id from accounts where is_admin = true order by id asc limit 1
  `) as { id: number }[])[0];

  if (!owner) {
    owner = ((await sql`
      insert into accounts (name, passcode_hash, is_admin)
      values ('Owner', ${hashPasscode(secret ?? "")}, true)
      returning id
    `) as { id: number }[])[0];
  } else if (secret) {
    // keep the owner row in sync when APP_PASSCODE is rotated
    await sql`
      update accounts set passcode_hash = ${hashPasscode(secret)}
      where id = ${owner.id} and passcode_hash <> ${hashPasscode(secret)}
    `;
  }

  await sql`update messages set account_id = ${owner.id} where account_id is null`;
  await sql`update message_sends set account_id = ${owner.id} where account_id is null`;
  await sql`update app_settings set account_id = ${owner.id} where account_id is null`;
  await sql`update forced_next_messages set account_id = ${owner.id} where account_id is null`;
  await sql`update ai_generations set account_id = ${owner.id} where account_id is null`;
}

export async function findAccountByPasscode(passcode: string): Promise<Account | null> {
  await ensureAccountSystem();
  const rows = (await traceDb("accounts.find", () => getSql()`
    select id, name, is_admin
    from accounts
    where passcode_hash = ${hashPasscode(passcode)}
    limit 1
  `)) as Account[];

  return rows[0] ?? null;
}

/** Dev fallback: with no APP_PASSCODE configured, requests resolve to the owner. */
export async function findOwnerAccount(): Promise<Account | null> {
  await ensureAccountSystem();
  const rows = (await getSql()`
    select id, name, is_admin from accounts where is_admin = true order by id asc limit 1
  `) as Account[];

  return rows[0] ?? null;
}

export async function createAccount(name: string, passcode: string): Promise<Account | { error: string }> {
  await ensureAccountSystem();
  const taken = await findAccountByPasscode(passcode);
  if (taken) return { error: "That passcode is already in use — pick a different one." };

  const nameTaken = (await getSql()`
    select 1 from accounts where lower(name) = lower(${name.trim()}) limit 1
  `) as unknown[];
  if (nameTaken.length > 0) {
    return { error: "That space name is already taken — pick a different one." };
  }

  try {
    const rows = (await traceDb("accounts.create", () => getSql()`
      insert into accounts (name, passcode_hash)
      values (${name.trim()}, ${hashPasscode(passcode)})
      returning id, name, is_admin
    `)) as Account[];

    return rows[0];
  } catch {
    // unique index backstop for two simultaneous signups with the same name
    return { error: "That space name is already taken — pick a different one." };
  }
}

async function passcodeInUse(passcode: string, exceptAccountId?: number) {
  const rows = (await getSql()`
    select 1 from accounts
    where passcode_hash = ${hashPasscode(passcode)}
      and id <> ${exceptAccountId ?? -1}
    limit 1
  `) as unknown[];
  return rows.length > 0;
}

/** Signed-in user picks a new passcode (proof of the old one is the fact they
 * are authenticated). Owner is excluded — their passcode is APP_PASSCODE. */
export async function updatePasscode(accountId: number, newPasscode: string): Promise<{ ok: true } | { error: string }> {
  await ensureAccountSystem();
  if (await passcodeInUse(newPasscode, accountId)) {
    return { error: "That passcode is already in use — pick a different one." };
  }

  await traceDb("accounts.update_passcode", () => getSql()`
    update accounts
    set passcode_hash = ${hashPasscode(newPasscode)}
    where id = ${accountId} and is_admin = false
  `);

  return { ok: true };
}

/** Forgot-passcode flow: the signup name is the recovery credential.
 * The owner account is excluded — its passcode is APP_PASSCODE. */
export async function resetPasscodeByName(name: string, newPasscode: string): Promise<Account | { error: string }> {
  await ensureAccountSystem();
  const matches = (await traceDb("accounts.find_reset", () => getSql()`
    select id, name, is_admin from accounts
    where lower(name) = lower(${name.trim()})
      and is_admin = false
  `)) as Account[];

  if (matches.length === 0) {
    return { error: "No space found with that name." };
  }
  if (await passcodeInUse(newPasscode, matches[0].id)) {
    return { error: "That passcode is already in use — pick a different one." };
  }

  await traceDb("accounts.reset_passcode", () => getSql()`
    update accounts
    set passcode_hash = ${hashPasscode(newPasscode)}
    where id = ${matches[0].id}
  `);

  return matches[0];
}

export async function listAccountsWithStats(): Promise<AccountStats[]> {
  await ensureAccountSystem();
  const rows = (await traceDb("accounts.list", () => getSql()`
    select
      a.id,
      a.name,
      a.is_admin,
      a.created_at::text as created_at,
      count(m.id) filter (where m.period = 'morning' and m.active) ::int as morning_count,
      count(m.id) filter (where m.period = 'night' and m.active) ::int as night_count,
      (select count(*)::int from message_sends s where s.account_id = a.id) as send_count,
      (select count(*)::int from ai_generations g where g.account_id = a.id) as generation_count,
      greatest(
        max(m.created_at),
        (select max(s.sent_at) from message_sends s where s.account_id = a.id),
        (select max(g.created_at) from ai_generations g where g.account_id = a.id)
      )::text as last_activity
    from accounts a
    left join messages m on m.account_id = a.id
    group by a.id, a.name, a.is_admin, a.created_at
    order by a.created_at asc
  `)) as AccountStats[];

  return rows;
}
