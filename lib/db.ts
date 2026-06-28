import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)

// Helper for transactions (simulated with sequential queries)
export async function withTransaction<T>(
  callback: (sql: typeof import("@neondatabase/serverless").neon) => Promise<T>
): Promise<T> {
  // Neon serverless doesn't support true transactions in the same way
  // For MVP, we execute queries sequentially
  return callback(neon(process.env.DATABASE_URL!))
}
