import { AppConfig, emptyConfig } from "@/lib/types";
import { ensureSchema, getSql, traceDb } from "./client";

export async function getConfig(accountId: number): Promise<AppConfig> {
  await ensureSchema();
  const sql = getSql();
  const rows = await traceDb("config.get", () => sql`
    select value
    from app_settings
    where key = 'config'
      and account_id = ${accountId}
    limit 1
  `);

  return (rows as { value: AppConfig }[])[0]?.value ?? {
    ...emptyConfig,
    her_name: "My Love",
    send_imessage: true,
    send_whatsapp: true
  };
}

export async function saveConfig(accountId: number, config: AppConfig) {
  await ensureSchema();
  const sql = getSql();

  await traceDb("config.save", () => sql`
    insert into app_settings (account_id, key, value, updated_at)
    values (${accountId}, 'config', ${JSON.stringify(config)}, now())
    on conflict (account_id, key) do update
      set value = excluded.value,
          updated_at = now()
  `);
}
