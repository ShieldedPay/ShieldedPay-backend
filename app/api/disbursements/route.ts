import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { decryptName } from "@/lib/crypto"
import type { DisbursementWithEmployee, ApiResponse } from "@/lib/types"

export async function GET(): Promise<NextResponse<ApiResponse<DisbursementWithEmployee[]>>> {
  try {
    // Get demo org ID
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id

    const disbursements = await sql`
      SELECT 
        d.*,
        e.name_encrypted,
        e.country as employee_country
      FROM disbursements d
      JOIN payrolls p ON d.payroll_id = p.id
      JOIN employees e ON d.employee_id = e.id
      WHERE p.org_id = ${orgId}
      ORDER BY d.created_at DESC
      LIMIT 100
    `

    const result: DisbursementWithEmployee[] = disbursements.map((d: Record<string, any>) => ({
      id: d.id as string,
      payroll_id: d.payroll_id as string,
      employee_id: d.employee_id as string,
      amount_usd: d.amount_usd as number,
      amount_xlm: d.amount_xlm as number | null,
      status: d.status as DisbursementWithEmployee["status"],
      commitment_hash: d.commitment_hash as string | null,
      nullifier: d.nullifier as string | null,
      stellar_tx_hash: d.stellar_tx_hash as string | null,
      claim_token: d.claim_token as string | null,
      claimed_at: d.claimed_at as string | null,
      withdrawn_at: d.withdrawn_at as string | null,
      created_at: d.created_at as string,
      employee_name: decryptName(d.name_encrypted),
      employee_country: d.employee_country,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Disbursements fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch disbursements" },
      { status: 500 }
    )
  }
}
