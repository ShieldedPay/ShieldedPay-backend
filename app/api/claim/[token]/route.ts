import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { decryptName } from "@/lib/crypto"
import type { ClaimInfo, ApiResponse } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<ClaimInfo>>> {
  try {
    const { token } = await params

    // Find disbursement by claim token
    const result = await sql`
      SELECT 
        d.id as disbursement_id,
        d.amount_usd,
        d.amount_xlm,
        d.status,
        p.period_start,
        p.period_end,
        o.name as org_name
      FROM disbursements d
      JOIN payrolls p ON d.payroll_id = p.id
      JOIN organizations o ON p.org_id = o.id
      WHERE d.claim_token = ${token}
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid claim token" }, { status: 404 })
    }

    const claim = result[0]

    return NextResponse.json({
      success: true,
      data: {
        disbursement_id: claim.disbursement_id,
        amount_usd: parseFloat(claim.amount_usd),
        amount_xlm: claim.amount_xlm ? parseFloat(claim.amount_xlm) : null,
        status: claim.status,
        period_start: claim.period_start,
        period_end: claim.period_end,
        org_name: claim.org_name,
      } as ClaimInfo,
    })
  } catch (error) {
    console.error("Claim lookup error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to lookup claim" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<{ status: string; stellar_address?: string }>>> {
  try {
    const { token } = await params
    const body = await request.json()
    const { stellar_address } = body

    if (!stellar_address) {
      return NextResponse.json(
        { success: false, error: "Stellar address is required" },
        { status: 400 }
      )
    }

    // Find and validate disbursement
    const disbursements = await sql`
      SELECT id, status FROM disbursements WHERE claim_token = ${token}
    `

    if (disbursements.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid claim token" }, { status: 404 })
    }

    const disbursement = disbursements[0]

    if (disbursement.status === "withdrawn") {
      return NextResponse.json(
        { success: false, error: "This payment has already been withdrawn" },
        { status: 400 }
      )
    }

    if (disbursement.status === "expired") {
      return NextResponse.json(
        { success: false, error: "This claim has expired" },
        { status: 400 }
      )
    }

    if (disbursement.status !== "committed" && disbursement.status !== "claimed") {
      return NextResponse.json(
        { success: false, error: "This payment is not yet available for claiming" },
        { status: 400 }
      )
    }

    // Update to claimed status with the provided address
    await sql`
      UPDATE disbursements 
      SET status = 'claimed', claimed_at = CURRENT_TIMESTAMP
      WHERE id = ${disbursement.id}
    `

    // Update employee's stellar address
    await sql`
      UPDATE employees 
      SET stellar_address = ${stellar_address}
      WHERE id = (SELECT employee_id FROM disbursements WHERE id = ${disbursement.id})
    `

    return NextResponse.json({
      success: true,
      data: { status: "claimed", stellar_address },
    })
  } catch (error) {
    console.error("Claim submit error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to submit claim" },
      { status: 500 }
    )
  }
}
