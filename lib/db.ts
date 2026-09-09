import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

// In-memory fallback store when DATABASE_URL is not set (e.g. CI / local testing without Postgres)
export const mockDb = {
  organizations: [
    {
      id: "org_acme",
      name: "Acme Corp",
      treasury_balance: 150000.0,
      yield_balance: 4250.0,
      benji_allocation: 80.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  employees: [
    {
      id: "emp_1",
      organization_id: "org_acme",
      name: "Sarah Chen",
      email: "sarah@example.com",
      country: "US",
      local_currency: "USD",
      wallet_address: "GBJNDNLZKN4TY5W5U2M5X6WTYF4VODLCRPQ2E22Q4N3A3B4C5D6E7F8G",
      kyc_status: "verified",
      merkle_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  payrolls: [] as any[],
  disbursements: [] as any[],
  treasury_operations: [] as any[],
  audit_logs: [] as any[],
};

let client: NeonQueryFunction<false, false> | null = null;

export function isDbConnected(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));
}

export function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

export const sql = new Proxy(function () {} as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, argArray) {
    if (!isDbConnected()) {
      // Mock query simulation
      return Promise.resolve([]);
    }
    return (getClient() as Function).apply(null, argArray);
  },
});

/**
 * Migration runner: reads scripts/001-create-tables.sql and runs it
 */
export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  const migrationPath = path.resolve(process.cwd(), "scripts/001-create-tables.sql");
  if (!fs.existsSync(migrationPath)) {
    return { success: false, message: `Migration file not found at ${migrationPath}` };
  }

  const sqlContent = fs.readFileSync(migrationPath, "utf-8");

  if (isDbConnected()) {
    try {
      const db = getClient();
      // Split on semicolons and run statements
      const statements = sqlContent
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        await (db as any)(statement);
      }
      return { success: true, message: `Executed ${statements.length} migration statements via Neon connection pool.` };
    } catch (err: any) {
      return { success: false, message: `Migration execution error: ${err.message}` };
    }
  }

  return { success: true, message: "Migration checked. Mock database active (no DATABASE_URL set)." };
}

export async function withTransaction<T>(
  callback: (sql: typeof import("@neondatabase/serverless").neon) => Promise<T>
): Promise<T> {
  return callback(neon);
}
