import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface LimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

export type Identity = { kind: "user" | "guest"; id: string };

export const WINDOW_MINUTES = 10;
export const LIMITS = {
  guest: { requests: 5 },
  user: { requests: 20 },
} as const;

const UPSTASH_WINDOW = "10 m";
const WINDOW_MS = WINDOW_MINUTES * 60 * 1000;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const limiters = redis
  ? {
      guest: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(LIMITS.guest.requests, UPSTASH_WINDOW),
        prefix: "rl:guest",
        timeout: 2000,
      }),
      user: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(LIMITS.user.requests, UPSTASH_WINDOW),
        prefix: "rl:user",
        timeout: 2000,
      }),
    }
  : null;

const hits = new Map<string, number[]>();

export function memoryLimit(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now()
): LimitResult {
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);

  if (recent.length >= max) {
    hits.set(key, recent);
    return {
      allowed: false,
      limit: max,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)),
    };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 10_000) {
    for (const [k, times] of hits) {
      if (times[times.length - 1] <= cutoff) hits.delete(k);
    }
  }

  return {
    allowed: true,
    limit: max,
    remaining: max - recent.length,
    retryAfterSec: 0,
  };
}

export function clearMemoryLimits() {
  hits.clear();
}

export async function checkRateLimit({ kind, id }: Identity): Promise<LimitResult> {
  const max = LIMITS[kind].requests;

  if (!limiters) return memoryLimit(`${kind}:${id}`, max, WINDOW_MS);

  try {
    const res = await limiters[kind].limit(id);
    return {
      allowed: res.success,
      limit: res.limit,
      remaining: res.remaining,
      retryAfterSec: res.success
        ? 0
        : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
    };
  } catch (err) {
    console.error("[rate-limit] Upstash failed, allowing the request:", err);
    return { allowed: true, limit: max, remaining: 0, retryAfterSec: 0 };
  }
}

export function formatWait(sec: number): string {
  if (sec < 60) return `${sec} second${sec === 1 ? "" : "s"}`;
  const min = Math.ceil(sec / 60);
  return `${min} minute${min === 1 ? "" : "s"}`;
}