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
| `npm run test:concurrency` | **SEC-001 regression**: 80 simultaneous HTTP registrations/bookings; asserts zero locks, zero duplicate ids, zero corrupted rows, zero filesystem writes |

## Health check

`GET /health` reports live PostgreSQL connectivity, server version and
round-trip latency — a failing DB yields `503 DEGRADED` instead of silently
serving stale state.

## Security notes

* SEC-001 (flat-file storage) is remediated here: relational storage, ACID
  transactions, sequence-backed identifiers, committed migrations.
* Still open for future audits: password verification on demo login (SEC-002
  area), TLS/ABDM production credential handling, and encryption-at-rest
  (delegate to the managed database layer, e.g. RDS storage encryption).
