import { describe, it, expect } from "vitest";
import { issueVoucherToken, verifyVoucherToken } from "../services/voucher";

describe("Cryptographic Voucher Service (HMAC-SHA256)", () => {
  it("generates and verifies valid voucher token", () => {
    const payload = {
      batch_id: "batch_2026_03",
      employee_index: 2,
      amount: 4500,
      currency: "USDC",
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour in future
    };

    const token = issueVoucherToken(payload);
    expect(token).toContain(".");

    const result = verifyVoucherToken(token);
    expect(result.valid).toBe(true);
    expect(result.payload?.batch_id).toBe("batch_2026_03");
    expect(result.payload?.amount).toBe(4500);
    expect(result.payload?.employee_index).toBe(2);
  });

  it("detects and rejects tampered payload data", () => {
    const payload = {
      batch_id: "batch_2026_03",
      employee_index: 0,
      amount: 1000,
      currency: "USD",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const token = issueVoucherToken(payload);
    const [dataB64, sig] = token.split(".");

    // Tamper with payload (change amount to 999999)
    const tamperedPayload = { ...payload, amount: 999999 };
    const tamperedB64 = Buffer.from(JSON.stringify(tamperedPayload)).toString("base64url");
    const tamperedToken = `${tamperedB64}.${sig}`;

    const result = verifyVoucherToken(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Invalid voucher signature|tampered/i);
  });

  it("rejects expired vouchers", () => {
    const expiredPayload = {
      batch_id: "batch_old",
      employee_index: 1,
      amount: 500,
      currency: "USD",
      expires_at: Math.floor(Date.now() / 1000) - 100, // 100 seconds in past
    };

    const token = issueVoucherToken(expiredPayload);
    const result = verifyVoucherToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/expired/i);
  });
});
