import { describe, it, expect } from "vitest";
import { checkRateLimit, markNullifierSpent, isNullifierSpent } from "../lib/rate-limit";

describe("Rate Limiting & Replay Protection", () => {
  it("permits requests within quota and rejects when limit exceeded", () => {
    const key = `test_ip_${Date.now()}`;
    const limit = 3;

    // 1st request
    const r1 = checkRateLimit(key, limit, 10);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    // 2nd request
    const r2 = checkRateLimit(key, limit, 10);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    // 3rd request
    const r3 = checkRateLimit(key, limit, 10);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit
    const r4 = checkRateLimit(key, limit, 10);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetSeconds).toBeGreaterThan(0);
  });

  it("prevents double-spending using nullifier replay tracking", () => {
    const nullifier = "0x" + "a1".repeat(32);
    expect(isNullifierSpent(nullifier)).toBe(false);

    // First burn succeeds
    expect(markNullifierSpent(nullifier)).toBe(true);
    expect(isNullifierSpent(nullifier)).toBe(true);

    // Second burn fails (replay attack prevented)
    expect(markNullifierSpent(nullifier)).toBe(false);
  });
});
