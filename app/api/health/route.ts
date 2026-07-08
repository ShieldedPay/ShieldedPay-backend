export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "shieldedpay-backend",
    version: "0.1.0",
  })
}
