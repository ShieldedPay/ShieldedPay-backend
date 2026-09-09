import { describe, it, expect } from "vitest";
import {
  stellarAddressSchema,
  createEmployeeSchema,
  createPayrollSchema,
  claimWithdrawSchema,
} from "../lib/validation";

describe("Zod Request Validation Schemas", () => {
  const validStellar = "GBJNDNLZKN4TY5W5U2M5X6WTYF4VODLCRPQ2E22Q4N3A3B4C5D6E7F8G";

  it("validates 56-character Stellar public keys correctly", () => {
    expect(stellarAddressSchema.safeParse(validStellar).success).toBe(true);
    expect(stellarAddressSchema.safeParse("12345").success).toBe(false);
    expect(stellarAddressSchema.safeParse("SBJNDNLZKN4TY5W5U2M5X6WTYF4VODLCRPQ2E22Q4N3A3B4C5D6E7F8G").success).toBe(false); // Secret key starting with S
  });

  it("validates employee creation request body", () => {
    const valid = {
      organization_id: "org_1",
      name: "Marcus Vance",
      email: "marcus@company.com",
      country: "US",
      local_currency: "USD",
      wallet_address: validStellar,
    };
    expect(createEmployeeSchema.safeParse(valid).success).toBe(true);

    const invalidEmail = { ...valid, email: "not-an-email" };
    expect(createEmployeeSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it("validates payroll batch creation request body", () => {
    const valid = {
      organization_id: "org_1",
      period: "2026-03",
      employees: [
        {
          name: "Alice",
          email: "alice@company.com",
          amount_usd: 5000,
          local_currency: "USD",
          wallet_address: validStellar,
        },
      ],
      expiration_days: 90,
    };
    expect(createPayrollSchema.safeParse(valid).success).toBe(true);

    const emptyEmployees = { ...valid, employees: [] };
    expect(createPayrollSchema.safeParse(emptyEmployees).success).toBe(false);
  });

  it("validates claim withdrawal request body", () => {
    const valid = {
      destination_address: validStellar,
      nullifier: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    };
    expect(claimWithdrawSchema.safeParse(valid).success).toBe(true);

    const invalidAddress = { ...valid, destination_address: "invalid" };
    expect(claimWithdrawSchema.safeParse(invalidAddress).success).toBe(false);
  });
});
