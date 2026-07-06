import { neon } from "@neondatabase/serverless";
import { loadLocalEnv } from "./load-env.mjs";
import { createSchema } from "./schema.mjs";

loadLocalEnv();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
await createSchema(sql);

console.log("Database schema is ready.");
