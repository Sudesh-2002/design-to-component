import { NextRequest, NextResponse } from "next/server";
import { getGroq, VISION_MODEL } from "@/lib/ai";
import { IMAGE_ONLY_INSTRUCTION, SYSTEM_PROMPT } from "@/lib/prompts";
import {
  LIMITS,
  WINDOW_MINUTES,
  checkRateLimit,
  formatWait,
  type Identity,
  type LimitResult,
} from "@/lib/rate-limit";
import { getUserIdFromRequest, isAuthAvailable } from "@/lib/supabase/server-auth";
import type { GenerateRequest } from "@/types";

export const maxDuration = 60;

const MAX_PROMPT_LENGTH = 1000;
const MAX_IMAGE_CHARS = 4 * 1024 * 1024;
const MAX_BODY_BYTES = 4.5 * 1024 * 1024;
const IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,/;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function limitMessage(kind: Identity["kind"], result: LimitResult) {
  const base = `Rate limit reached (${LIMITS[kind].requests} generations per ${WINDOW_MINUTES} minutes). Try again in ${formatWait(result.retryAfterSec)}.`;
  return kind === "guest" && isAuthAvailable
    ? `${base} Sign in for a higher limit.`
    : base;
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    console.error("[generate] GROQ_API_KEY is not set.");
    return jsonError("The AI service isn't configured on the server yet.", 500);
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("Request is too large. Try a smaller screenshot.", 413);
  }

  const userId = await getUserIdFromRequest(req);
  const identity: Identity = userId
    ? { kind: "user", id: userId }
    : { kind: "guest", id: clientIp(req) };

  const limit = await checkRateLimit(identity);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: limitMessage(identity.kind, limit),
        retryAfter: limit.retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
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
        const completion = await getGroq().chat.completions.create(
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
      return jsonError(
        "The AI provider is busy right now. Wait a moment and try again.",
        429
      );
    }
    if (status === 401) {
      console.error("[generate] Groq rejected the API key.");
      return jsonError("The AI service isn't configured correctly.", 500);
    }
    console.error("[generate] provider error:", err);
    return jsonError("The AI provider failed. Please try again.", 502);
  }
}