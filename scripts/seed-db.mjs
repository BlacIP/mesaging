import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import { createSchema } from "./schema.mjs";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await createSchema(sql);

const messages = JSON.parse(await fs.readFile("messages.json", "utf8"));
const config = JSON.parse(await fs.readFile("config.json", "utf8"));

let inserted = 0;

for (const period of ["morning", "night"]) {
  for (const body of messages[period] ?? []) {
    const existing = await sql`
      select id
      from messages
      where period = ${period}
        and body = ${body}
      limit 1
    `;

    if (existing.length === 0) {
      await sql`
        insert into messages (period, body)
        values (${period}, ${body})
      `;
      inserted += 1;
    }
  }
}

await sql`
  insert into app_settings (key, value, updated_at)
  values ('config', ${JSON.stringify(config)}, now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now()
`;

console.log(`Seed complete. Inserted ${inserted} new messages.`);
