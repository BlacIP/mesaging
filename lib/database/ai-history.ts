import { Period } from "@/lib/types";
import { ensureSchema, getSql } from "./client";

export type AiSuggestionRecord = {
  id: number;
  body: string;
  used: boolean;
  added_message_id: number | null;
  in_bank: boolean;
};

export type AiGenerationRecord = {
  id: number;
  period: Period;
  mode: string;
  tone: string;
  length: string;
  focus: string;
  draft: string;
  created_at: string;
  suggestions: AiSuggestionRecord[];
};

export async function recordGeneration(
  params: { period: Period; mode: string; tone: string; length: string; focus: string; draft: string },
  suggestions: string[]
) {
  await ensureSchema();
  const sql = getSql();

  const [generation] = (await sql`
    insert into ai_generations (period, mode, tone, length, focus, draft)
    values (${params.period}, ${params.mode}, ${params.tone}, ${params.length}, ${params.focus}, ${params.draft})
    returning id
  `) as { id: number }[];

  const saved: { id: number; body: string }[] = [];
  for (const [position, body] of suggestions.entries()) {
    const [row] = (await sql`
      insert into ai_suggestions (generation_id, position, body)
      values (${generation.id}, ${position}, ${body})
      returning id, body
    `) as { id: number; body: string }[];
    saved.push(row);
  }

  return { generationId: generation.id, suggestions: saved };
}

export async function listGenerations(limit = 100) {
  await ensureSchema();
  const sql = getSql();

  const rows = (await sql`
    select
      g.id,
      g.period,
      g.mode,
      g.tone,
      g.length,
      g.focus,
      g.draft,
      g.created_at::text as created_at,
      s.id as suggestion_id,
      s.body,
      s.used,
      s.added_message_id,
      coalesce(m.active, false) as in_bank
    from ai_generations g
    left join ai_suggestions s on s.generation_id = g.id
    left join messages m on m.id = s.added_message_id
    where g.id in (
      select id from ai_generations order by id desc limit ${limit}
    )
    order by g.id desc, s.position asc, s.id asc
  `) as Array<{
    id: number;
    period: Period;
    mode: string;
    tone: string;
    length: string;
    focus: string;
    draft: string;
    created_at: string;
    suggestion_id: number | null;
    body: string | null;
    used: boolean | null;
    added_message_id: number | null;
    in_bank: boolean;
  }>;

  const generations = new Map<number, AiGenerationRecord>();
  for (const row of rows) {
    let generation = generations.get(row.id);
    if (!generation) {
      generation = {
        id: row.id,
        period: row.period,
        mode: row.mode,
        tone: row.tone,
        length: row.length,
        focus: row.focus,
        draft: row.draft,
        created_at: row.created_at,
        suggestions: []
      };
      generations.set(row.id, generation);
    }
    if (row.suggestion_id !== null && row.body !== null) {
      generation.suggestions.push({
        id: row.suggestion_id,
        body: row.body,
        used: Boolean(row.used),
        added_message_id: row.added_message_id,
        in_bank: row.in_bank
      });
    }
  }

  return Array.from(generations.values());
}

export async function getSuggestion(id: number) {
  await ensureSchema();
  const rows = (await getSql()`
    select s.id, s.body, s.added_message_id, g.period, coalesce(m.active, false) as in_bank
    from ai_suggestions s
    join ai_generations g on g.id = s.generation_id
    left join messages m on m.id = s.added_message_id
    where s.id = ${id}
  `) as Array<{ id: number; body: string; added_message_id: number | null; period: Period; in_bank: boolean }>;

  return rows[0] ?? null;
}

export async function markSuggestionUsed(id: number) {
  await ensureSchema();
  await getSql()`update ai_suggestions set used = true where id = ${id}`;
}

export async function linkSuggestionToMessage(id: number, messageId: number) {
  await ensureSchema();
  await getSql()`update ai_suggestions set added_message_id = ${messageId} where id = ${id}`;
}
