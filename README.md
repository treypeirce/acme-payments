# Acme Payments API

> Internal reference service — order capture, cryptographically-signed charge authorization, and refund reversal.

A small, well-tested TypeScript + Express service that stands in for a real
enterprise payments backend. It ships with a status console, session-based
bearer auth on every state-changing route, and RSA-signed payment
authorization tokens on the settlement path.

> **Note:** this repository is a **security-demo fixture** for the Sentinel
> remediation cockpit. It intentionally pins three dependencies with known
> advisories so an agent-driven triage pipeline can be demonstrated end to end.
> See [`SECURITY_FIXTURES.md`](./SECURITY_FIXTURES.md). Do not deploy it.

---

## Quickstart

```bash
npm install
npm test          # vitest — full suite should pass green
npm run dev       # starts on http://localhost:8080
```

Open `http://localhost:8080` for the live status console.

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/health` | public | Liveness, version, uptime |
| `POST` | `/auth/token` | public | Exchange an API key for a session token |
| `POST` | `/orders` | bearer | Create an order |
| `GET`  | `/orders/:id` | bearer | Fetch an order |
| `POST` | `/payments/charge` | bearer | Authorize a charge; mint a signed token |
| `POST` | `/payments/refund` | bearer | Reverse a payment after signature re-verification |

### Example

```bash
# 1. Get a token
TOKEN=$(curl -s localhost:8080/auth/token \
  -H 'content-type: application/json' \
  -d '{"customerId":"cus_123","apiKey":"sk_test_abcdefgh"}' | jq -r .accessToken)

# 2. Create an order
ORDER=$(curl -s localhost:8080/orders -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"amount":4200,"currency":"USD"}' | jq -r .id)

# 3. Authorize the charge
curl -s localhost:8080/payments/charge -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d "{\"orderId\":\"$ORDER\"}"
```

## Architecture

```
                    ┌──────────────────────────────────────┐
  HTTP  ─────────▶  │  app.ts  (helmet · cors · json · log)  │
                    └───────────────┬──────────────────────┘
                                    │
         ┌──────────────┬───────────┼───────────────┬──────────────┐
         ▼              ▼           ▼               ▼              ▼
    /health        /auth/token   /orders       /payments      static console
                        │        (requireAuth)  (requireAuth)   (public/)
                        │            │               │
                   auth/tokens   orders/service   payments/service
                   (jwt.sign)                          │
                        │                        payments/tokenSigning
                  middleware/auth                (node-forge RSA sign/verify)
                  (jwt.verify)  ◀── hot path ──▶  settlement / money-movement
```

- **`src/middleware/auth.ts`** — bearer guard on every protected route (hot path).
- **`src/payments/tokenSigning.ts`** — RSA authorization signing; the
  money-movement path, treated as high-sensitivity by change control.
- **`.cursor/hooks.json`** — starter change-control guardrail for coding agents.

## Tech

TypeScript · Express 4 · Vitest + Supertest · Zod validation · Helmet · in-memory store (no external DB).

## Layout

```
src/
  app.ts            express wiring
  index.ts          server bootstrap
  config.ts         env + version
  middleware/       auth guard, error handling
  auth/             session token issuance
  routes/           health, auth, orders, payments
  orders/           order service
  payments/         charge/refund + RSA token signing
test/               vitest suites (health, auth, orders, payments)
public/             status console
```
