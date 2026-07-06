import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

if (!response.ok) {
  console.error(`Gemini ListModels failed: ${response.status}`);
  console.error(await response.text());
  process.exit(1);
}

const data = await response.json();
const models = (data.models ?? [])
  .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
  .map((model) => model.name?.replace(/^models\//, ""))
  .filter(Boolean)
  .sort();

console.log("Gemini models with generateContent support:");
for (const model of models) console.log(`- ${model}`);
