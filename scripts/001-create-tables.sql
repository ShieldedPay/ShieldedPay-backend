-- ShieldedPay Database Schema
-- Privacy-preserving payroll system tables

-- Organizations (Employers)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  treasury_balance DECIMAL(18, 2) DEFAULT 0,
  yield_balance DECIMAL(18, 2) DEFAULT 0,
  benji_allocation DECIMAL(5, 2) DEFAULT 80.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees (Contractors)
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  local_currency TEXT NOT NULL,
  wallet_address TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  merkle_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payrolls (Batch payments)
CREATE TABLE IF NOT EXISTS payrolls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  total_amount DECIMAL(18, 2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  merkle_root TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disbursements (Individual payments within a payroll)
CREATE TABLE IF NOT EXISTS disbursements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  payroll_id TEXT NOT NULL REFERENCES payrolls(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount_usd DECIMAL(18, 2) NOT NULL,
  amount_local DECIMAL(18, 2),
  fx_rate DECIMAL(18, 6),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'committed', 'claimable', 'claimed', 'expired')),
  commitment_hash TEXT,
  nullifier TEXT,
  claim_token TEXT UNIQUE,
  claim_expires_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treasury Operations (Deposits, sweeps, withdrawals)
CREATE TABLE IF NOT EXISTS treasury_operations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'sweep', 'withdrawal', 'yield_credit')),
  amount DECIMAL(18, 2) NOT NULL,
  yield_earned DECIMAL(18, 2) DEFAULT 0,
  balance_after DECIMAL(18, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- View Keys (For auditor access)
CREATE TABLE IF NOT EXISTS view_keys (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payroll_id TEXT REFERENCES payrolls(id) ON DELETE SET NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scope TEXT DEFAULT 'payroll' CHECK (scope IN ('payroll', 'employee', 'organization')),
  granted_to TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_payrolls_org ON payrolls(organization_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_payroll ON disbursements(payroll_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_employee ON disbursements(employee_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_claim_token ON disbursements(claim_token);
CREATE INDEX IF NOT EXISTS idx_treasury_ops_org ON treasury_operations(organization_id);
CREATE INDEX IF NOT EXISTS idx_view_keys_org ON view_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_view_keys_hash ON view_keys(key_hash);
