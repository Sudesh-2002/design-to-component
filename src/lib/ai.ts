import Groq from "groq-sdk";

export const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "qwen/qwen3.8-27b";

let client: Groq | null = null;

export function getGroq(): Groq {
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}
