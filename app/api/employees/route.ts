import { NextRequest, NextResponse } from "next/server";
import { sql, isDbConnected, mockDb } from "@/lib/db";
import { decryptName, encryptName, hashEmail } from "@/lib/crypto";
import { createEmployeeSchema, handleValidationError } from "@/lib/validation";
import type { EmployeeWithDecryptedName, ApiResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<ApiResponse<EmployeeWithDecryptedName[]>>> {
  try {
    if (!isDbConnected()) {
      return NextResponse.json({ success: true, data: mockDb.employees as any });
    }

    const orgs = await sql`SELECT id FROM organizations LIMIT 1`;
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 });
    }
    const orgId = orgs[0].id;

    const employees = await sql`
      SELECT id, org_id, external_id, email_hash, name_encrypted, 
             salary_usd, currency, country, status, stellar_address,
             created_at, updated_at
      FROM employees
      WHERE org_id = ${orgId}
      ORDER BY created_at DESC
    `;

    const decryptedEmployees: EmployeeWithDecryptedName[] = employees.map((emp: Record<string, any>) => ({
      id: emp.id,
      org_id: emp.org_id,
      external_id: emp.external_id,
      email_hash: emp.email_hash,
      name: decryptName(emp.name_encrypted),
      salary_usd: emp.salary_usd,
      currency: emp.currency,
      country: emp.country,
      status: emp.status,
      stellar_address: emp.stellar_address,
      created_at: emp.created_at,
      updated_at: emp.updated_at,
    }));

    return NextResponse.json({ success: true, data: decryptedEmployees });
  } catch (error) {
    console.error("Employees fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const rawBody = await request.json();
    const validation = createEmployeeSchema.safeParse(rawBody);

    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { organization_id, name, email, country, local_currency, wallet_address } = validation.data;
    const emailHash = hashEmail(email);
    const nameEncrypted = encryptName(name);
    const externalId = `EMP-${Date.now()}`;
    const employeeId = `emp_${Date.now()}`;

    const newEmployee = {
      id: employeeId,
      organization_id,
      name,
      email,
      country,
      local_currency,
      wallet_address,
      kyc_status: "verified",
      merkle_index: mockDb.employees.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isDbConnected()) {
      await sql`
        INSERT INTO employees (id, organization_id, name, email, country, local_currency, wallet_address, kyc_status)
        VALUES (${employeeId}, ${organization_id}, ${name}, ${email}, ${country}, ${local_currency}, ${wallet_address || null}, 'verified')
      `;
    } else {
      mockDb.employees.push(newEmployee as any);
    }

    return NextResponse.json({ success: true, data: newEmployee }, { status: 201 });
  } catch (error: any) {
    console.error("Employee create error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
