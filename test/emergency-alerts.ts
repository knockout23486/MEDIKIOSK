// ============================================================================
// SEC-014 / SEC-015 / SEC-016 Regression — Emergency Alert Data Integrity
// ----------------------------------------------------------------------------
// SEC-014: emergency tokens (EMERG-####) must be allocated from a PostgreSQL
//          sequence inside the alert transaction — the old Math.random()
//          900-value pool guaranteed unique-constraint violations that
//          silently dropped life-critical alerts.
// SEC-015: primary keys must come from crypto.randomUUID(), not Math.random().
// SEC-016: keyword matching must normalize case + whitespace for BOTH English
//          and Hindi symptom text.
//
// Acceptance under test: 10,000 red-flag alerts generated concurrently with
// ZERO database constraint violations, zero duplicate ids/tokens, and every
// alert persisted.
// ============================================================================
process.env.DB_POOL_MAX = process.env.DB_POOL_MAX ?? '20';

import fs from 'fs';
import path from 'path';
import type { Server } from 'http';

const TOTAL_ALERTS = 10_000;
const BATCH = 200;

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
  // Dynamic imports so pool sizing applies before module init.
  const { db } = await import('../server/db/store.js');
  const { seedDatabase } = await import('../server/db/seed.js');
  const { RedFlagEngine } = await import('../server/services/redFlagEngine.js');
  const { createApp } = await import('../server/index.js');

  console.log('\n================================================================');
  console.log('🚨 SEC-014/015/016 Regression — Emergency Alert Integrity');
  console.log('================================================================\n');

  await db.migrate();
  await seedDatabase(true);

  // --- 0. Static acceptance: Math.random() is gone from redFlagEngine.ts ----
  console.log('0. Math.random() eradicated from identifier generation:');
  const engineSrc = fs.readFileSync(path.resolve(process.cwd(), 'server/services/redFlagEngine.ts'), 'utf-8');
  assert(!engineSrc.includes('Math.random'), 'redFlagEngine.ts contains zero Math.random() calls');
  const storeSrc = fs.readFileSync(path.resolve(process.cwd(), 'server/db/store.ts'), 'utf-8');
  assert(storeSrc.includes('randomUUID'), 'Row id generator (genId) is crypto.randomUUID-based');

  // --- 1. SEC-014/015: 10,000 concurrent alert transactions ------------------
  console.log(`\n1. Sustained emergency-alert load (${TOTAL_ALERTS} alerts, batches of ${BATCH}):`);
  const startedAt = Date.now();
  let raised = 0;
  let errors = 0;
  let lastErr: unknown = null;

  const CHEST_PAIN = 'Severe pressing chest pain radiating to left arm with cold sweating';

  for (let done = 0; done < TOTAL_ALERTS; done += BATCH) {
    const jobs = Array.from({ length: Math.min(BATCH, TOTAL_ALERTS - done) }, (_, i) =>
      RedFlagEngine.evaluateInput(
        `${CHEST_PAIN} #${done + i}`,
        { Q_CHEST_RADIATION: 'LEFT_ARM_SHOULDER' },
        {
          id: 'PAT-EMERG-02',
          name: 'Shri Rajesh Patel',
          age: 62,
          gender: 'MALE',
          sessionId: 'SES-LOADTEST'
        }
      ).then((a) => {
        if (a) raised++;
      })
    );
    const results = await Promise.allSettled(jobs);
    for (const r of results) {
      if (r.status === 'rejected') {
        errors++;
        lastErr = r.reason;
      }
    }
  }
  const elapsed = Date.now() - startedAt;
  console.log(`  Completed in ${elapsed}ms (${Math.round((TOTAL_ALERTS / elapsed) * 1000)} alerts/s)`);
  if (lastErr) console.error('  first error:', String(lastErr).slice(0, 160));
  assert(errors === 0, `ZERO transaction failures across ${TOTAL_ALERTS} concurrent alert inserts (errors: ${errors})`);
  assert(raised === TOTAL_ALERTS, `All ${TOTAL_ALERTS} emergency rules fired and returned alerts (got ${raised})`);

  // Scope to this load test (the demo seed contains one pre-existing alert).
  const stats = await db.pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(DISTINCT id)::int AS distinct_ids,
      COUNT(DISTINCT token_number)::int AS distinct_tokens,
      COUNT(*) FILTER (WHERE token_number LIKE 'EMERG-%')::int AS emerg_tokens
    FROM red_flag_alerts
    WHERE session_id = 'SES-LOADTEST'
  `);
  const row = stats.rows[0];
  assert(row.total === TOTAL_ALERTS, `Every alert persisted: ${row.total}/${TOTAL_ALERTS} rows in PostgreSQL`);
  assert(row.distinct_ids === row.total, `All primary keys unique (${row.distinct_ids}/${row.total}) — zero PK collisions`);
  assert(row.distinct_tokens === row.total, `All emergency token numbers unique (${row.distinct_tokens}/${row.total}) — zero EMERG collisions`);
  assert(row.emerg_tokens === row.total, `Every token sequence-allocated with EMERG-#### format (${row.emerg_tokens}/${row.total})`);

  const uuidIds = await db.pool.query(
    `SELECT COUNT(*)::int AS n FROM red_flag_alerts WHERE session_id = 'SES-LOADTEST' AND id ~ '^RFA-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`
  );
  assert(uuidIds.rows[0].n === TOTAL_ALERTS, 'All alert ids are RFA-<crypto.randomUUID> format (SEC-015)');

  // --- 2. End-to-end HTTP path ------------------------------------------------
  console.log('\n2. Emergency alerts via the real HTTP API (kiosk path):');
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'patient', password: 'demo123' })
  }).then((r) => r.json());
  const auth = { Authorization: `Bearer ${loginRes.token}`, 'Content-Type': 'application/json' };

  const sessionRes = await fetch(`${base}/api/clinical/session`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ patientId: 'PAT-HERO-01', appointmentId: 'APT-001', departmentId: 'DEP-01', isAyush: false, chiefComplaint: 'chest pain' })
  }).then((r) => r.json());
  const sessionId = sessionRes.id;

  const HTTP_ALERTS = 300;
  const httpJobs = Array.from({ length: HTTP_ALERTS }, (_, i) =>
    fetch(`${base}/api/clinical/answer`, {
      method: 'POST', headers: auth,
      body: JSON.stringify({
        sessionId, patientId: 'PAT-HERO-01',
        questionId: `Q_HTTP_${i}`, questionText: 'Symptoms?',
        answerText: `${CHEST_PAIN} http-${i}`, inputMode: 'TOUCH'
      })
    }).then((r) => r.json())
  );
  const httpResults = await Promise.all(httpJobs);
  const httpAlerts = httpResults.filter((r) => r?.redFlagAlert?.id).map((r) => r.redFlagAlert);
  assert(httpAlerts.length === HTTP_ALERTS, `${HTTP_ALERTS} concurrent HTTP red-flags all returned alerts (got ${httpAlerts.length})`);
  assert(new Set(httpAlerts.map((a) => a.id)).size === HTTP_ALERTS, 'HTTP-path alert ids all unique');
  assert(httpAlerts.every((a) => /^EMERG-\d{4,}$/.test(a.tokenNumber)), 'HTTP-path tokens all sequence-formatted (EMERG-####)');
  const persisted = await db.pool.query(
    'SELECT COUNT(*)::int AS n FROM red_flag_alerts WHERE session_id = $1', [sessionId]
  );
  assert(persisted.rows[0].n === HTTP_ALERTS, `All ${HTTP_ALERTS} HTTP alerts persisted to PostgreSQL`);

  // --- 3. SEC-016: multilingual normalization ----------------------------------
  console.log('\n3. Multilingual keyword normalization (SEC-016):');
  const caps = await RedFlagEngine.evaluateInput(
    '   CHEST   PAIN   radiating to the LEFT ARM with heavy SWEATING   ',
    {},
    { id: 'PAT-T', name: 'T', age: 50, gender: 'MALE', sessionId: 'SES-NORM-1' }
  );
  assert(caps !== null, 'Whitespace-padded UPPERCASE English symptoms still trigger (chest pain + left arm)');

  const hindi = await RedFlagEngine.evaluateInput(
    '   छाती में दर्द  है और   पसीना   आ रहा है, सांस फूल रही है   ',
    {},
    { id: 'PAT-T', name: 'T', age: 50, gender: 'MALE', sessionId: 'SES-NORM-2' }
  );
  assert(hindi !== null, 'Whitespace-padded Hindi symptoms (छाती में दर्द + पसीना + सांस फूलना) trigger the ACS rule');

  const respDistress = await RedFlagEngine.evaluateInput(
    'CANNOT BREATHE, GASPING, blue lips',
    {},
    { id: 'PAT-T', name: 'T', age: 50, gender: 'MALE', sessionId: 'SES-NORM-3' }
  );
  assert(respDistress?.triggerRule === 'RED_FLAG_ACUTE_RESPIRATORY_FAILURE',
    'Uppercase respiratory-distress keywords trigger the correct rule');

  const benign = await RedFlagEngine.evaluateInput(
    'Routine follow-up for knee pain, feeling well, no complaints',
    {},
    { id: 'PAT-T', name: 'T', age: 50, gender: 'MALE', sessionId: 'SES-NORM-4' }
  );
  assert(benign === null, 'Benign input does NOT trigger any emergency rule (no false positives)');

  console.log('\n================================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(failed === 0
    ? '🎉 EMERGENCY-INTEGRITY REGRESSION PASSED — no collisions, no dropped alerts.'
    : '⚠️ EMERGENCY-INTEGRITY REGRESSION FAILED.');
  console.log('================================================================\n');

  server.close();
  await db.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Emergency alert regression crashed:', err);
  process.exit(1);
});
