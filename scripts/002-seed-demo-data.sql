-- ShieldedPay Demo Data
-- TechGlobal Inc. with 10 contractors across Asia/LATAM

-- Insert demo organization
INSERT INTO organizations (id, name, treasury_balance, yield_balance, benji_allocation)
VALUES (
  'org_techglobal_001',
  'TechGlobal Inc.',
  250000.00,
  12500.00,
  80.00
) ON CONFLICT (id) DO UPDATE SET
  treasury_balance = EXCLUDED.treasury_balance,
  yield_balance = EXCLUDED.yield_balance;

-- Insert demo employees (contractors)
INSERT INTO employees (id, organization_id, name, email, country, local_currency, wallet_address, kyc_status, merkle_index)
VALUES
  ('emp_001', 'org_techglobal_001', 'Maria Santos', 'maria.santos@email.com', 'Philippines', 'PHP', 'GCXYZ...MARIA', 'verified', 0),
  ('emp_002', 'org_techglobal_001', 'Juan Rodriguez', 'juan.rodriguez@email.com', 'Mexico', 'MXN', 'GCXYZ...JUAN', 'verified', 1),
  ('emp_003', 'org_techglobal_001', 'Priya Sharma', 'priya.sharma@email.com', 'India', 'INR', 'GCXYZ...PRIYA', 'verified', 2),
  ('emp_004', 'org_techglobal_001', 'Wei Chen', 'wei.chen@email.com', 'Singapore', 'SGD', 'GCXYZ...WEI', 'verified', 3),
  ('emp_005', 'org_techglobal_001', 'Carlos Lima', 'carlos.lima@email.com', 'Brazil', 'BRL', 'GCXYZ...CARLOS', 'verified', 4),
  ('emp_006', 'org_techglobal_001', 'Anh Nguyen', 'anh.nguyen@email.com', 'Vietnam', 'VND', 'GCXYZ...ANH', 'pending', 5),
  ('emp_007', 'org_techglobal_001', 'Kenji Tanaka', 'kenji.tanaka@email.com', 'Japan', 'JPY', 'GCXYZ...KENJI', 'verified', 6),
  ('emp_008', 'org_techglobal_001', 'Sofia Garcia', 'sofia.garcia@email.com', 'Argentina', 'ARS', 'GCXYZ...SOFIA', 'verified', 7),
  ('emp_009', 'org_techglobal_001', 'Raj Patel', 'raj.patel@email.com', 'India', 'INR', 'GCXYZ...RAJ', 'verified', 8),
  ('emp_010', 'org_techglobal_001', 'Min-jun Kim', 'minjun.kim@email.com', 'South Korea', 'KRW', 'GCXYZ...MINJUN', 'verified', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  kyc_status = EXCLUDED.kyc_status;

-- Insert completed payroll (March 2024)
INSERT INTO payrolls (id, organization_id, period, status, total_amount, employee_count, merkle_root, processed_at, created_at)
VALUES (
  'pay_march_2024',
  'org_techglobal_001',
  'March 2024',
  'completed',
  46500.00,
  10,
  '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '35 days'
) ON CONFLICT (id) DO NOTHING;

-- Insert disbursements for March 2024 (all claimed)
INSERT INTO disbursements (id, payroll_id, employee_id, amount_usd, amount_local, fx_rate, status, commitment_hash, claim_token, claimed_at)
VALUES
  ('disb_001', 'pay_march_2024', 'emp_001', 3500.00, 196350.00, 56.10, 'claimed', '0xabc123...', 'tok_maria_march', NOW() - INTERVAL '25 days'),
  ('disb_002', 'pay_march_2024', 'emp_002', 4200.00, 72492.00, 17.26, 'claimed', '0xdef456...', 'tok_juan_march', NOW() - INTERVAL '24 days'),
  ('disb_003', 'pay_march_2024', 'emp_003', 5000.00, 416500.00, 83.30, 'claimed', '0xghi789...', 'tok_priya_march', NOW() - INTERVAL '26 days'),
  ('disb_004', 'pay_march_2024', 'emp_004', 6500.00, 8775.00, 1.35, 'claimed', '0xjkl012...', 'tok_wei_march', NOW() - INTERVAL '23 days'),
  ('disb_005', 'pay_march_2024', 'emp_005', 3800.00, 18962.00, 4.99, 'claimed', '0xmno345...', 'tok_carlos_march', NOW() - INTERVAL '27 days'),
  ('disb_006', 'pay_march_2024', 'emp_006', 2800.00, 69860000.00, 24950.00, 'claimed', '0xpqr678...', 'tok_anh_march', NOW() - INTERVAL '22 days'),
  ('disb_007', 'pay_march_2024', 'emp_007', 7500.00, 1128750.00, 150.50, 'claimed', '0xstu901...', 'tok_kenji_march', NOW() - INTERVAL '21 days'),
  ('disb_008', 'pay_march_2024', 'emp_008', 3200.00, 2803200.00, 876.00, 'claimed', '0xvwx234...', 'tok_sofia_march', NOW() - INTERVAL '28 days'),
  ('disb_009', 'pay_march_2024', 'emp_009', 4500.00, 374850.00, 83.30, 'claimed', '0xyza567...', 'tok_raj_march', NOW() - INTERVAL '20 days'),
  ('disb_010', 'pay_march_2024', 'emp_010', 5500.00, 7348000.00, 1336.00, 'claimed', '0xbcd890...', 'tok_minjun_march', NOW() - INTERVAL '19 days')
ON CONFLICT (id) DO NOTHING;

-- Insert current payroll (April 2024 - processing)
INSERT INTO payrolls (id, organization_id, period, status, total_amount, employee_count, merkle_root, created_at)
VALUES (
  'pay_april_2024',
  'org_techglobal_001',
  'April 2024',
  'completed',
  46500.00,
  10,
  '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;

-- Insert disbursements for April 2024 (some pending claims)
INSERT INTO disbursements (id, payroll_id, employee_id, amount_usd, amount_local, fx_rate, status, commitment_hash, claim_token, claim_expires_at)
VALUES
  ('disb_011', 'pay_april_2024', 'emp_001', 3500.00, 196350.00, 56.10, 'claimable', '0x111aaa...', 'tok_maria_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_012', 'pay_april_2024', 'emp_002', 4200.00, 72492.00, 17.26, 'claimed', '0x222bbb...', 'tok_juan_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_013', 'pay_april_2024', 'emp_003', 5000.00, 416500.00, 83.30, 'claimable', '0x333ccc...', 'tok_priya_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_014', 'pay_april_2024', 'emp_004', 6500.00, 8775.00, 1.35, 'claimed', '0x444ddd...', 'tok_wei_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_015', 'pay_april_2024', 'emp_005', 3800.00, 18962.00, 4.99, 'claimable', '0x555eee...', 'tok_carlos_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_016', 'pay_april_2024', 'emp_006', 2800.00, 69860000.00, 24950.00, 'claimable', '0x666fff...', 'tok_anh_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_017', 'pay_april_2024', 'emp_007', 7500.00, 1128750.00, 150.50, 'claimed', '0x777ggg...', 'tok_kenji_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_018', 'pay_april_2024', 'emp_008', 3200.00, 2803200.00, 876.00, 'claimable', '0x888hhh...', 'tok_sofia_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_019', 'pay_april_2024', 'emp_009', 4500.00, 374850.00, 83.30, 'claimed', '0x999iii...', 'tok_raj_april_2024', NOW() + INTERVAL '25 days'),
  ('disb_020', 'pay_april_2024', 'emp_010', 5500.00, 7348000.00, 1336.00, 'claimable', '0xaaajjj...', 'tok_minjun_april_2024', NOW() + INTERVAL '25 days')
ON CONFLICT (id) DO NOTHING;

-- Insert treasury operations history
INSERT INTO treasury_operations (id, organization_id, type, amount, yield_earned, balance_after, notes, created_at)
VALUES
  ('top_001', 'org_techglobal_001', 'deposit', 300000.00, 0, 300000.00, 'Initial treasury funding', NOW() - INTERVAL '90 days'),
  ('top_002', 'org_techglobal_001', 'sweep', 240000.00, 0, 300000.00, 'Sweep to BENJI (80%)', NOW() - INTERVAL '89 days'),
  ('top_003', 'org_techglobal_001', 'yield_credit', 3125.00, 3125.00, 303125.00, 'Monthly yield (5% APY)', NOW() - INTERVAL '60 days'),
  ('top_004', 'org_techglobal_001', 'withdrawal', 46500.00, 0, 256625.00, 'March 2024 payroll', NOW() - INTERVAL '30 days'),
  ('top_005', 'org_techglobal_001', 'yield_credit', 3125.00, 3125.00, 259750.00, 'Monthly yield (5% APY)', NOW() - INTERVAL '30 days'),
  ('top_006', 'org_techglobal_001', 'yield_credit', 3125.00, 3125.00, 262875.00, 'Monthly yield (5% APY)', NOW()),
  ('top_007', 'org_techglobal_001', 'withdrawal', 46500.00, 0, 216375.00, 'April 2024 payroll processing', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Insert a sample view key for auditors
INSERT INTO view_keys (id, organization_id, payroll_id, key_hash, scope, granted_to, expires_at, created_at)
VALUES (
  'vk_001',
  'org_techglobal_001',
  'pay_march_2024',
  'vk_hash_abc123def456',
  'payroll',
  'external-auditor@auditfirm.com',
  NOW() + INTERVAL '30 days',
  NOW() - INTERVAL '5 days'
) ON CONFLICT (id) DO NOTHING;
