import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { DashboardStats, ApiResponse } from "@/lib/types"

export async function GET(): Promise<NextResponse<ApiResponse<DashboardStats>>> {
  try {
    // Get demo org ID (in production, this would come from auth)
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id

    // Get total employees
    const employeeCount = await sql`
      SELECT COUNT(*) as count FROM employees WHERE org_id = ${orgId} AND status = 'active'
    `

    // Get active payrolls (pending or processing)
    const activePayrolls = await sql`
      SELECT COUNT(*) as count FROM payrolls 
      WHERE org_id = ${orgId} AND status IN ('pending', 'processing')
    `

    // Get pending claims
    const pendingClaims = await sql`
      SELECT COUNT(*) as count FROM disbursements d
      JOIN payrolls p ON d.payroll_id = p.id
      WHERE p.org_id = ${orgId} AND d.status IN ('pending', 'committed', 'claimed')
    `

    // Calculate treasury balance (deposits - withdrawals + yields - fees)
    const treasuryBalance = await sql`
      SELECT COALESCE(SUM(
        CASE 
          WHEN type IN ('deposit', 'yield') THEN amount_usd
          WHEN type IN ('withdrawal', 'fee') THEN -amount_usd
          ELSE 0
        END
      ), 0) as balance
      FROM treasury_operations
      WHERE org_id = ${orgId}
    `

    // Get monthly payroll (sum of completed payrolls this month)
    const monthlyPayroll = await sql`
      SELECT COALESCE(SUM(total_usd), 0) as total
      FROM payrolls
      WHERE org_id = ${orgId} 
        AND status = 'completed'
        AND processed_at >= date_trunc('month', CURRENT_DATE)
    `

    // Get total yield earned
    const yieldEarned = await sql`
      SELECT COALESCE(SUM(amount_usd), 0) as total
      FROM treasury_operations
      WHERE org_id = ${orgId} AND type = 'yield'
    `

    const stats: DashboardStats = {
      totalEmployees: parseInt(employeeCount[0].count),
      activePayrolls: parseInt(activePayrolls[0].count),
      treasuryBalance: parseFloat(treasuryBalance[0].balance),
      pendingClaims: parseInt(pendingClaims[0].count),
      monthlyPayroll: parseFloat(monthlyPayroll[0].total),
      yieldEarned: parseFloat(yieldEarned[0].total),
    }

    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
