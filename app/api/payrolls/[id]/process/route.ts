import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { Payroll, ApiResponse } from "@/lib/types"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Payroll>>> {
  try {
    const { id } = await params

    // Get payroll
    const payrolls = await sql`
      SELECT * FROM payrolls WHERE id = ${id}
    `

    if (payrolls.length === 0) {
      return NextResponse.json({ success: false, error: "Payroll not found" }, { status: 404 })
    }

    const payroll = payrolls[0]

    if (payroll.status !== "draft" && payroll.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Cannot process payroll with status: ${payroll.status}` },
        { status: 400 }
      )
    }

    // Update status to processing
    await sql`UPDATE payrolls SET status = 'processing' WHERE id = ${id}`

    // Simulate processing delay (in production, this would be async)
    // Update disbursements to committed status
    await sql`
      UPDATE disbursements 
      SET status = 'committed', 
          stellar_tx_hash = 'sim_tx_' || gen_random_uuid()::text
      WHERE payroll_id = ${id} AND status = 'pending'
    `

    // Record treasury withdrawal for payroll
    await sql`
      INSERT INTO treasury_operations (org_id, type, amount_usd, description)
      VALUES (${payroll.org_id}, 'withdrawal', ${payroll.total_usd}, ${'Payroll: ' + payroll.period_start + ' to ' + payroll.period_end})
    `

    // Mark payroll as completed
    const result = await sql`
      UPDATE payrolls 
      SET status = 'completed', processed_at = CURRENT_TIMESTAMP 
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, data: result[0] as Payroll })
  } catch (error) {
    console.error("Payroll process error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process payroll" },
      { status: 500 }
    )
  }
}
