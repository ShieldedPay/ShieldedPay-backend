import { describe, it, expect } from "vitest";
import { runMigrations, isDbConnected, mockDb } from "../lib/db";

describe("Database & Migration Runner", () => {
  it("runs migration runner successfully against Neon schema", async () => {
    const result = await runMigrations();
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });

  it("provides in-memory fallback store when DATABASE_URL is not configured", () => {
    expect(mockDb.organizations).toHaveLength(1);
    expect(mockDb.organizations[0].name).toBe("Acme Corp");
    expect(mockDb.employees).toHaveLength(1);
  });
});
