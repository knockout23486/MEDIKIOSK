// ============================================================================
// SEC-003 Regression Test — API Security Boundary (JWT + RBAC)
// ----------------------------------------------------------------------------
// Boots the real Express app and asserts, for every protected endpoint:
//   1. 401 UNAUTHENTICATED with no token, a garbage token, a tampered
//      signature, a wrong-secret token, and an expired token.
//   2. 403 FORBIDDEN when authenticated but lacking the required role.
//   3. 2xx/4xx (never 401/403) when authenticated with a permitted role.
//   4. IDOR: a PATIENT token can read its OWN record but is refused (403)
//      when fetching another patient's record/notifications/timeline.
//   5. Login rejects bad credentials with 401 and never leaks passwordHash.
// ============================================================================
// Raise the login rate limit for this suite (limiter reads env lazily; the
// dedicated rate-limit behavior is tested in a child process below).
process.env.LOGIN_RATE_LIMIT_MAX = process.env.LOGIN_RATE_LIMIT_MAX ?? '1000';

import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Server } from 'http';
import { execFileSync } from 'child_process';
import jwt from 'jsonwebtoken';
import { createApp } from '../server/index.js';
import { db } from '../server/db/store.js';
import { seedDatabase } from '../server/db/seed.js';

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

interface CaseResult { status: number; body: any; }

async function call(base: string, method: string, path: string, token?: string, body?: unknown): Promise<CaseResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { parsed = text; }
  return { status: res.status, body: parsed };
}

interface DemoAccount { username: string; password: string; role: string; }

// Documented demo credentials (seedUsers.ts) — the API bcrypt-verifies each.
const ACCOUNTS: Record<string, DemoAccount> = {
  PATIENT: { username: 'patient', password: 'demo123', role: 'PATIENT' },
  DOCTOR: { username: 'doctor', password: 'doctor123', role: 'DOCTOR' },
  TRIAGE: { username: 'triage', password: 'triage123', role: 'TRIAGE' },
  ADMIN: { username: 'admin', password: 'admin123', role: 'ADMIN' },
  SYSTEM_ADMIN: { username: 'sysadmin', password: 'sysadmin123', role: 'SYSTEM_ADMIN' }
};

async function login(base: string, role: keyof typeof ACCOUNTS): Promise<string> {
  const acct = ACCOUNTS[role];
  const res = await call(base, 'POST', '/api/auth/login', undefined,
    { username: acct.username, password: acct.password });
  if (!res.body?.token) throw new Error(`login as ${role} failed: ${JSON.stringify(res.body)}`);
  return res.body.token as string;
}

async function main() {
  console.log('\n================================================================');
  console.log('🔒 SEC-003 Regression — JWT Authentication & RBAC Boundary');
  console.log('================================================================\n');

  await db.migrate();
  await seedDatabase(true);

  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as { port: number };
  const base = `http://127.0.0.1:${port}`;

  // --- 0. Login behavior (SEC-006/SEC-007) ----------------------------------
  console.log('0. Login & token issuance (strict credential verification):');
  const patientToken = await login(base, 'PATIENT');
  const doctorToken = await login(base, 'DOCTOR');
  const triageToken = await login(base, 'TRIAGE');
  const adminToken = await login(base, 'ADMIN');
  assert([patientToken, doctorToken, triageToken, adminToken].every(t => t.split('.').length === 3),
    'Credential login issues HS256 JWTs for every demo role');

  const pwOk = await call(base, 'POST', '/api/auth/login', undefined, { username: 'doctor', password: 'doctor123' });
  assert(pwOk.status === 200 && pwOk.body.token, 'Username+password login succeeds with correct credentials');
  assert(pwOk.body.user?.passwordHash === undefined, 'Login response never leaks passwordHash');

  // SEC-006: every passwordless variant must fail — no demo bypass exists.
  const roleOnly = await call(base, 'POST', '/api/auth/login', undefined, { role: 'ADMIN' });
  assert(roleOnly.status === 401, 'Passwordless role-only login is REJECTED (401) — no demo bypass');
  const missingPw = await call(base, 'POST', '/api/auth/login', undefined, { username: 'doctor' });
  assert(missingPw.status === 401, 'Login with username but no password is rejected (401)');
  const emptyPw = await call(base, 'POST', '/api/auth/login', undefined, { username: 'doctor', password: '' });
  assert(emptyPw.status === 401, 'Login with empty password is rejected (401)');
  const noBody = await call(base, 'POST', '/api/auth/login', undefined, {});
  assert(noBody.status === 401, 'Login with no credentials is rejected (401)');

  // SEC-006 regression: wrong password must fail for EVERY demo account.
  let wrongPwFails = 0;
  for (const acct of Object.values(ACCOUNTS)) {
    const res = await call(base, 'POST', '/api/auth/login', undefined, { username: acct.username, password: 'wrong-password' });
    if (res.status === 401) wrongPwFails++;
    else console.error(`    ✗ wrong password for ${acct.username} returned ${res.status}`);
  }
  assert(wrongPwFails === Object.keys(ACCOUNTS).length,
    `Wrong password fails (401) for all ${Object.keys(ACCOUNTS).length} demo accounts`);

  const pwUnknown = await call(base, 'POST', '/api/auth/login', undefined, { username: 'ghost', password: 'x' });
  assert(pwUnknown.status === 401, 'Login rejects unknown user (401)');

  // SEC-007: the database stores ONLY bcrypt hashes — zero plaintext.
  const hashRows = (await db.pool.query('SELECT username, password_hash FROM users')).rows;
  const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  assert(hashRows.every((r: any) => BCRYPT_RE.test(r.password_hash)),
    `users.password_hash is a bcrypt hash for all ${hashRows.length} rows`);
  assert(!hashRows.some((r: any) => Object.values(ACCOUNTS).some(a => a.username === r.username && a.password === r.password_hash)),
    'No plaintext demo password exists anywhere in the users table');

  const me = await call(base, 'GET', '/api/auth/me', doctorToken);
  assert(me.status === 200 && me.body.user?.role === 'DOCTOR', 'GET /api/auth/me returns the authenticated session');

  const demoStateHashes = await call(base, 'GET', '/api/demo/state', adminToken);
  assert(demoStateHashes.status === 200 && demoStateHashes.body?.users?.every?.((u: any) => u.passwordHash === undefined),
    'GET /api/demo/state exposes no password hashes');

  // --- 1. 401 sweep — every protected endpoint, no/bad token ---------------
  console.log('\n1. Unauthenticated access is rejected (401) on every protected endpoint:');
  const protectedEndpoints: Array<[string, string, unknown?]> = [
    ['GET', '/api/auth/me'],
    ['GET', '/api/users'],
    ['GET', '/api/patients'],
    ['POST', '/api/patients', { name: 'Should Not Persist' }],
    ['POST', '/api/abha/verify', { abhaNumber: '91-4829-1029-4821' }],
    ['GET', '/api/consents/PAT-HERO-01'],
    ['POST', '/api/consents', { patientId: 'PAT-HERO-01' }],
    ['GET', '/api/hospitals'],
    ['GET', '/api/departments'],
    ['GET', '/api/doctors'],
    ['GET', '/api/appointments'],
    ['POST', '/api/appointments', { patientId: 'PAT-HERO-01', practitionerId: 'PRAC-01' }],
    ['GET', '/api/queue/tokens'],
    ['POST', '/api/queue/checkin', { tokenNumber: 'A-027' }],
    ['POST', '/api/queue/advance', { practitionerId: 'PRAC-01' }],
    ['POST', '/api/clinical/questions', { chiefComplaint: 'knee pain' }],
    ['POST', '/api/clinical/session', { patientId: 'PAT-HERO-01' }],
    ['POST', '/api/clinical/answer', { sessionId: 'SES-HERO-01', questionId: 'Q1', questionText: '?', answerText: 'a' }],
    ['POST', '/api/clinical/ayush', { sessionId: 'SES-HERO-01', answers: {} }],
    ['GET', '/api/documents/PAT-HERO-01'],
    ['POST', '/api/documents/process-demo', { documentId: 'D1', patientId: 'PAT-HERO-01', fileName: 'f.pdf', rawText: 'x' }],
    ['GET', '/api/entities/PAT-HERO-01'],
    ['POST', '/api/entities/ENT-001/verify', {}],
    ['GET', '/api/timeline/PAT-HERO-01'],
    ['GET', '/api/abdm/records/PAT-HERO-01'],
    ['GET', '/api/abdm/fhir/PAT-HERO-01'],
    ['GET', '/api/ai-summary/SES-HERO-01'],
    ['POST', '/api/ai-summary/generate', { sessionId: 'SES-HERO-01', patientId: 'PAT-HERO-01' }],
    ['POST', '/api/ai-summary/SUM-HERO-01/verify', {}],
    ['GET', '/api/triage/alerts'],
    ['POST', '/api/triage/acknowledge/RFA-001', {}],
    ['GET', '/api/consultations/PAT-HERO-01'],
    ['POST', '/api/consultations', { patientId: 'PAT-HERO-01' }],
    ['POST', '/api/consultations/CON-1/finalize', { patientId: 'PAT-HERO-01' }],
    ['GET', '/api/notifications/PAT-HERO-01'],
    ['GET', '/api/audit/logs'],
    ['GET', '/api/system/health'],
    ['GET', '/api/integrations/events'],
    ['POST', '/api/demo/reset'],
    ['GET', '/api/demo/state'],
    ['GET', '/api/events']
  ];
  let unauth401 = 0;
  for (const [method, path, body] of protectedEndpoints) {
    const res = await call(base, method, path, undefined, body);
    if (res.status === 401) unauth401++;
    else console.error(`    ✗ ${method} ${path} returned ${res.status} (expected 401)`);
  }
  assert(unauth401 === protectedEndpoints.length,
    `All ${protectedEndpoints.length} protected endpoints return 401 without a token`);

  // --- 2. Token forgery / expiry --------------------------------------------
  console.log('\n2. Forged and expired tokens are rejected:');
  const forgedSig = patientToken.split('.');
  forgedSig[2] = Buffer.from('deadbeef').toString('base64url');
  const cases: Array<[string, string, string]> = [
    ['garbage token', 'not.a.jwt'],
    ['tampered signature', forgedSig.join('.')],
    ['wrong signing secret', jwt.sign({ role: 'ADMIN' }, 'attacker-controlled-secret', { expiresIn: '1h' })],
    ['expired token', jwt.sign({ role: 'ADMIN' }, (process.env.AUTH_JWT_SECRET ?? 'medikiosk-dev-jwt-secret:' + '0'.repeat(32)), { expiresIn: -60 })]
  ];
  for (const [label, token] of cases) {
    const res = await call(base, 'POST', '/api/patients', token, { name: 'Forged User' });
    assert(res.status === 401, `POST /api/patients rejects ${label} (401)`);
  }
  const leakedCount = await db.patients.count();
  assert(!(await db.patients.list()).some(p => p.name === 'Should Not Persist' || p.name === 'Forged User'),
    'No patient rows were written by unauthenticated/forged requests');

  // --- 3. RBAC 403 matrix ------------------------------------------------------
  console.log('\n3. Role checks (403 when authenticated without permission):');
  const forbidden: Array<[string, string, string, string, unknown?]> = [
    ['PATIENT', 'GET', '/api/patients', patientToken],
    ['PATIENT', 'GET', '/api/users', patientToken],
    ['PATIENT', 'GET', '/api/queue/tokens', patientToken],
    ['PATIENT', 'POST', '/api/queue/advance', patientToken, { practitionerId: 'PRAC-01' }],
    ['PATIENT', 'GET', '/api/triage/alerts', patientToken],
    ['PATIENT', 'GET', '/api/audit/logs', patientToken],
    ['PATIENT', 'GET', '/api/system/health', patientToken],
    ['PATIENT', 'GET', '/api/integrations/events', patientToken],
    ['DOCTOR', 'POST', '/api/patients', doctorToken, { name: 'Dr. Should Fail' }],
    ['DOCTOR', 'POST', '/api/triage/acknowledge/RFA-001', doctorToken, {}],
    ['DOCTOR', 'GET', '/api/users', doctorToken]
  ];
  let forb403 = 0;
  for (const [role, method, path, token, body] of forbidden) {
    const res = await call(base, method, path, token, body);
    if (res.status === 403) forb403++;
    else console.error(`    ✗ ${role} ${method} ${path} returned ${res.status} (expected 403)`);
  }
  assert(forb403 === forbidden.length, `All ${forbidden.length} wrong-role attempts return 403`);

  // Denials are audited asynchronously (fire-and-forget) so responses are not
  // delayed — poll briefly for the audit rows to commit.
  let denialCount = 0;
  for (let attempt = 0; attempt < 20; attempt++) {
    const denialAudited = await db.pool.query(
      `SELECT COUNT(*)::int AS n FROM audit_logs WHERE action = 'API_ACCESS_FORBIDDEN'`
    );
    denialCount = denialAudited.rows[0].n;
    if (denialCount >= forbidden.length) break;
    await new Promise(r => setTimeout(r, 100));
  }
  assert(denialCount >= forbidden.length, '403 denials are written to the PostgreSQL audit trail');

  // --- 4. IDOR / ownership -------------------------------------------------------
  console.log('\n4. Record-level access (IDOR) for PATIENT role:');
  const own = await call(base, 'GET', '/api/patients/PAT-HERO-01', patientToken);
  assert(own.status === 200 && own.body?.name, 'PATIENT token reads its OWN record (PAT-HERO-01 → 200)');
  const other = await call(base, 'GET', '/api/patients/PAT-EMERG-02', patientToken);
  assert(other.status === 403, 'PATIENT token cannot read another patient record (PAT-EMERG-02 → 403)');
  const otherNotif = await call(base, 'GET', '/api/notifications/PAT-EMERG-02', patientToken);
  assert(otherNotif.status === 403, 'PATIENT token cannot read another patient notifications (403)');
  const otherTimeline = await call(base, 'GET', '/api/timeline/PAT-EMERG-02', patientToken);
  assert(otherTimeline.status === 403, 'PATIENT token cannot read another patient timeline (403)');
  const staffRead = await call(base, 'GET', '/api/patients/PAT-EMERG-02', triageToken);
  assert(staffRead.status === 200, 'TRIAGE token CAN read any patient record for clinical work (200)');
  assert(own.body?.userId === undefined, 'API responses strip the internal ownership link (userId)');

  // --- 5. Happy paths with permitted roles -----------------------------------------
  console.log('\n5. Permitted role combinations succeed:');
  const reg = await call(base, 'POST', '/api/patients', triageToken, { name: 'Auth Test Citizen', age: 30, gender: 'MALE' });
  assert(reg.status === 200 && /^MK-PAT-/.test(reg.body?.mkPatientId ?? ''), 'TRIAGE registers a patient via POST /api/patients (200)');
  const list = await call(base, 'GET', '/api/patients', doctorToken);
  assert(list.status === 200 && Array.isArray(list.body), 'DOCTOR lists patients (200)');
  const audit = await call(base, 'GET', '/api/audit/logs', adminToken);
  assert(audit.status === 200 && Array.isArray(audit.body), 'ADMIN reads audit logs (200)');
  const hosp = await call(base, 'GET', '/api/hospitals', patientToken);
  assert(hosp.status === 200 && Array.isArray(hosp.body), 'PATIENT reads non-PHI reference data (hospitals → 200)');
  const demoState = await call(base, 'GET', '/api/demo/state', adminToken);
  assert(demoState.status === 200 && demoState.body?.patients, 'ADMIN reads demo state snapshot (200)');

  // SSE stream authorizes via query param and rejects without it.
  const sseOk = await fetch(`${base}/api/events?token=${encodeURIComponent(triageToken)}`);
  assert(sseOk.status === 200 && (sseOk.headers.get('content-type') ?? '').includes('text/event-stream'),
    'SSE /api/events accepts a valid token via query param (200 event-stream)');
  const sseBad = await fetch(`${base}/api/events`);
  assert(sseBad.status === 401, 'SSE /api/events without a token is rejected (401)');

  // --- 6. IDOR on write operations (SEC-009 / SEC-011) -----------------------
  console.log('\n6. Write-side IDOR protection (SEC-009/SEC-011):');

  // A session owned by ANOTHER patient (created legitimately by triage staff).
  const emergSession = await call(base, 'POST', '/api/clinical/session', triageToken, {
    patientId: 'PAT-EMERG-02', appointmentId: 'APT-002', departmentId: 'DEP-08',
    isAyush: false, chiefComplaint: 'Chest pain', status: 'IN_PROGRESS'
  });
  assert(emergSession.status === 200, 'TRIAGE opens a session for patient PAT-EMERG-02 (staff, 200)');

  // POST /clinical/session for another patient → 403
  const sessOther = await call(base, 'POST', '/api/clinical/session', patientToken, {
    patientId: 'PAT-EMERG-02', chiefComplaint: 'x'
  });
  assert(sessOther.status === 403, 'PATIENT cannot open a session for another patient (403)');
  const sessOwn = await call(base, 'POST', '/api/clinical/session', patientToken, {
    patientId: 'PAT-HERO-01', appointmentId: 'APT-001', departmentId: 'DEP-01',
    isAyush: true, chiefComplaint: 'Knee pain'
  });
  assert(sessOwn.status === 200, 'PATIENT opens a session for their OWN record (200)');

  // POST /clinical/answer — acceptance criterion of SEC-009.
  const ansOther = await call(base, 'POST', '/api/clinical/answer', patientToken, {
    sessionId: 'SES-HERO-01', questionId: 'Q1', questionText: 'Pain?', answerText: 'forged chest pain',
    patientId: 'PAT-EMERG-02'
  });
  assert(ansOther.status === 403, 'PATIENT POST /clinical/answer with another patientId → 403 (SEC-009 acceptance)');
  const ansForeignSession = await call(base, 'POST', '/api/clinical/answer', patientToken, {
    sessionId: emergSession.body?.id, questionId: 'Q1', questionText: 'Pain?',
    answerText: 'forged', patientId: 'PAT-HERO-01'
  });
  assert(ansForeignSession.status === 403, 'PATIENT cannot append answers to another patient session (403)');
  const ansOwn = await call(base, 'POST', '/api/clinical/answer', patientToken, {
    sessionId: sessOwn.body?.id, questionId: 'Q1', questionText: 'Pain?',
    answerText: 'knee pain worse in cold', patientId: 'PAT-HERO-01'
  });
  assert(ansOwn.status === 200, 'PATIENT answers on their OWN session (200)');
  const staffAns = await call(base, 'POST', '/api/clinical/answer', triageToken, {
    sessionId: emergSession.body?.id, questionId: 'Q2', questionText: 'Onset?',
    answerText: '45 minutes', patientId: 'PAT-EMERG-02'
  });
  assert(staffAns.status === 200, 'TRIAGE records answers for any patient (staff, 200)');

  // Session/patient mismatch is rejected even for staff (data integrity).
  const docMismatch = await call(base, 'POST', '/api/clinical/answer', doctorToken, {
    sessionId: sessOwn.body?.id, questionId: 'Q3', questionText: '?',
    answerText: 'mismatch', patientId: 'PAT-EMERG-02'
  });
  assert(docMismatch.status === 403, 'Session/patientId mismatch rejected even for DOCTOR (403)');

  // POST /clinical/ayush onto another patient's session → 403
  const ayushOther = await call(base, 'POST', '/api/clinical/ayush', patientToken, {
    sessionId: emergSession.body?.id, answers: {}
  });
  assert(ayushOther.status === 403, 'PATIENT cannot save AYUSH assessments onto another patient session (403)');
  const ayushOwn = await call(base, 'POST', '/api/clinical/ayush', patientToken, {
    sessionId: sessOwn.body?.id, answers: {}
  });
  assert(ayushOwn.status === 200, 'PATIENT saves AYUSH assessment on own session (200)');

  // POST /documents/process-demo for another patient → 403 (SEC-011)
  const docOther = await call(base, 'POST', '/api/documents/process-demo', patientToken, {
    documentId: 'DOC-EVIL', patientId: 'PAT-EMERG-02', fileName: 'evil.pdf', rawText: 'Hb: 3.0'
  });
  assert(docOther.status === 403, 'PATIENT cannot process documents into another patient record (403, SEC-011)');
  const docOwn = await call(base, 'POST', '/api/documents/process-demo', patientToken, {
    documentId: 'DOC-OWN-1', patientId: 'PAT-HERO-01', fileName: 'own.pdf', rawText: 'Hemoglobin: 10.2 g/dL'
  });
  assert(docOwn.status === 200, 'PATIENT processes a document into their OWN record (200)');

  // POST /ai-summary/generate for another patient → 403; GET foreign summary → 403
  const sumOther = await call(base, 'POST', '/api/ai-summary/generate', patientToken, {
    sessionId: emergSession.body?.id, patientId: 'PAT-EMERG-02'
  });
  assert(sumOther.status === 403, 'PATIENT cannot generate summaries for another patient (403)');
  const emergSummary = await call(base, 'POST', '/api/ai-summary/generate', triageToken, {
    sessionId: emergSession.body?.id, patientId: 'PAT-EMERG-02'
  });
  assert(emergSummary.status === 200, 'TRIAGE generates a summary for patient PAT-EMERG-02 (staff, 200)');
  const readForeign = await call(base, 'GET', `/api/ai-summary/${emergSession.body?.id}`, patientToken);
  assert(readForeign.status === 403, 'PATIENT cannot READ another patient AI summary by sessionId (403)');

  // POST /consents + /appointments for another patient → 403
  const consentOther = await call(base, 'POST', '/api/consents', patientToken, { patientId: 'PAT-EMERG-02' });
  assert(consentOther.status === 403, 'PATIENT cannot grant consent for another patient (403)');
  const apptOther = await call(base, 'POST', '/api/appointments', patientToken, {
    patientId: 'PAT-EMERG-02', practitionerId: 'PRAC-01', departmentId: 'DEP-01', hospitalId: 'HOSP-01'
  });
  assert(apptOther.status === 403, 'PATIENT cannot book appointments for another patient (403)');

  // No forged rows landed: the other patient's answers were never written.
  const emergAnswers = await db.pool.query(
    'SELECT COUNT(*)::int AS n FROM clinical_answers WHERE session_id = $1 AND answer_text = $2',
    [emergSession.body?.id, 'forged chest pain']
  );
  assert(emergAnswers.rows[0].n === 0, 'No forged clinical answers persisted for the other patient');

  // --- 7. Demo control-center lockdown (SEC-010) -------------------------------
  console.log('\n7. Demo reset/state RBAC (SEC-010):');
  const sysadminToken = await login(base, 'SYSTEM_ADMIN');
  const resetByPatient = await call(base, 'POST', '/api/demo/reset', patientToken);
  assert(resetByPatient.status === 403, 'PATIENT cannot wipe the database via /demo/reset (403)');
  const resetByDoctor = await call(base, 'POST', '/api/demo/reset', doctorToken);
  assert(resetByDoctor.status === 403, 'DOCTOR cannot wipe the database via /demo/reset (403)');
  const resetByTriage = await call(base, 'POST', '/api/demo/reset', triageToken);
  assert(resetByTriage.status === 403, 'TRIAGE cannot wipe the database via /demo/reset (403)');
  const resetByAdmin = await call(base, 'POST', '/api/demo/reset', adminToken);
  assert(resetByAdmin.status === 403, 'ADMIN cannot wipe the database via /demo/reset (403)');
  const resetBySysadmin = await call(base, 'POST', '/api/demo/reset', sysadminToken);
  assert(resetBySysadmin.status === 200, 'SYSTEM_ADMIN may reset the demo environment (200)');

  const stateByPatient = await call(base, 'GET', '/api/demo/state', patientToken);
  assert(stateByPatient.status === 403, 'PATIENT cannot exfiltrate the full DB snapshot via /demo/state (403)');
  const stateByDoctor = await call(base, 'GET', '/api/demo/state', doctorToken);
  assert(stateByDoctor.status === 403, 'DOCTOR cannot read full DB snapshot via /demo/state (403)');
  const stateByAdmin = await call(base, 'GET', '/api/demo/state', adminToken);
  assert(stateByAdmin.status === 200 && Array.isArray(stateByAdmin.body?.patients), 'ADMIN may read the demo snapshot (200)');

  // --- 8. Rate limiting + ephemeral dev secret (SEC-012 / SEC-013) --------------
  console.log('\n8. Login rate limiting & dev-secret ephemerality:');
  let rateLimited = false;
  let statuses: number[] = [];
  try {
    const out = execFileSync('npx', ['tsx', '-e', `
      import('./server/index.js').then(async (mod) => {
        const app = mod.createApp();
        const server = await new Promise<any>((resolve) => {
          const s = app.listen(0, '127.0.0.1', () => resolve(s));
        });
        const base = 'http://127.0.0.1:' + server.address().port;
        const statuses: number[] = [];
        for (let i = 0; i < 5; i++) {
          const r = await fetch(base + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'doctor', password: 'wrong-' + i })
          });
          statuses.push(r.status);
        }
        server.close();
        console.log('RL_STATUSES:' + JSON.stringify(statuses));
        process.exit(0);
      }).catch(e => { console.error(e); process.exit(1); });
    `], { cwd: process.cwd(), stdio: 'pipe', timeout: 90_000, env: { ...process.env, LOGIN_RATE_LIMIT_MAX: '3', LOGIN_RATE_LIMIT_WINDOW_MS: '60000' } }).toString();
    statuses = JSON.parse((out.match(/RL_STATUSES:(\[[^\]]+\])/) ?? ['','[]'])[1]);
  } catch { statuses = []; }
  rateLimited = statuses.length === 5 && statuses.slice(0, 3).every(c => c === 401) && statuses.slice(3).every(c => c === 429);
  assert(rateLimited, `Login rate limiter engages: first attempts 401, then 429 (got ${JSON.stringify(statuses)})`);

  // SEC-013: dev fallback secrets must be RANDOM PER PROCESS — a token signed
  // by one process must fail verification in another.
  let ephemeralOk = false;
  try {
    const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-jwt-'));
    const modPath = path.resolve(process.cwd(), 'server/middleware/auth.js');
    const tok = execFileSync('npx', ['tsx', '-e',
      `delete process.env.AUTH_JWT_SECRET; process.chdir(${JSON.stringify(scratch)}); import(${JSON.stringify(modPath)}).then(m => { console.log('T:' + m.signToken({ id: 'u', username: 'x', role: 'PATIENT', name: 'x' })); })`],
      { cwd: process.cwd(), stdio: 'pipe', timeout: 60_000 }).toString().trim();
    const token = tok.split('\n').pop()?.slice(2) ?? '';
    const verdict = execFileSync('npx', ['tsx', '-e',
      `delete process.env.AUTH_JWT_SECRET; process.chdir(${JSON.stringify(scratch)}); import(${JSON.stringify(modPath)}).then(m => { console.log('V:' + (m.verifyToken(${JSON.stringify(token)}) === null)); })`],
      { cwd: process.cwd(), stdio: 'pipe', timeout: 60_000 }).toString();
    ephemeralOk = verdict.includes('V:true');
  } catch { ephemeralOk = false; }
  assert(ephemeralOk, 'Dev JWT fallback is RANDOM EPHEMERAL per process (cross-process token rejected)');

  console.log('\n================================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(failed === 0
    ? '🎉 AUTH REGRESSION PASSED — API boundary enforced on every route.'
    : '⚠️ AUTH REGRESSION FAILED.');
  console.log('================================================================\n');

  server.close();
  await db.close();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Auth regression crashed:', err);
  await db.close().catch(() => {});
  process.exit(1);
});
