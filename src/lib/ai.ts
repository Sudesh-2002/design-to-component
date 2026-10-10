import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. Add it to .env.local.");
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";