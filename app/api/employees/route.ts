import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { decryptName, encryptName, hashEmail } from "@/lib/crypto"
import type { Employee, EmployeeWithDecryptedName, ApiResponse } from "@/lib/types"

export async function GET(): Promise<NextResponse<ApiResponse<EmployeeWithDecryptedName[]>>> {
  try {
    // Get demo org ID
    const orgs = await sql`SELECT id FROM organizations LIMIT 1`
    if (orgs.length === 0) {
      return NextResponse.json({ success: false, error: "No organization found" }, { status: 404 })
    }
    const orgId = orgs[0].id

    const employees = await sql`
      SELECT id, org_id, external_id, email_hash, name_encrypted, 
             salary_usd, currency, country, status, stellar_address,
             created_at, updated_at
      FROM employees
      WHERE org_id = ${orgId}
      ORDER BY created_at DESC
    `

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
    }))

    return NextResponse.json({ success: true, data: decryptedEmployees })
  } catch (error) {
    console.error("Employees fetch error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<EmployeeWithDecryptedName>>> {
  try {
    const body = await request.json()
    const { name, email, salary_usd, currency, country } = body

    if (!name || !email || !salary_usd || !currency || !country) {
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

    const emailHash = hashEmail(email)
    const nameEncrypted = encryptName(name)
    const externalId = `EMP-${Date.now()}`

    const result = await sql`
      INSERT INTO employees (org_id, external_id, email_hash, name_encrypted, salary_usd, currency, country, status)
      VALUES (${orgId}, ${externalId}, ${emailHash}, ${nameEncrypted}, ${salary_usd}, ${currency}, ${country}, 'active')
      RETURNING id, org_id, external_id, email_hash, name_encrypted, salary_usd, currency, country, status, stellar_address, created_at, updated_at
    `

    const row = result[0]
    const employee: EmployeeWithDecryptedName = {
      id: row.id,
      org_id: row.org_id,
      external_id: row.external_id,
      email_hash: row.email_hash,
      name: decryptName(row.name_encrypted),
      salary_usd: row.salary_usd,
      currency: row.currency,
      country: row.country,
      status: row.status,
      stellar_address: row.stellar_address,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }

    return NextResponse.json({ success: true, data: employee }, { status: 201 })
  } catch (error) {
    console.error("Employee create error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create employee" },
      { status: 500 }
    )
  }
}
