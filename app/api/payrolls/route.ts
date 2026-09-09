import { NextRequest, NextResponse } from "next/server";
import { sql, isDbConnected, mockDb } from "@/lib/db";
import { usdToXlm } from "@/lib/crypto";
import { buildMerkleTree, computeDisbursementLeaf } from "@/services/merkle";
import { issueVoucherToken } from "@/services/voucher";
import { createPayrollSchema, handleValidationError } from "@/lib/validation";
import type { Payroll, ApiResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<ApiResponse<Payroll[]>>> {
  try {
    if (!isDbConnected()) {
      return NextResponse.json({ success: true, data: mockDb.payrolls as Payroll[] });
    }

    const orgs = await sql`SELECT id FROM organizations LIMIT 1`;
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 });
    }
    const orgId = orgs[0].id;

    const payrolls = await sql`
      SELECT id, org_id, period_start, period_end, status, total_usd, 
             employee_count, merkle_root, created_at, processed_at
      FROM payrolls
      WHERE org_id = ${orgId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ success: true, data: payrolls as Payroll[] });
  } catch (error) {
    console.error("Payrolls fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payrolls" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<any>> {
  try {
    const rawBody = await request.json();
    const validation = createPayrollSchema.safeParse(rawBody);

    if (!validation.success) {
      return handleValidationError(validation.error);
    }

    const { organization_id, period, employees, token_address, expiration_days } = validation.data;
    const token = token_address || "native_xlm";

    // 1. Build leaves and Merkle tree using domain separation (0x00 leaf, 0x01 branch)
    const leaves: string[] = [];
    const disbursementItems: any[] = [];
    const now = new Date();
    const expiresAt = Math.floor(now.getTime() / 1000) + expiration_days * 86400;

    employees.forEach((emp, index) => {
      const salt = Buffer.from(Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))).toString("hex");
      const recipient = emp.wallet_address || `did:stellar:emp_${index}_${emp.email}`;
      const leaf = computeDisbursementLeaf(recipient, emp.amount_usd, token, salt);
      leaves.push(leaf);

      const voucherToken = issueVoucherToken({
        batch_id: `batch_${Date.now()}`,
        employee_index: index,
        amount: emp.amount_usd,
        currency: emp.local_currency || "USD",
        expires_at: expiresAt,
      });

      disbursementItems.push({
        recipient,
        amount_usd: emp.amount_usd,
        amount_xlm: usdToXlm(emp.amount_usd),
        salt,
        leaf,
        voucher_token: voucherToken,
        currency: emp.local_currency || "USD",
      });
    });

    const { root: merkleRoot, proofs } = buildMerkleTree(leaves);
    const totalAmount = employees.reduce((sum, e) => sum + e.amount_usd, 0);
    const payrollId = `pr_${Date.now()}`;

    const payrollRecord = {
      id: payrollId,
      organization_id,
      period,
      status: "committed",
      total_amount: totalAmount,
      employee_count: employees.length,
      merkle_root: merkleRoot,
      created_at: now.toISOString(),
      processed_at: now.toISOString(),
      expiration_timestamp: expiresAt,
    };

    if (isDbConnected()) {
      await sql`
        INSERT INTO payrolls (id, organization_id, period, status, total_amount, employee_count, merkle_root)
        VALUES (${payrollId}, ${organization_id}, ${period}, 'committed', ${totalAmount}, ${employees.length}, ${merkleRoot})
      `;
    } else {
      mockDb.payrolls.unshift(payrollRecord);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          payroll: payrollRecord,
          merkle_root: merkleRoot,
          disbursements: disbursementItems.map((d, i) => ({
            ...d,
            proof: proofs[i],
            leaf_index: i,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Payroll create error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payroll batch" },
      { status: 500 }
    );
  }
}
