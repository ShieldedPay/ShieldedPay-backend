import { z } from "zod";
import { NextResponse } from "next/server";

// Stellar public key validator (G... 56 chars)
export const stellarAddressSchema = z
  .string()
  .regex(/^G[A-Z0-9]{55}$/, "Must be a valid 56-character Stellar public key starting with G");

// Employee creation schema
export const createEmployeeSchema = z.object({
  organization_id: z.string().min(1, "organization_id is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(2).max(3, "Country code must be 2-3 characters (e.g. US, GBR)"),
  local_currency: z.string().min(3).max(4, "Currency code must be 3-4 characters (e.g. USD, EUR)"),
  wallet_address: stellarAddressSchema.optional(),
});

// Payroll creation item schema
export const payrollEmployeeItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  amount_usd: z.number().positive("Amount must be greater than zero"),
  local_currency: z.string().default("USD"),
  wallet_address: stellarAddressSchema.optional(),
});

// Payroll batch creation schema
export const createPayrollSchema = z.object({
  organization_id: z.string().min(1, "organization_id is required"),
  period: z.string().min(1, "Period is required (e.g. 'October 2025' or '2026-03')"),
  employees: z.array(payrollEmployeeItemSchema).min(1, "At least one employee payment is required"),
  token_address: z.string().optional(),
  expiration_days: z.number().int().positive().default(90),
});

// Claim withdrawal schema
export const claimWithdrawSchema = z.object({
  destination_address: stellarAddressSchema,
  nullifier: z.string().regex(/^[0-9a-fA-F]{64}$/, "Nullifier must be a 64-character hex string").optional(),
  proof: z.array(z.string().regex(/^[0-9a-fA-F]{64}$/)).optional(),
});

// Helper to return standardized JSON error response
export function handleValidationError(error: z.ZodError): NextResponse {
  const issues = error.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
    code: i.code,
  }));

  return NextResponse.json(
    {
      error: "Validation Error",
      message: "One or more request parameters failed validation schema",
      details: issues,
    },
    { status: 400 }
  );
}
