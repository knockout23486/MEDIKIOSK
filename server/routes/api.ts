import express, { type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { db, genId } from '../db/store.js';
import { ClinicalAIService } from '../services/clinicalEngine.js';
import { RedFlagEngine } from '../services/redFlagEngine.js';
import { OcrEngine } from '../services/ocrEngine.js';
import { FusionEngine } from '../services/fusionEngine.js';
import { SummaryEngine } from '../services/summaryEngine.js';
import { QueueEngine } from '../services/queueEngine.js';
import { AbdmAdapter } from '../services/abdmAdapter.js';
import { HisAdapter } from '../services/hisAdapter.js';
import { seedDatabase } from '../db/seed.js';
import { requireAuth, signToken, JWT_EXPIRES_IN } from '../middleware/auth.js';
import type { UserRole } from '../db/schema.js';

export const apiRouter = express.Router();

// ============================================================================
// SECURITY BOUNDARY (SEC-003)
// ----------------------------------------------------------------------------
// Every route below is guarded by `requireAuth(...roles)`:
//   * a valid `Authorization: Bearer <JWT>` is required — 401 otherwise;
//   * the caller's role must be in the route's allow-list — 403 otherwise;
//   * PATIENT-role reads of individual records additionally enforce record
//     ownership (IDOR protection).
// The ONLY public endpoint is POST /api/auth/login.
// ============================================================================

// Roles
const STAFF_READ: UserRole[] = ['DOCTOR', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'];
const ALL: UserRole[] = ['PATIENT', 'DOCTOR', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'];

// Every handler is async — wrap them so a rejected promise (SQL failure etc.)
// becomes a controlled 500 instead of an unhandled rejection.
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
};

/** PATIENT-role ownership guard: may a PATIENT read this patient's data? */
async function patientReadableByCaller(patientId: string, user: { id: string; role: UserRole }): Promise<boolean> {
  if (user.role !== 'PATIENT') return true; // staff access is governed by RBAC
  const patient = await db.patients.get(patientId);
  return !!patient && patient.userId === user.id;
}

function forbidden(res: Response, message: string) {
  return res.status(403).json({ success: false, code: 'FORBIDDEN', message });
}

/**
 * Write-side ownership guard (SEC-009/SEC-011): when a PATIENT-role caller
 * references a patientId in a write payload, that id must resolve to the
 * patient record owned by the JWT subject. Staff roles are authorized by
 * their route RBAC allow-list and pass through.
 */
async function patientWritableByCaller(
  patientId: unknown,
  user: { id: string; role: UserRole }
): Promise<boolean> {
  if (typeof patientId !== 'string' || patientId.length === 0) return true; // staff-only flows
  if (user.role !== 'PATIENT') return true;
  return patientReadableByCaller(patientId, user);
}

/**
 * Session-integrity guard: a clinical session id referenced in a payload must
 * belong to the claimed patientId (enforced for EVERY role — this is data
 * integrity, not just authorization). Returns null when the session is
 * unknown (legacy demo flows may reference not-yet-persisted sessions).
 */
async function sessionPatientId(sessionId: unknown): Promise<string | null | undefined> {
  if (typeof sessionId !== 'string' || sessionId.length === 0) return undefined;
  const session = await db.clinical.getSession(sessionId);
  return session ? session.patientId : null;
}

// Login rate limiter (SEC-012). Constructed ONCE at module initialization
// (express-rate-limit validates against per-request construction); keyed per
// IP + username. Default: 10 attempts / 15 minutes. Tests override the limit
// via CLI env, e.g. `LOGIN_RATE_LIMIT_MAX=1000 npm run test:auth`.
const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  // ipKeyGenerator normalizes IPv4/IPv6 (+ mapped) addresses so limits cannot
  // be bypassed by switching address families; username adds per-account keying.
  keyGenerator: (req: Request) =>
    `${ipKeyGenerator(req.ip ?? 'unknown', 56)}:${
      typeof req.body?.username === 'string' ? req.body.username.slice(0, 64) : ''
    }`,
  handler: (_req: Request, res: Response) => {
    console.warn('[Auth] Rate limit: too many login attempts.');
    res.status(429).json({
      success: false,
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again later.'
    });
  }
});

// 1. REAL-TIME SERVER-SENT EVENTS (SSE) — authenticated (token via query param,
//    because EventSource cannot set HTTP headers).
apiRouter.get('/events', requireAuth(), (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unsubscribe = db.subscribe((event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });

  // Heartbeat every 25s
  const interval = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ time: new Date().toISOString() })}\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(interval);
    unsubscribe();
  });
});

// 2. AUTHENTICATION & USERS --------------------------------------------------
// PUBLIC ROUTE — the single entry point of the security boundary. EVERY login
// (demo roles included) must present a valid username + password; the bcrypt
// hash comparison is mandatory (SEC-006/SEC-007). No passwordless path exists.
apiRouter.post('/auth/login', loginLimiter, wrap(async (req, res) => {
  const { username, password } = req.body;

  // Strict shape check: both credentials are always required.
  if (typeof username !== 'string' || typeof password !== 'string' || username.length === 0 || password.length === 0) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_CREDENTIALS',
      message: 'Username and password are required.'
    });
  }

  const user = await db.users.findByLogin(username);

  // Constant-work comparison: run bcrypt even for unknown usernames so
  // response timing cannot enumerate valid accounts.
  const BCRYPT_DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO7ZUbE0f6b/6j3oA1sV8g2YQeXwJmR1e';
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? BCRYPT_DUMMY_HASH);

  if (!user || !passwordOk) {
    await db.addAuditLog({
      correlationId: 'AUTH-LOGIN',
      actorId: String(username),
      actorRole: 'PATIENT',
      action: 'USER_LOGIN_FAILURE',
      resourceType: 'USER',
      resourceId: String(username),
      details: { reason: 'INVALID_CREDENTIALS' },
      ipAddress: req.ip || '127.0.0.1'
    });
    return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid username or password.' });
  }

  await db.addAuditLog({
    correlationId: 'AUTH-LOGIN',
    actorId: user.id,
    actorRole: user.role,
    action: 'USER_LOGIN_SUCCESS',
    resourceType: 'USER',
    resourceId: user.id,
    details: { username: user.username, role: user.role, authMode: 'USERNAME_PASSWORD' },
    ipAddress: req.ip || '127.0.0.1'
  });

  const token = signToken(user);
  const { passwordHash: _ph, ...safeUser } = user;
  return res.json({ success: true, user: safeUser, token, tokenType: 'Bearer', expiresIn: JWT_EXPIRES_IN });
}));

// Session introspection for the client.
apiRouter.get('/auth/me', requireAuth(), wrap(async (req, res) => {
  res.json({ success: true, user: req.user, expires: JWT_EXPIRES_IN });
}));

apiRouter.get('/users', requireAuth('ADMIN', 'SYSTEM_ADMIN'), wrap(async (_req, res) => {
  const users = await db.users.list();
  res.json(users.map(({ passwordHash: _ph, ...u }) => u));
}));

// 3. PATIENTS & ABHA -----------------------------------------------------------
apiRouter.get('/patients', requireAuth(...STAFF_READ), wrap(async (_req, res) => {
  res.json(await db.patients.list());
}));

apiRouter.get('/patients/:id', requireAuth(), wrap(async (req, res) => {
  const patient = await db.patients.get(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  // IDOR protection: a PATIENT token may only read its OWN record.
  if (req.user!.role === 'PATIENT' && patient.userId !== req.user!.id) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own record.' });
  }
  const { userId: _u, ...safe } = patient;
  res.json(safe);
}));

apiRouter.post('/patients', requireAuth('PATIENT', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  if (!req.body || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Patient name is required' });
  }
  // Single SQL transaction: patient row + sequence-allocated MK-PAT id +
  // DPDP audit entry. Safe under concurrent kiosk registrations.
  const newPatient = await db.patients.register(req.body, { ipAddress: req.ip });
  const { userId: _u, ...safe } = newPatient;
  res.json(safe);
}));

apiRouter.post('/abha/verify', requireAuth('PATIENT', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  const { abhaNumber, otp } = req.body;
  const result = await AbdmAdapter.verifyAbha(abhaNumber, otp);
  res.json(result);
}));

// 4. CONSENTS --------------------------------------------------------------------
apiRouter.get('/consents/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own consent record.' });
  }
  const consent = await db.consents.get(req.params.patientId);
  res.json(consent || null);
}));

apiRouter.post('/consents', requireAuth('PATIENT', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  // SEC-009: a PATIENT token may only grant consent for its OWN record.
  if (!(await patientWritableByCaller(req.body?.patientId, req.user!))) {
    return forbidden(res, 'Patients may only grant consent for their own record.');
  }
  // Atomic upsert on patient_id + audit entry in one transaction.
  const newConsent = await db.consents.grant(req.body, { ipAddress: req.ip });
  res.json(newConsent);
}));

// 5. HOSPITALS, DEPARTMENTS & PRACTITIONERS (non-PHI reference data) -------------
apiRouter.get('/hospitals', requireAuth(...ALL), wrap(async (_req, res) => {
  res.json(await db.reference.hospitals());
}));

apiRouter.get('/departments', requireAuth(...ALL), wrap(async (req, res) => {
  const { hospitalId } = req.query;
  res.json(await db.reference.departments(typeof hospitalId === 'string' ? hospitalId : undefined));
}));

apiRouter.get('/doctors', requireAuth(...ALL), wrap(async (req, res) => {
  const { departmentId, hospitalId } = req.query;
  res.json(
    await db.reference.practitioners({
      departmentId: typeof departmentId === 'string' ? departmentId : undefined,
      hospitalId: typeof hospitalId === 'string' ? hospitalId : undefined
    })
  );
}));

// 6. APPOINTMENTS & QUEUE ----------------------------------------------------------
apiRouter.get('/appointments', requireAuth(...STAFF_READ), wrap(async (_req, res) => {
  res.json(await db.appointments.list());
}));

apiRouter.post('/appointments', requireAuth('PATIENT', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  // SEC-009: a PATIENT token may only book for its OWN record.
  if (!(await patientWritableByCaller(req.body?.patientId, req.user!))) {
    return forbidden(res, 'Patients may only book appointments for themselves.');
  }
  // Atomic: appointment + queue token + SMS notification + audit log.
  const { appointment, token } = await db.appointments.book(req.body, { ipAddress: req.ip });
  res.json({ appointment, token });
}));

apiRouter.get('/queue/tokens', requireAuth(...STAFF_READ), wrap(async (_req, res) => {
  res.json(await db.queue.tokens());
}));

apiRouter.post('/queue/checkin', requireAuth('PATIENT', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  const { tokenNumber, patientId } = req.body;
  // SEC-009: a PATIENT token may only check in tokens for its OWN record.
  if (!(await patientWritableByCaller(patientId, req.user!))) {
    return forbidden(res, 'Patients may only check in their own tokens.');
  }
  const token = await db.queue.checkIn(tokenNumber, patientId);
  if (!token) return res.status(404).json({ message: 'Token not found' });
  if (req.user!.role === 'PATIENT' && token.patientId !== patientId &&
      !(await patientReadableByCaller(token.patientId, req.user!))) {
    return forbidden(res, 'Patients may only check in their own tokens.');
  }
  res.json({ success: true, token });
}));

apiRouter.post('/queue/advance', requireAuth('DOCTOR', 'TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  const { practitionerId } = req.body;
  const nextToken = await QueueEngine.advanceQueue(practitionerId || 'PRAC-01');
  res.json({ success: true, activeToken: nextToken });
}));

// 7. CLINICAL INTAKE & ADAPTIVE HISTORY ----------------------------------------------
apiRouter.post('/clinical/questions', requireAuth(...ALL), (req, res) => {
  const { chiefComplaint, isAyush } = req.body;
  const questions = ClinicalAIService.getInitialQuestions(chiefComplaint || '', !!isAyush);
  res.json(questions);
});

apiRouter.post('/clinical/session', requireAuth(...ALL), wrap(async (req, res) => {
  // SEC-009: a PATIENT token may only open a session for its OWN record.
  if (!(await patientWritableByCaller(req.body?.patientId, req.user!))) {
    return forbidden(res, 'Patients may only start clinical sessions for themselves.');
  }
  const session = await db.clinical.createSession(req.body);
  res.json(session);
}));

apiRouter.post('/clinical/answer', requireAuth(...ALL), wrap(async (req, res) => {
  const { sessionId, questionId, questionText, answerText, inputMode, voiceTranscript, patientId } = req.body;

  // SEC-009: a PATIENT token may only write answers against its OWN patientId.
  if (!(await patientWritableByCaller(patientId, req.user!))) {
    return forbidden(res, 'Patients may only submit answers for their own record.');
  }

  // Session integrity (every role): a known sessionId must belong to the
  // claimed patientId — otherwise anyone could append answers to anyone
  // else's clinical intake.
  const sessionOwner = await sessionPatientId(sessionId);
  if (sessionOwner !== null && sessionOwner !== undefined && sessionOwner !== patientId) {
    return forbidden(res, 'Clinical session does not belong to the claimed patient.');
  }

  const patient = patientId ? await db.patients.get(patientId) : undefined;

  const answer = {
    id: genId('ANS-'),
    sessionId,
    questionId,
    questionText,
    answerText,
    inputMode: inputMode || 'TOUCH',
    voiceTranscript,
    confidence: inputMode === 'VOICE' ? 0.95 : 1.0,
    redFlagFlagged: false,
    provenance: (inputMode === 'VOICE' ? 'PATIENT_VOICE' : 'PATIENT_TOUCH') as any,
    timestamp: new Date().toISOString()
  };

  // Evaluate emergency red-flags in real time (alert persists via SQL tx).
  const redFlag = await RedFlagEngine.evaluateInput(
    (voiceTranscript || answerText) + ' ' + questionText,
    { [questionId]: answerText },
    {
      id: patientId || 'PAT-TEMP',
      name: patient?.name || 'Patient',
      age: patient?.age || 50,
      gender: patient?.gender || 'FEMALE',
      sessionId
    }
  );

  if (redFlag) {
    answer.redFlagFlagged = true;
  }

  await db.clinical.addAnswer(answer);

  res.json({ answer, redFlagAlert: redFlag });
}));

apiRouter.post('/clinical/ayush', requireAuth(...ALL), wrap(async (req, res) => {
  const { sessionId, answers } = req.body;

  // SEC-009: a PATIENT token may only save assessments onto its OWN session.
  const sessionOwner = await sessionPatientId(sessionId);
  if (req.user!.role === 'PATIENT') {
    if (!sessionOwner || !(await patientReadableByCaller(sessionOwner, req.user!))) {
      return forbidden(res, 'Patients may only save assessments for their own sessions.');
    }
  }

  const prakritiCalc = ClinicalAIService.calculatePrakriti(answers || {});

  const assessment = {
    id: genId('AYUSH-'),
    sessionId,
    prakriti: {
      vata: prakritiCalc.vata,
      pitta: prakritiCalc.pitta,
      kapha: prakritiCalc.kapha,
      dominant: prakritiCalc.dominant
    },
    vikriti: {
      imbalance: `${prakritiCalc.dominant} Prakopa with Asthi-Sandhi Dhatukshaya`,
      severity: 'MODERATE' as const
    },
    dashavidha: {
      sara: 'MADHYAMA' as const,
      samhanana: 'MADHYAMA' as const,
      pramana: 'MADHYAMA' as const,
      satmya: 'MADHYAMA' as const,
      sattva: 'MADHYAMA' as const,
      aharaShakti: 'AVARA' as const,
      vyayamaShakti: 'AVARA' as const,
      vaya: 'VRIDDHA' as const
    },
    agni: prakritiCalc.agni,
    koshtha: prakritiCalc.koshtha,
    ahara: 'Vegetarian, irregular timings (Vishamashana)',
    vihara: 'Sedentary, disturbed sleep due to joint discomfort',
    nidana: ['Vatakara Ahara', 'Aging (Vaya-janya)', 'Cold weather exposure'],
    sampraptiSummary: 'Prakupita Vata localizes in Janu Sandhi manifesting as Sandhivata (Osteoarthritis).'
  };

  await db.clinical.saveAyushAssessment(assessment as any);
  res.json(assessment);
}));

// 8. DOCUMENTS & OCR PIPELINE -----------------------------------------------------------
apiRouter.get('/documents/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own documents.' });
  }
  res.json(await db.documents.listByPatient(req.params.patientId));
}));

apiRouter.post('/documents/process-demo', requireAuth(...ALL), wrap(async (req, res) => {
  const { documentId, patientId, fileName, rawText } = req.body;

  // SEC-011: a PATIENT token may only process documents into its OWN record.
  if (!(await patientWritableByCaller(patientId, req.user!))) {
    return forbidden(res, 'Patients may only process documents for their own record.');
  }

  const pipelineResult = await OcrEngine.processDocument(documentId, patientId, fileName, rawText);

  // Atomic: OCR result + all extracted entities + audit log in one tx.
  await db.documents.saveOcrPipeline(
    pipelineResult.ocrResult,
    pipelineResult.entities,
    {
      documentId,
      entitiesCount: pipelineResult.entities.length,
      confidence: pipelineResult.ocrResult.confidence,
      ipAddress: req.ip
    }
  );

  res.json(pipelineResult);
}));

apiRouter.get('/entities/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own entities.' });
  }
  res.json(await db.documents.entitiesByPatient(req.params.patientId));
}));

apiRouter.post('/entities/:id/verify', requireAuth('DOCTOR', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  const entity = await db.documents.verifyEntity(req.params.id, {
    name: req.body.name,
    value: req.body.value
  });
  if (!entity) return res.status(404).json({ message: 'Entity not found' });
  res.json({ success: true, entity });
}));

// 9. TIMELINE & ABDM ----------------------------------------------------------------------
apiRouter.get('/timeline/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own timeline.' });
  }
  res.json(await db.timeline.byPatient(req.params.patientId));
}));

apiRouter.get('/abdm/records/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own ABDM records.' });
  }
  res.json(await db.abdm.recordsByPatient(req.params.patientId));
}));

apiRouter.get('/abdm/fhir/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own FHIR bundle.' });
  }
  const bundle = await AbdmAdapter.generateFhirPatientBundle(req.params.patientId);
  res.json(bundle);
}));

// 10. AI STRUCTURED SUMMARY -------------------------------------------------------------------
apiRouter.get('/ai-summary/:sessionId', requireAuth(), wrap(async (req, res) => {
  const summary = await db.summaries.bySession(req.params.sessionId);
  // IDOR: a PATIENT token may only read summaries for its OWN sessions.
  if (summary && req.user!.role === 'PATIENT' &&
      !(await patientReadableByCaller(summary.patientId, req.user!))) {
    return forbidden(res, 'Patients may only access their own summaries.');
  }
  res.json(summary || null);
}));

apiRouter.post('/ai-summary/generate', requireAuth(...ALL), wrap(async (req, res) => {
  const { sessionId, patientId } = req.body;

  // SEC-009: a PATIENT token may only generate summaries for its OWN record,
  // and a known session must belong to the claimed patient (all roles).
  if (!(await patientWritableByCaller(patientId, req.user!))) {
    return forbidden(res, 'Patients may only generate summaries for their own record.');
  }
  const sessionOwner = await sessionPatientId(sessionId);
  if (sessionOwner !== null && sessionOwner !== undefined && sessionOwner !== patientId) {
    return forbidden(res, 'Clinical session does not belong to the claimed patient.');
  }

  const summary = await SummaryEngine.generateSummary(sessionId, patientId);
  res.json(summary);
}));

apiRouter.post('/ai-summary/:id/verify', requireAuth('DOCTOR', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  const summary = await db.summaries.verify(req.params.id, {
    doctorId: req.body.doctorId ?? req.user!.id,
    doctorNotes: req.body.doctorNotes,
    chiefComplaint: req.body.chiefComplaint,
    historyOfPresentIllness: req.body.historyOfPresentIllness
  });
  if (!summary) return res.status(404).json({ message: 'Summary not found' });
  res.json({ success: true, summary });
}));

// 11. TRIAGE ALERTS ------------------------------------------------------------------------------
apiRouter.get('/triage/alerts', requireAuth(...STAFF_READ), wrap(async (_req, res) => {
  res.json(await db.alerts.list());
}));

apiRouter.post('/triage/acknowledge/:id', requireAuth('TRIAGE', 'ADMIN', 'SYSTEM_ADMIN'), wrap(async (req, res) => {
  const alert = await db.alerts.acknowledge(req.params.id, {
    acknowledgedBy: req.body.acknowledgedBy,
    actionTaken: req.body.actionTaken
  });
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json({ success: true, alert });
}));

// 12. CONSULTATION & PRESCRIPTION -------------------------------------------------------------------
apiRouter.get('/consultations/:patientId', requireAuth(...STAFF_READ), wrap(async (req, res) => {
  res.json(await db.consultations.byPatient(req.params.patientId));
}));

apiRouter.post('/consultations', requireAuth('DOCTOR', 'ADMIN'), wrap(async (req, res) => {
  const consultation = await db.consultations.create(req.body);
  res.json(consultation);
}));

apiRouter.post('/consultations/:id/finalize', requireAuth('DOCTOR', 'ADMIN'), wrap(async (req, res) => {
  const existing = (await db.consultations.byPatient(req.body.patientId || ''))
    .find((c) => c.id === req.params.id);

  const consultation = existing || {
    id: req.params.id,
    appointmentId: req.body.appointmentId || '',
    patientId: req.body.patientId || '',
    practitionerId: req.body.practitionerId || 'PRAC-01',
    aiSummaryId: req.body.aiSummaryId || 'SUM-HERO-01',
    clinicalExamination: req.body.clinicalExamination || {
      generalAppearance: 'Conscious, oriented',
      vitals: { bp: '124/82 mmHg', pulse: '76 bpm', temp: '98.4 F', spo2: '99%', respRate: '16/min' },
      systemicExam: 'Knee joints: Crepitus on flexion, no warm effusion'
    },
    assessment: req.body.assessment || 'Janu Sandhivata (Bilateral Knee Osteoarthritis) with Mandagni',
    finalDiagnosis: req.body.finalDiagnosis || [
      { code: 'M17.0', name: 'Primary Bilateral Osteoarthritis of Knee', system: 'ICD11' },
      { code: 'NAMASTE-AYU-042', name: 'Janu Sandhivata', system: 'NAMASTE_AYUSH' }
    ],
    ayushChikitsaSutra: 'Vatahara, Shoolahara, Agni-Deepana & Rasayana Chikitsa',
    followUpDate: req.body.followUpDate || '2026-09-28',
    dietLifestyleAdvice: req.body.dietLifestyleAdvice || [
      'Avoid cold and dry items',
      'Daily mild warm oil massage (Mahanarayana Taila)',
      'Avoid squatting on floor'
    ],
    status: 'FINALIZED' as const,
    startedAt: new Date().toISOString(),
    finalizedAt: new Date().toISOString()
  } as any;

  // Atomic: consultation upsert + prescription items + audit log.
  const finalized = await db.consultations.finalize(
    consultation,
    Array.isArray(req.body.prescriptions) ? req.body.prescriptions : [],
    { ipAddress: req.ip }
  );

  // Sync to HIS EMR Gateway AFTER the clinical data is safely committed.
  await HisAdapter.syncPreIntakeEncounter({
    encounterId: finalized.id,
    patientId: finalized.patientId,
    practitionerId: finalized.practitionerId,
    departmentId: 'DEP-01',
    chiefComplaint: finalized.assessment,
    aiSummaryId: finalized.aiSummaryId,
    intakeTimestamp: new Date().toISOString()
  });

  res.json({ success: true, consultation: finalized });
}));

// 13. NOTIFICATIONS, AUDIT & SYSTEM HEALTH ------------------------------------------------------------
apiRouter.get('/notifications/:patientId', requireAuth(), wrap(async (req, res) => {
  if (!(await patientReadableByCaller(req.params.patientId, req.user!))) {
    return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Patients may only access their own notifications.' });
  }
  res.json(await db.notifications.byPatient(req.params.patientId));
}));

apiRouter.get('/audit/logs', requireAuth('ADMIN', 'SYSTEM_ADMIN'), wrap(async (_req, res) => {
  res.json(await db.auditLogs.list());
}));

apiRouter.get('/system/health', requireAuth('ADMIN', 'SYSTEM_ADMIN'), wrap(async (_req, res) => {
  res.json(await db.systemHealth.list());
}));

apiRouter.get('/integrations/events', requireAuth('ADMIN', 'SYSTEM_ADMIN'), wrap(async (_req, res) => {
  res.json(await db.integrationEvents.list());
}));

// 14. DEMO CONTROL CENTER (SEC-010: SYSTEM_ADMIN-only, and fully disabled in
//     production unless explicitly re-enabled via ENABLE_DEMO_RESET=true).
//     Rationale: this route TRUNCATEs every clinical table — exposing it to
//     lower-privileged roles was a one-request hospital-wide data wipe.
apiRouter.post('/demo/reset', requireAuth('SYSTEM_ADMIN'), wrap(async (_req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_RESET !== 'true') {
    return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Demo reset is disabled in production.' });
  }
  await seedDatabase(true);
  res.json({ success: true, message: 'MediKiosk demo environment reset to pristine initial state.' });
}));

// Full-database snapshot (all patients' PHI) — admin-only surface.
apiRouter.get('/demo/state', requireAuth('ADMIN', 'SYSTEM_ADMIN'), wrap(async (_req, res) => {
  const state = await db.snapshot();
  // Never expose credential hashes, even to admins (not needed here).
  res.json({ ...state, users: state.users.map(({ passwordHash: _ph, ...u }) => u) });
}));

// Centralized error handler — no stack traces leak to clients.
apiRouter.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API] Unhandled error:', err);
  res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal server error.' });
});
