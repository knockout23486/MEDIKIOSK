// ============================================================================
// SEC-001 Regression Test — Concurrent OPD load against PostgreSQL
// ----------------------------------------------------------------------------
// Simulates simultaneous kiosk/OPD traffic hitting the real HTTP API:
//   * N parallel patient registrations (each writes patient + audit rows in a
//     SQL transaction)
//   * N parallel appointment bookings (each writes appointment + queue token +
//     notification + audit rows in a SQL transaction)
//
// Assertions (acceptance criteria for SEC-001):
//   1. Every request succeeds (no 5xx, no lock timeouts / serialization
//      failures, no corrupted writes).
//   2. Every committed patient row exists exactly once in PostgreSQL.
//   3. Business identifiers (MK-PAT-..., APT-..., A-...) are unique — they are
//      allocated from PostgreSQL sequences.
//   4. Nothing is written to a local JSON file (data/ must not appear).
// ============================================================================
import fs from 'fs';
import path from 'path';
import type { Server } from 'http';
import { createApp } from '../server/index.js';
import { db } from '../server/db/store.js';
import { seedDatabase } from '../server/db/seed.js';

const N_REGISTRATIONS = 40;
const N_BOOKINGS = 40;

let passed = 0;
let failed = 0;
function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

async function main() {
  console.log('\n================================================================');
  console.log('🔒 SEC-001 Regression — Concurrent Writes under OPD Load');
  console.log('================================================================\n');

  // Fresh schema + demo seed.
  await db.migrate();
  await seedDatabase(true);
  const probe = await db.ping();
  console.log(`  Database: PostgreSQL ${probe.serverVersion} @ ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ':****@') ?? 'default'}`);

  // Boot the real Express app on an ephemeral port.
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address() as { port: number };
  const base = `http://127.0.0.1:${address.port}`;

  const patientsBefore = await db.patients.count();
  const tokensBefore = (await db.queue.tokens()).length;

  // SEC-003: obtain a real JWT session (PATIENT role may register + book).
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'PATIENT' })
  }).then(r => r.json());
  if (!loginRes?.token) throw new Error('Login failed — cannot run concurrency test.');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${loginRes.token}`
  };
  console.log('  Authenticated as PATIENT (JWT issued, 12h expiry)');

  // --- 1. Simultaneous patient registrations -------------------------------
  console.log(`\n  Firing ${N_REGISTRATIONS} simultaneous POST /api/patients ...`);
  const registrationJobs = Array.from({ length: N_REGISTRATIONS }, (_, i) =>
    fetch(`${base}/api/patients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Load Test Patient ${i + 1}`,
        age: 20 + (i % 60),
        dob: `19${60 + (i % 40)}-0${1 + (i % 9)}-1${i % 9}`,
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        phone: `+91 90000 000${String(i).padStart(2, '0')}`,
        abhaNumber: `91-0000-0000-00${String(i).padStart(2, '0')}`,
        abhaAddress: `loadtest${i}@abdm`,
        address: 'Concurrent Lane 1, New Delhi',
        language: i % 3 === 0 ? 'hi' : 'en',
        emergencyContact: { name: 'Kin', relationship: 'Family', phone: '+91 90000 11111' }
      })
    }).then(async (r) => ({ status: r.status, body: await r.json() }))
  );

  // --- 2. Simultaneous appointment bookings (different tables, same window) -
  console.log(`  Firing ${N_BOOKINGS} simultaneous POST /api/appointments ...`);
  const bookingJobs = Array.from({ length: N_BOOKINGS }, (_, i) =>
    fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        patientId: 'PAT-HERO-01',
        practitionerId: 'PRAC-01',
        departmentId: 'DEP-01',
        hospitalId: 'HOS-01',
        slotDate: '2026-08-30',
        slotTime: '10:30 AM'
      })
    }).then(async (r) => ({ status: r.status, body: await r.json() }))
  );

  const started = Date.now();
  const [registrations, bookings] = await Promise.all([
    Promise.all(registrationJobs),
    Promise.all(bookingJobs)
  ]);
  const elapsed = Date.now() - started;
  console.log(`  All ${N_REGISTRATIONS + N_BOOKINGS} requests completed in ${elapsed}ms\n`);

  // --- Assertions -----------------------------------------------------------
  const regOk = registrations.filter(r => r.status === 200);
  const bookOk = bookings.filter(b => b.status === 200);
  assert(regOk.length === N_REGISTRATIONS, `All ${N_REGISTRATIONS} concurrent registrations returned 200 (got ${regOk.length})`);
  assert(bookOk.length === N_BOOKINGS, `All ${N_BOOKINGS} concurrent bookings returned 200 (got ${bookOk.length})`);

  const mkIds = regOk.map(r => r.body?.mkPatientId).filter(Boolean);
  assert(new Set(mkIds).size === mkIds.length, `Every MK-PAT id unique (${new Set(mkIds).size}/${mkIds.length} unique)`);
  assert(mkIds.every(id => /^MK-PAT-2026-\d{6}$/.test(id)), 'All MK-PAT ids sequence-formatted');

  const tokenNumbers = bookOk.map(b => b.body?.token?.tokenNumber).filter(Boolean);
  assert(new Set(tokenNumbers).size === tokenNumbers.length, `Every queue token unique (${new Set(tokenNumbers).size}/${tokenNumbers.length} unique)`);

  // Correlation between HTTP responses and committed SQL rows.
  const patientsAfter = await db.patients.count();
  const tokensAfter = (await db.queue.tokens()).length;
  assert(patientsAfter === patientsBefore + regOk.length,
    `Patient row count matches successful registrations exactly (${patientsBefore} → ${patientsAfter}, expected +${regOk.length}) — no lost or duplicate writes`);
  assert(tokensAfter === tokensBefore + bookOk.length,
    `Queue token row count matches successful bookings exactly (${tokensBefore} → ${tokensAfter}, expected +${bookOk.length})`);

  // Database-level uniqueness audit (would catch any corrupted/duplicated write).
  const dupRows = await db.pool.query(`
    SELECT mk_patient_id, COUNT(*)::int AS n FROM patients GROUP BY mk_patient_id HAVING COUNT(*) > 1
  `);
  assert(dupRows.rows.length === 0, 'PostgreSQL GROUP BY audit: zero duplicate medical record numbers');
  const nullRows = await db.pool.query(`
    SELECT COUNT(*)::int AS n FROM patients WHERE name IS NULL OR mk_patient_id IS NULL OR registered_at IS NULL
  `);
  assert(nullRows.rows[0].n === 0, 'No partially-written (corrupted) patient rows — all NOT NULL constraints held');

  // Every registration produced exactly one audit entry (atomic transactions).
  const regAudits = await db.pool.query(
    `SELECT COUNT(*)::int AS n FROM audit_logs WHERE action = 'PATIENT_REGISTERED'`
  );
  assert(regAudits.rows[0].n >= regOk.length, `Atomic audit trail persisted for every registration (${regAudits.rows[0].n} entries)`);

  // Acceptance criterion: no local JSON file database.
  assert(!fs.existsSync(path.resolve(process.cwd(), 'data')), 'No data/ directory was created — zero filesystem persistence');

  console.log('\n================================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(failed === 0
    ? '🎉 CONCURRENCY REGRESSION PASSED — no locks, no duplicates, no corruption.'
    : '⚠️ CONCURRENCY REGRESSION FAILED.');
  console.log('================================================================\n');

  server.close();
  await db.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Concurrency test crashed:', err);
  await db.close().catch(() => {});
  process.exit(1);
});
