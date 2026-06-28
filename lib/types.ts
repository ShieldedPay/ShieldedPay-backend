// Database types matching our schema

export interface Organization {
  id: string
  name: string
  stellar_treasury_address: string | null
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  org_id: string
  external_id: string
  email_hash: string
  name_encrypted: string
  salary_usd: number
  currency: string
  country: string
  status: "active" | "inactive" | "terminated"
  stellar_address: string | null
  created_at: string
  updated_at: string
}

export interface Payroll {
  id: string
  org_id: string
  period_start: string
  period_end: string
  status: "draft" | "pending" | "processing" | "completed" | "failed"
  total_usd: number
  employee_count: number
  merkle_root: string | null
  created_at: string
  processed_at: string | null
}

export interface Disbursement {
  id: string
  payroll_id: string
  employee_id: string
  amount_usd: number
  amount_xlm: number | null
  status: "pending" | "committed" | "claimed" | "withdrawn" | "expired"
  commitment_hash: string | null
  nullifier: string | null
  stellar_tx_hash: string | null
  claim_token: string | null
  claimed_at: string | null
  withdrawn_at: string | null
  created_at: string
}

export interface TreasuryOperation {
  id: string
  org_id: string
  type: "deposit" | "withdrawal" | "yield" | "fee"
  amount_usd: number
  amount_xlm: number | null
  description: string | null
  stellar_tx_hash: string | null
  created_at: string
}

export interface ViewKey {
  id: string
  org_id: string
  key_hash: string
  permissions: string[]
  expires_at: string | null
  created_by: string | null
  created_at: string
}

// Extended types for API responses
export interface EmployeeWithDecryptedName extends Omit<Employee, "name_encrypted"> {
  name: string
}

export interface PayrollWithDisbursements extends Payroll {
  disbursements: DisbursementWithEmployee[]
}

export interface DisbursementWithEmployee extends Disbursement {
  employee_name: string
  employee_country: string
}

// Dashboard stats
export interface DashboardStats {
  totalEmployees: number
  activePayrolls: number
  treasuryBalance: number
  pendingClaims: number
  monthlyPayroll: number
  yieldEarned: number
}

// Claim page types
export interface ClaimInfo {
  disbursement_id: string
  amount_usd: number
  amount_xlm: number | null
  status: Disbursement["status"]
  period_start: string
  period_end: string
  org_name: string
}

// ZK Proof simulation types
export interface ZKProof {
  commitment: string
  nullifier: string
  merkle_proof: string[]
  merkle_root: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
