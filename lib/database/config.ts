import { AppConfig, emptyConfig } from "@/lib/types";
import { ensureSchema, getSql } from "./client";

export async function getConfig(): Promise<AppConfig> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    select value
    from app_settings
    where key = 'config'
    limit 1
  `;

  return (rows as { value: AppConfig }[])[0]?.value ?? {
    ...emptyConfig,
    her_name: "My Love",
    send_imessage: true,
    send_whatsapp: true
  };
}

export async function saveConfig(config: AppConfig) {
  await ensureSchema();
  const sql = getSql();

  await sql`
    insert into app_settings (key, value, updated_at)
    values ('config', ${JSON.stringify(config)}, now())
    on conflict (key) do update
      set value = excluded.value,
          updated_at = now()
  `;
}
