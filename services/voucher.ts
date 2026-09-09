import { createHmac, timingSafeEqual } from "crypto";

export interface VoucherPayload {
  batch_id: string;
  employee_index: number;
  amount: number;
  currency: string;
  expires_at: number; // Unix timestamp in seconds
}

export interface VoucherVerificationResult {
  valid: boolean;
  payload?: VoucherPayload;
  error?: string;
}

const SECRET_KEY = process.env.VOUCHER_SECRET || "shieldedpay-default-voucher-signing-key-32b";

/**
 * Signs and packages a voucher payload into an HMAC-authenticated token
 */
export function issueVoucherToken(payload: VoucherPayload): string {
  const json = JSON.stringify(payload);
  const dataB64 = Buffer.from(json, "utf-8").toString("base64url");
  const hmac = createHmac("sha256", SECRET_KEY).update(dataB64).digest("base64url");
  return `${dataB64}.${hmac}`;
}

/**
 * Verifies an HMAC-authenticated voucher token and checks expiry
 */
export function verifyVoucherToken(token: string): VoucherVerificationResult {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Malformed voucher token structure" };
  }

  const [dataB64, signature] = parts;

  // Recompute expected HMAC
  const expectedHmac = createHmac("sha256", SECRET_KEY).update(dataB64).digest("base64url");

  // Constant-time signature comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature, "utf-8");
  const expectedBuf = Buffer.from(expectedHmac, "utf-8");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return { valid: false, error: "Invalid voucher signature or tampered payload" };
  }

  try {
    const rawJson = Buffer.from(dataB64, "base64url").toString("utf-8");
    const payload = JSON.parse(rawJson) as VoucherPayload;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.expires_at && nowSeconds > payload.expires_at) {
      return { valid: false, payload, error: "Voucher has expired" };
    }

    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: `Corrupted voucher payload: ${e.message}` };
  }
}
