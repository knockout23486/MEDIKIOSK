import express, { type Request, type Response, type NextFunction } from 'express';
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

export const apiRouter = express.Router();

// Every handler is async — wrap them so a rejected promise (SQL failure etc.)
// becomes a controlled 500 instead of an unhandled rejection.
const wrap = (fn: (req: Request, res: Response) => Promise<unknown>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
};

// 1. REAL-TIME SERVER-SENT EVENTS (SSE)
apiRouter.get('/events', (req, res) => {
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

// 2. AUTHENTICATION & USERS
apiRouter.post('/auth/login', wrap(async (req, res) => {
  const { username, password, role } = req.body;
  const user = await db.users.findByLogin(username, role);
  if (user) {
    // NOTE (SEC-002, out of scope here): password is not yet verified — demo
    // parity is retained. Audit trail now persists to PostgreSQL.
    await db.addAuditLog({
      correlationId: 'AUTH-LOGIN',
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_LOGIN_SUCCESS',
      resourceType: 'USER',
      resourceId: user.id,
      details: { username: user.username, role: user.role },
      ipAddress: req.ip || '127.0.0.1'
    });
    return res.json({ success: true, user });
  }
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
}));

apiRouter.get('/users', wrap(async (_req, res) => {
  res.json(await db.users.list());
}));

// 3. PATIENTS & ABHA
apiRouter.get('/patients', wrap(async (_req, res) => {
  res.json(await db.patients.list());
}));

apiRouter.get('/patients/:id', wrap(async (req, res) => {
  const patient = await db.patients.get(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
}));

apiRouter.post('/patients', wrap(async (req, res) => {
  if (!req.body || typeof req.body.name !== 'string' || req.body.name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Patient name is required' });
  }
  // Single SQL transaction: patient row + sequence-allocated MK-PAT id +
  // DPDP audit entry. Safe under concurrent kiosk registrations.
  const newPatient = await db.patients.register(req.body, { ipAddress: req.ip });
  res.json(newPatient);
}));

apiRouter.post('/abha/verify', wrap(async (req, res) => {
  const { abhaNumber, otp } = req.body;
  const result = await AbdmAdapter.verifyAbha(abhaNumber, otp);
  res.json(result);
}));

// 4. CONSENTS
apiRouter.get('/consents/:patientId', wrap(async (req, res) => {
  const consent = await db.consents.get(req.params.patientId);
  res.json(consent || null);
}));

apiRouter.post('/consents', wrap(async (req, res) => {
  // Atomic upsert on patient_id + audit entry in one transaction.
  const newConsent = await db.consents.grant(req.body, { ipAddress: req.ip });
  res.json(newConsent);
}));

// 5. HOSPITALS, DEPARTMENTS & PRACTITIONERS
apiRouter.get('/hospitals', wrap(async (_req, res) => {
  res.json(await db.reference.hospitals());
}));

apiRouter.get('/departments', wrap(async (req, res) => {
  const { hospitalId } = req.query;
  res.json(await db.reference.departments(typeof hospitalId === 'string' ? hospitalId : undefined));
}));

apiRouter.get('/doctors', wrap(async (req, res) => {
  const { departmentId, hospitalId } = req.query;
  res.json(
    await db.reference.practitioners({
      departmentId: typeof departmentId === 'string' ? departmentId : undefined,
      hospitalId: typeof hospitalId === 'string' ? hospitalId : undefined
    })
  );
}));

// 6. APPOINTMENTS & QUEUE
apiRouter.get('/appointments', wrap(async (_req, res) => {
  res.json(await db.appointments.list());
}));

apiRouter.post('/appointments', wrap(async (req, res) => {
  // Atomic: appointment + queue token + SMS notification + audit log.
  const { appointment, token } = await db.appointments.book(req.body, { ipAddress: req.ip });
  res.json({ appointment, token });
}));

apiRouter.get('/queue/tokens', wrap(async (_req, res) => {
  res.json(await db.queue.tokens());
}));

apiRouter.post('/queue/checkin', wrap(async (req, res) => {
  const { tokenNumber, patientId } = req.body;
  const token = await db.queue.checkIn(tokenNumber, patientId);
  if (!token) return res.status(404).json({ message: 'Token not found' });
  res.json({ success: true, token });
}));

apiRouter.post('/queue/advance', wrap(async (req, res) => {
  const { practitionerId } = req.body;
  const nextToken = await QueueEngine.advanceQueue(practitionerId || 'PRAC-01');
  res.json({ success: true, activeToken: nextToken });
}));

// 7. CLINICAL INTAKE & ADAPTIVE HISTORY
apiRouter.post('/clinical/questions', (req, res) => {
  const { chiefComplaint, isAyush } = req.body;
  const questions = ClinicalAIService.getInitialQuestions(chiefComplaint || '', !!isAyush);
  res.json(questions);
});

apiRouter.post('/clinical/session', wrap(async (req, res) => {
  const session = await db.clinical.createSession(req.body);
  res.json(session);
}));

apiRouter.post('/clinical/answer', wrap(async (req, res) => {
  const { sessionId, questionId, questionText, answerText, inputMode, voiceTranscript, patientId } = req.body;
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

apiRouter.post('/clinical/ayush', wrap(async (req, res) => {
  const { sessionId, answers } = req.body;
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

// 8. DOCUMENTS & OCR PIPELINE
apiRouter.get('/documents/:patientId', wrap(async (req, res) => {
  res.json(await db.documents.listByPatient(req.params.patientId));
}));

apiRouter.post('/documents/process-demo', wrap(async (req, res) => {
  const { documentId, patientId, fileName, rawText } = req.body;

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

apiRouter.get('/entities/:patientId', wrap(async (req, res) => {
  res.json(await db.documents.entitiesByPatient(req.params.patientId));
}));

apiRouter.post('/entities/:id/verify', wrap(async (req, res) => {
  const entity = await db.documents.verifyEntity(req.params.id, {
    name: req.body.name,
    value: req.body.value
  });
  if (!entity) return res.status(404).json({ message: 'Entity not found' });
  res.json({ success: true, entity });
}));

// 9. TIMELINE & ABDM
apiRouter.get('/timeline/:patientId', wrap(async (req, res) => {
  res.json(await db.timeline.byPatient(req.params.patientId));
}));

apiRouter.get('/abdm/records/:patientId', wrap(async (req, res) => {
  res.json(await db.abdm.recordsByPatient(req.params.patientId));
}));

apiRouter.get('/abdm/fhir/:patientId', wrap(async (req, res) => {
  const bundle = await AbdmAdapter.generateFhirPatientBundle(req.params.patientId);
  res.json(bundle);
}));

// 10. AI STRUCTURED SUMMARY
apiRouter.get('/ai-summary/:sessionId', wrap(async (req, res) => {
  const summary = await db.summaries.bySession(req.params.sessionId);
  res.json(summary || null);
}));

apiRouter.post('/ai-summary/generate', wrap(async (req, res) => {
  const { sessionId, patientId } = req.body;
  const summary = await SummaryEngine.generateSummary(sessionId, patientId);
  res.json(summary);
}));

apiRouter.post('/ai-summary/:id/verify', wrap(async (req, res) => {
  const summary = await db.summaries.verify(req.params.id, {
    doctorId: req.body.doctorId,
    doctorNotes: req.body.doctorNotes,
    chiefComplaint: req.body.chiefComplaint,
    historyOfPresentIllness: req.body.historyOfPresentIllness
  });
  if (!summary) return res.status(404).json({ message: 'Summary not found' });
  res.json({ success: true, summary });
}));

// 11. TRIAGE ALERTS
apiRouter.get('/triage/alerts', wrap(async (_req, res) => {
  res.json(await db.alerts.list());
}));

apiRouter.post('/triage/acknowledge/:id', wrap(async (req, res) => {
  const alert = await db.alerts.acknowledge(req.params.id, {
    acknowledgedBy: req.body.acknowledgedBy,
    actionTaken: req.body.actionTaken
  });
  if (!alert) return res.status(404).json({ message: 'Alert not found' });
  res.json({ success: true, alert });
}));

// 12. CONSULTATION & PRESCRIPTION
apiRouter.get('/consultations/:patientId', wrap(async (req, res) => {
  res.json(await db.consultations.byPatient(req.params.patientId));
}));

apiRouter.post('/consultations', wrap(async (req, res) => {
  const consultation = await db.consultations.create(req.body);
  res.json(consultation);
}));

apiRouter.post('/consultations/:id/finalize', wrap(async (req, res) => {
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

// 13. NOTIFICATIONS, AUDIT & SYSTEM HEALTH
apiRouter.get('/notifications/:patientId', wrap(async (req, res) => {
  res.json(await db.notifications.byPatient(req.params.patientId));
}));

apiRouter.get('/audit/logs', wrap(async (_req, res) => {
  res.json(await db.auditLogs.list());
}));

apiRouter.get('/system/health', wrap(async (_req, res) => {
  res.json(await db.systemHealth.list());
}));

apiRouter.get('/integrations/events', wrap(async (_req, res) => {
  res.json(await db.integrationEvents.list());
}));

// 14. DEMO CONTROL CENTER
apiRouter.post('/demo/reset', wrap(async (_req, res) => {
  await seedDatabase(true);
  res.json({ success: true, message: 'MediKiosk demo environment reset to pristine initial state.' });
}));

apiRouter.get('/demo/state', wrap(async (_req, res) => {
  res.json(await db.snapshot());
}));
