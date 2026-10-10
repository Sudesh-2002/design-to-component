import { NextRequest, NextResponse } from "next/server";
import { groq, VISION_MODEL } from "@/lib/ai";
import { IMAGE_ONLY_INSTRUCTION, SYSTEM_PROMPT } from "@/lib/prompts";
import type { GenerateRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PROMPT_LENGTH = 1000;
// Groq limits base64-encoded images to 4 MB
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;
const IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return jsonError("Server is missing GROQ_API_KEY.", 500);
  }

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const image = typeof body.image === "string" ? body.image : undefined;

  if (!prompt && !image) {
    return jsonError("Provide a description, an image, or both.", 400);
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return jsonError(`Description must be under ${MAX_PROMPT_LENGTH} characters.`, 400);
  }
  if (image) {
    if (!IMAGE_PREFIX.test(image)) {
      return jsonError("Image must be a PNG, JPEG or WebP data URL.", 400);
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return jsonError("Image is too large. Try a smaller screenshot.", 413);
    }
  }

  const userText = prompt || IMAGE_ONLY_INSTRUCTION;

  try {
    // Created before returning so provider errors surface as proper HTTP statuses
    const completion = await groq.chat.completions.create(
      {
        model: VISION_MODEL,
        stream: true,
        temperature: 0.3,
        max_completion_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: image
              ? [
                  { type: "text", text: userText },
                  { type: "image_url", image_url: { url: image } },
                ]
              : userText,
          },
        ],
      },
      { signal: req.signal }
    );

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        completion.controller.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const status =
      typeof err === "object" && err && "status" in err
        ? Number((err as { status: unknown }).status)
        : 500;

    if (status === 429) {
      return jsonError("Rate limit reached. Wait a moment and try again.", 429);
    }
    if (status === 401) {
      return jsonError("Invalid Groq API key.", 500);
    }
    console.error("[generate] provider error:", err);
    return jsonError("The AI provider failed. Please try again.", 502);
  }
}