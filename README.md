# ShieldedPay Backend 🔒

**API and database backend for ShieldedPay — privacy-first global payroll built on Stellar with zero-knowledge compliance.**

This repository contains the Next.js API routes, database schema, seed data, and cryptographic utilities that power ShieldedPay's backend services.

---

## Features

- **Zero-Knowledge Privacy** — Salaries and wallet addresses are protected using ZK-style commitments (SHA256 Merkle trees). Employers never see contractor wallet addresses.
- **Global Payments** — Pay contractors in 150+ countries with instant Stellar blockchain settlement.
- **Self-Custodied Claims** — Contractors receive a unique claim token to withdraw funds directly to their own Stellar wallet. No signup needed.
- **Treasury Yield** — Earn 4–5% APY on idle payroll funds through DeFi integration.
- **Auditor View Keys** — Grant selective, time-bound read access to external auditors.
- **Admin Dashboard** — Full analytics, payroll management, employee tracking, and treasury operations.

---

## Related Repositories

- [ShieldedPay Frontend](https://github.com/ShieldedPay/shieldedPay-frontend) — React frontend with the admin dashboard and claim interface
- [ShieldedPay Contracts](https://github.com/ShieldedPay/ShieldedPay-contract) — Stellar smart contracts for on-chain settlement

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard/stats` | Dashboard statistics |
| `GET/POST /api/payrolls` | List / create payrolls |
| `POST /api/payrolls/[id]/process` | Process a payroll |
| `GET/POST /api/employees` | List / create employees |
| `GET /api/disbursements` | List disbursements |
| `GET/POST /api/treasury` | Treasury operations |
| `GET/POST /api/claim/[token]` | Look up / submit a claim |
| `POST /api/claim/[token]/withdraw` | Withdraw to Stellar wallet |

---

## Database

The schema is managed via SQL migration scripts in `scripts/`. Key tables:

| Table | Description |
|-------|-------------|
| `organizations` | Employer entities with treasury balances and yield configuration |
| `employees` | Contractors with encrypted names, KYC status, and wallet addresses |
| `payrolls` | Batch payments with status tracking, totals, and Merkle roots |
| `disbursements` | Individual payments within a payroll, with claim tokens and commitment hashes |
| `treasury_operations` | Deposit, sweep, withdrawal, and yield credit ledger entries |
| `view_keys` | Auditor access keys with scope, expiry, and revocation support |

Run the migration and seed scripts to set up the database:

```bash
psql "$DATABASE_URL" -f scripts/001-create-tables.sql
psql "$DATABASE_URL" -f scripts/002-seed-demo-data.sql
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres database (or any Postgres instance)

### Setup

```bash
# Install dependencies
pnpm install

# Configure environment
# Add DATABASE_URL to .env.local

# Create tables and seed demo data
pnpm run db:migrate
pnpm run db:seed

# Start dev server
pnpm dev
```

---

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/amazing-feature`).
2. Make your changes following existing conventions (TypeScript strict, shadcn/ui patterns).
3. Run `pnpm lint` and ensure no new errors.
4. Commit with a descriptive message (`git commit -m 'feat: add amazing feature'`).
5. Push and open a Pull Request against `main`.

### Guidelines

- Keep PRs focused — one feature or fix per PR.
- Add SQL migration scripts in `scripts/` for schema changes.
- Use existing Radix UI primitives before adding new UI dependencies.
- Mark crypto placeholders with `// TODO: Production — use real ZK circuit`.

---

## Status

**MVP / Prototype.** The crypto module uses simulated ZK operations (SHA256 hashes, not real ZK-SNARK circuits) and is designed to be replaced with a production-grade proving system. Not yet audited for production use.
