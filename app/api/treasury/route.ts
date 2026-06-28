import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import type { TreasuryOperation, ApiResponse } from "@/lib/types"

interface TreasuryStats {
  balance: number
  totalDeposits: number
  totalWithdrawals: number
  totalYield: number
  operations: TreasuryOperation[]
}

export async function GET(): Promise<NextResponse<ApiResponse<TreasuryStats>>> {
  try {
    // Get demo org ID
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id

    // Get all operations
    const operations = await sql`
      SELECT * FROM treasury_operations 
      WHERE organization_id = ${orgId}
      ORDER BY created_at DESC
      LIMIT 50
    `

    // Calculate totals
    const totals = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
        COALESCE(SUM(CASE WHEN type = 'yield_credit' THEN amount ELSE 0 END), 0) as total_yield,
        COALESCE(SUM(CASE WHEN type = 'sweep' THEN amount ELSE 0 END), 0) as total_sweeps
      FROM treasury_operations
      WHERE organization_id = ${orgId}
    `

    const t = totals[0]
    const balance =
      parseFloat(t.total_deposits) +
      parseFloat(t.total_yield) -
      parseFloat(t.total_withdrawals) -
      parseFloat(t.total_sweeps)

    return NextResponse.json({
      success: true,
      data: {
        balance,
        totalDeposits: parseFloat(t.total_deposits),
        totalWithdrawals: parseFloat(t.total_withdrawals),
        totalYield: parseFloat(t.total_yield),
        operations: operations as TreasuryOperation[],
      },
    })
  } catch (error) {
    console.error("Treasury fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch treasury data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<TreasuryOperation>>> {
  try {
    const body = await request.json()
    const { type, amount, notes } = body

    if (!type || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["deposit", "withdrawal", "sweep", "yield_credit"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid operation type" },
        { status: 400 }
      )
    }

    // Get demo org ID and current balance
    const orgs = await sql`SELECT id, treasury_balance FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id
    const currentBalance = parseFloat(orgs[0].treasury_balance) || 0

    // Calculate new balance
    const amountNum = parseFloat(amount)
    let balanceAfter = currentBalance
    if (type === "deposit" || type === "yield_credit") {
      balanceAfter = currentBalance + amountNum
    } else {
      balanceAfter = currentBalance - amountNum
    }

    const result = await sql`
      INSERT INTO treasury_operations (organization_id, type, amount, balance_after, notes)
      VALUES (${orgId}, ${type}, ${amountNum}, ${balanceAfter}, ${notes || null})
      RETURNING *
    `

    // Update organization treasury balance
    await sql`
      UPDATE organizations SET treasury_balance = ${balanceAfter}, updated_at = NOW()
      WHERE id = ${orgId}
    `

    return NextResponse.json({ success: true, data: result[0] as TreasuryOperation }, { status: 201 })
  } catch (error) {
    console.error("Treasury operation error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create treasury operation" },
      { status: 500 }
    )
  }
}
