import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateNullifier } from "@/lib/crypto"
import type { ApiResponse } from "@/lib/types"

interface WithdrawResult {
  status: string
  stellar_tx_hash: string
  amount_xlm: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<WithdrawResult>>> {
  try {
    const { token } = await params

    // Find and validate disbursement
    const disbursements = await sql`
      SELECT id, status, commitment_hash, amount_xlm 
      FROM disbursements 
      WHERE claim_token = ${token}
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

    if (disbursement.status !== "claimed") {
      return NextResponse.json(
        { success: false, error: "Please claim this payment first before withdrawing" },
        { status: 400 }
      )
    }

    // Generate nullifier (prevents double-spend in ZK system)
    const nullifier = generateNullifier(token, disbursement.commitment_hash)

    // Simulate Stellar transaction
    const stellarTxHash = `sim_withdrawal_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Update disbursement
    await sql`
      UPDATE disbursements 
      SET status = 'withdrawn', 
          nullifier = ${nullifier},
          stellar_tx_hash = ${stellarTxHash},
          withdrawn_at = CURRENT_TIMESTAMP
      WHERE id = ${disbursement.id}
    `

    return NextResponse.json({
      success: true,
      data: {
        status: "withdrawn",
        stellar_tx_hash: stellarTxHash,
        amount_xlm: parseFloat(disbursement.amount_xlm),
      },
    })
  } catch (error) {
    console.error("Withdraw error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process withdrawal" },
      { status: 500 }
    )
  }
}
