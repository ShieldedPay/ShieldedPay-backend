import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// Lazy-initialised Neon client. The connection is created on first actual
// query so that importing this module never requires DATABASE_URL to be set
// (e.g. during `next build` page-data collection).
let client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set")
    }
    client = neon(process.env.DATABASE_URL)
  }
  return client
}

export const sql = new Proxy(function () {} as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, argArray) {
    return (getClient() as Function).apply(null, argArray)
  },
})

// Helper for transactions (simulated with sequential queries)
export async function withTransaction<T>(
  callback: (sql: typeof import("@neondatabase/serverless").neon) => Promise<T>
): Promise<T> {
  // Neon serverless doesn't support true transactions in the same way
  // For MVP, we execute queries sequentially
  return callback(neon)
}
