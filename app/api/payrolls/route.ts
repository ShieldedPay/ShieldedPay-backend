import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateCommitment, generateSecret, generateClaimToken, generateMerkleRoot, usdToXlm } from "@/lib/crypto"
import type { Payroll, ApiResponse } from "@/lib/types"

export async function GET(): Promise<NextResponse<ApiResponse<Payroll[]>>> {
  try {
    // Get demo org ID
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id

    const payrolls = await sql`
      SELECT id, org_id, period_start, period_end, status, total_usd, 
             employee_count, merkle_root, created_at, processed_at
      FROM payrolls
      WHERE org_id = ${orgId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({ success: true, data: payrolls as Payroll[] })
  } catch (error) {
    console.error("Payrolls fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch payrolls" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Payroll>>> {
  try {
    const body = await request.json()
    const { period_start, period_end, employee_ids } = body

    if (!period_start || !period_end) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get demo org ID
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id

    // Get active employees (or specific ones if provided)
    let employees
    if (employee_ids && employee_ids.length > 0) {
      employees = await sql`
        SELECT id, salary_usd FROM employees 
        WHERE org_id = ${orgId} AND id = ANY(${employee_ids}) AND status = 'active'
      `
    } else {
      employees = await sql`
        SELECT id, salary_usd FROM employees 
        WHERE org_id = ${orgId} AND status = 'active'
      `
    }

    if (employees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active employees found" },
        { status: 400 }
      )
    }

    // Calculate total
    const totalUsd = employees.reduce((sum: number, emp: Record<string, any>) => sum + Number(emp.salary_usd), 0)

    // Create payroll
    const payrollResult = await sql`
      INSERT INTO payrolls (org_id, period_start, period_end, status, total_usd, employee_count)
      VALUES (${orgId}, ${period_start}, ${period_end}, 'draft', ${totalUsd}, ${employees.length})
      RETURNING id, org_id, period_start, period_end, status, total_usd, employee_count, merkle_root, created_at, processed_at
    `

    const payroll = payrollResult[0]

    // Create disbursements for each employee
    const commitments: string[] = []
    for (const emp of employees) {
      const secret = generateSecret()
      const commitment = generateCommitment(secret, emp.salary_usd, emp.id)
      const claimToken = generateClaimToken()
      const amountXlm = usdToXlm(emp.salary_usd)

      commitments.push(commitment)

      await sql`
        INSERT INTO disbursements (payroll_id, employee_id, amount_usd, amount_xlm, status, commitment_hash, claim_token)
        VALUES (${payroll.id}, ${emp.id}, ${emp.salary_usd}, ${amountXlm}, 'pending', ${commitment}, ${claimToken})
      `
    }

    // Generate merkle root
    const merkleRoot = generateMerkleRoot(commitments)

    // Update payroll with merkle root
    await sql`
      UPDATE payrolls SET merkle_root = ${merkleRoot} WHERE id = ${payroll.id}
    `

    return NextResponse.json({ 
      success: true, 
      data: { ...payroll, merkle_root: merkleRoot } as Payroll 
    }, { status: 201 })
  } catch (error) {
    console.error("Payroll create error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create payroll" },
      { status: 500 }
    )
  }
}
