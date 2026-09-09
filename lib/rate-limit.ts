import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache
const rateLimitCache = new Map<string, RateLimitRecord>();
const spentNullifiers = new Set<string>();

/**
 * Check rate limit for a key (IP or wallet address)
 * Defaults to 10 requests per 60 seconds.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowSeconds: number = 60
): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = rateLimitCache.get(key);

  if (!record || now > record.resetTime) {
    rateLimitCache.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetSeconds: windowSeconds };
  }

  if (record.count >= limit) {
    const remainingTime = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, resetSeconds: Math.max(1, remainingTime) };
  }

  record.count += 1;
  const remainingTime = Math.ceil((record.resetTime - now) / 1000);
  return { allowed: true, remaining: limit - record.count, resetSeconds: remainingTime };
}

/**
 * Middleware helper that returns HTTP 429 Response if rate limit is exceeded
 */
export function enforceRateLimit(
  req: Request,
  identifier: string = "default",
  limit: number = 10,
  windowSeconds: number = 60
): NextResponse | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const rateLimitKey = `${identifier}:${ip}`;

  const { allowed, remaining, resetSeconds } = checkRateLimit(rateLimitKey, limit, windowSeconds);

  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded. Please retry after ${resetSeconds} seconds.`,
        retryAfter: resetSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(resetSeconds),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetSeconds),
        },
      }
    );
  }

  return null;
}

/**
 * Replay protection: records and checks spent nullifiers
 */
export function markNullifierSpent(nullifier: string): boolean {
  if (spentNullifiers.has(nullifier)) {
    return false; // Already spent
  }
  spentNullifiers.add(nullifier);
  return true;
}

export function isNullifierSpent(nullifier: string): boolean {
  return spentNullifiers.has(nullifier);
}
