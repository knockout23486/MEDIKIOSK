# MediKiosk — AI Clinical Intake Platform (SIH 2026)

React (Vite) kiosk/client + Express API server for Ministry of Ayush / AIIA OPD
intake, adaptive clinical history, AYUSH Dashavidha Pariksha, red-flag triage,
OCR fusion and ABDM/HIS interoperability.

## Storage architecture (SEC-001 remediation)

All clinical data lives in **PostgreSQL**, accessed through **Drizzle ORM**
(`server/db/schema.ts`) with a pooled `node-postgres` connection
(`server/db/store.ts`). The legacy flat-JSON database is fully removed.

* **Every read** is a SQL `SELECT`; **every write** runs inside a SQL
  transaction (`db.transaction(...)` / `orm.transaction(...)`), so multi-table
  writes — e.g. patient + audit log, appointment + queue token + SMS + audit —
  are atomic (all-or-nothing).
* Business identifiers (`MK-PAT-2026-000129`, `APT-20260830-100`, `A-100`)
  are allocated from **PostgreSQL sequences**, so concurrent kiosk
  registrations can never collide or duplicate identifiers.
* Queue advancement locks candidate rows with `SELECT ... FOR UPDATE`,
  preventing two triage desks from calling the same patient twice.
* Committed SQL migrations live in `drizzle/` and are applied automatically on
  server boot (or manually via `npm run db:migrate`).

## Quick start

```bash
# 1. PostgreSQL (local dev)
docker compose up -d db          # postgres:17 on localhost:5432

# 2. Configure
cp .env.example .env             # DATABASE_URL=postgres://medikiosk:medikiosk@127.0.0.1:5432/medikiosk

# 3. Install + run (migrations apply and demo data seeds automatically)
npm install
npm run dev                      # API on :3001, Vite client on :5173
```

Production: point `DATABASE_URL` at your managed PostgreSQL (Neon, RDS,
self-hosted) — ideally with `sslmode=require`. Keep the credential in a secret
manager, never in git.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | API server (:3001) + Vite client (:5173) |
| `npm run seed` / `npm run reset-demo` | Seed / hard-reset the demo dataset (SQL transaction) |
| `npm run db:generate` | Regenerate SQL migrations from `server/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Drizzle Studio DB browser |
| `npm test` | Functional test suite (requires PostgreSQL) |
| `npm run test:auth` | **SEC-003 regression**: 401 on all 41 protected endpoints, forged/expired token rejection, 403 RBAC matrix, IDOR ownership |
| `npm run test:concurrency` | **SEC-001 regression**: 80 simultaneous authenticated registrations/bookings; zero locks, duplicate ids, corrupted rows, or filesystem writes |

## Health check

`GET /health` reports live PostgreSQL connectivity, server version and
round-trip latency — a failing DB yields `503 DEGRADED` instead of silently
serving stale state.

## Security architecture

* **SEC-001 (fixed)** — PostgreSQL + Drizzle ORM: ACID transactions,
  sequence-backed business identifiers, `SELECT ... FOR UPDATE` queue locking,
  committed SQL migrations.
* **SEC-003 (fixed)** — every `/api` route is guarded by JWT middleware
  (`server/middleware/auth.ts`): `Authorization: Bearer <HS256 JWT>` required
  (401 otherwise), per-route RBAC allow-lists (403 otherwise, denials audited),
  and PATIENT-role reads enforce record ownership (IDOR protection via
  `patients.user_id`). The only public route is `POST /api/auth/login`.
  The SSE stream accepts the token via `?token=` (EventSource cannot set
  headers). Regression: `npm run test:auth` — 41 endpoints × 401 sweep,
  forgery/expiry cases, 11-case 403 matrix, IDOR checks.
* **SEC-004 (fixed)** — application-level AES-256-GCM encryption
  (`server/db/crypto.ts`) for PHI columns (patient identity, clinical free
  text, consent purposes, FHIR payloads). Ciphertext is unreadable even with
  direct database credentials; the key (`APP_ENCRYPTION_KEY`) never leaves the
  application. Verify: `npm test` asserts raw SQL sees only `enc.v1.*` blobs.
* **SEC-005 (fixed)** — the `AyushPariksha.tsx` TypeScript error is resolved;
  `npm run build` and `tsc --noEmit` are clean for client and server.
* Still open for future audits (SEC-002 area): demo role-login issues tokens
  without a password (kiosk UX parity) — seed users still carry plaintext
  password fields awaiting migration to salted hashes; TLS termination and
  ABDM production credentials are deployment concerns.

## Test suites (all require PostgreSQL)

| Script | Covers |
| --- | --- |
| `npm test` | 34 functional assertions: engines, transactions, PHI encryption-at-rest |
| `npm run test:concurrency` | 80 simultaneous HTTP registrations/bookings — no locks/duplicates/corruption |
| `npm run test:auth` | SEC-003 regression: 401 sweep, forged/expired tokens, 403 RBAC matrix, IDOR |
