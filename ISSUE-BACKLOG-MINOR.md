# ShieldedPay-backend — Minor Issues Backlog (9 Issues)

Sized strictly as **100 pts (Trivial / Good First Issue)** in Drips Wave criteria.

---

## #1: Add OpenAPI tags and operation summaries to all payroll and claim REST endpoints

- **Labels**: `complexity:trivial, backend, documentation, good first issue`

- **Complexity**: `100 pts` (Trivial)


### Summary
Enrich the OpenAPI specification with clear route summaries, tags, and operation descriptions for client generator compatibility.

### Requirements
- Tag routes under `Payrolls`, `Claims`, and `Organizations`.
- Add summaries and operationId identifiers to every endpoint.
- Verify Swagger UI displays organized route groups.

---

## #2: Standardize ISO-8601 UTC timestamp formatting in /api/health endpoint response

- **Labels**: `complexity:trivial, backend, code-hygiene`

- **Complexity**: `100 pts` (Trivial)


### Summary
Ensure the health check endpoint returns consistent UTC timestamps conforming to ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).

### Requirements
- Format `timestamp` field with `.toISOString()` in health check route handler.
- Include `service: "shieldedpay-api"` and `status: "healthy"` in the JSON response.
- Add unit test verifying response shape and 200 status code.

---

## #3: Add detailed descriptions and dummy example values for all vars in .env.example

- **Labels**: `complexity:trivial, backend, documentation, good first issue`

- **Complexity**: `100 pts` (Trivial)


### Summary
Provide comprehensive documentation and realistic placeholder values for all environment variables in `.env.example`.

### Requirements
- Comment each variable group (`DATABASE_URL`, `SOROBAN_RPC_URL`, `JWT_SECRET`, `PORT`).
- Include notes on required Stellar network passphrases (Testnet vs Mainnet).
- Verify server startup displays clean error messages when required variables are absent.

---

## #4: Standardize Zod validation error response payload with field-level error arrays

- **Labels**: `complexity:trivial, backend, code-hygiene`

- **Complexity**: `100 pts` (Trivial)


### Summary
Standardize HTTP 400 Bad Request responses when request body fails Zod schema validation.

### Requirements
- Format error responses as `{ error: "Validation Failed", details: [{ field: string, message: string }] }`.
- Ensure error handler catches `ZodError` globally.
- Add test asserting HTTP 400 with structured validation payload on missing fields.

---

## #5: Add request ID (x-request-id) header generation and tracing middleware

- **Labels**: `complexity:trivial, backend, code-hygiene`

- **Complexity**: `100 pts` (Trivial)


### Summary
Implement request tracing middleware that attaches a unique `x-request-id` header to incoming requests and outgoing responses.

### Requirements
- Generate UUIDv4 or nanoId for `x-request-id` if not present in request headers.
- Attach ID to request context and outgoing response headers.
- Include request ID in log messages for distributed debugging.

---

## #6: Add unit test verifying HTTP 400 rejection on malformed UUID parameters

- **Labels**: `complexity:trivial, backend, testing, good first issue`

- **Complexity**: `100 pts` (Trivial)


### Summary
Verify that API routes with UUID path parameters reject non-UUID strings before database execution.

### Requirements
- Write test in `tests/payroll_routes.test.ts` invoking `/api/payrolls/invalid-uuid-123`.
- Assert response status is HTTP 400 with descriptive error message.
- Verify test passes cleanly in CI.

---

## #7: Add npm audit dependency security audit check step to package scripts

- **Labels**: `complexity:trivial, backend, ci, security`

- **Complexity**: `100 pts` (Trivial)


### Summary
Add an automated security audit script to verify dependencies against known CVEs.

### Requirements
- Add `"audit": "npm audit --audit-level=high"` script in `package.json`.
- Document usage in `CONTRIBUTING.md`.
- Verify command runs cleanly with zero high-severity vulnerabilities.

---

## #8: Add CORS configuration explanatory comments and allowed origins documentation

- **Labels**: `complexity:trivial, backend, documentation`

- **Complexity**: `100 pts` (Trivial)


### Summary
Document CORS middleware configuration to clarify local development vs production deployment behavior.

### Requirements
- Add comments explaining allowed headers, methods, and credential policies.
- Document `CORS_ORIGIN` env variable in `.env.example` and `README.md`.
- Ensure preflight `OPTIONS` requests return expected 204/200 status.

---

## #9: Add API version, license, and test coverage badges to README.md

- **Labels**: `complexity:trivial, backend, documentation`

- **Complexity**: `100 pts` (Trivial)


### Summary
Update backend repository README with status badges and quickstart commands.

### Requirements
- Add Shields.io badges for Node.js engine, license, and CI test status.
- Ensure instructions specify exact Node version (`>=20.0.0`).
- Add endpoint summary table with curl examples.

---
