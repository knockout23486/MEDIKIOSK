import express from 'express';
import { db } from '../db/store.js';
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
apiRouter.post('/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  const state = db.getState();
  const user = state.users.find(u => (u.username === username || u.role === role));
  if (user) {
    db.addAuditLog({
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
});

apiRouter.get('/users', (req, res) => {
  res.json(db.getState().users);
});

// 3. PATIENTS & ABHA
apiRouter.get('/patients', (req, res) => {
  res.json(db.getState().patients);
});

apiRouter.get('/patients/:id', (req, res) => {
  const patient = db.getState().patients.find(p => p.id === req.params.id || p.mkPatientId === req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
});

apiRouter.post('/patients', (req, res) => {
  const state = db.getState();
  const count = state.patients.length + 125;
  const newPatient = {
    id: 'PAT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    mkPatientId: `MK-PAT-2026-${String(count).padStart(6, '0')}`,
    registeredAt: new Date().toISOString(),
    isDemo: true,
    ...req.body
  };
  state.patients.push(newPatient);
  db.save();

  db.addAuditLog({
    correlationId: 'PAT-REG',
    actorId: newPatient.id,
    actorRole: 'PATIENT',
    action: 'PATIENT_REGISTERED',
    resourceType: 'PATIENT',
    resourceId: newPatient.id,
    details: { mkPatientId: newPatient.mkPatientId, name: newPatient.name },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json(newPatient);
});

apiRouter.post('/abha/verify', async (req, res) => {
  const { abhaNumber, otp } = req.body;
  const result = await AbdmAdapter.verifyAbha(abhaNumber, otp);
  res.json(result);
});

// 4. CONSENTS
apiRouter.get('/consents/:patientId', (req, res) => {
  const consent = db.getState().consents.find(c => c.patientId === req.params.patientId);
  res.json(consent || null);
});

apiRouter.post('/consents', (req, res) => {
  const state = db.getState();
  const newConsent = {
    id: 'CNS-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    version: 'v2.4-DPDP-2026',
    status: 'ACTIVE' as const,
    grantedAt: new Date().toISOString(),
    ipAddress: req.ip || '192.168.1.104 (Kiosk)',
    signatureType: 'ELECTRONIC_DEMO' as const,
    ...req.body
  };

  const existingIdx = state.consents.findIndex(c => c.patientId === newConsent.patientId);
  if (existingIdx >= 0) {
    state.consents[existingIdx] = newConsent;
  } else {
    state.consents.push(newConsent);
  }
  db.save();

  db.addAuditLog({
    correlationId: 'CONSENT-GRANT',
    actorId: newConsent.patientId,
    actorRole: 'PATIENT',
    action: 'DPDP_CONSENT_GRANTED',
    resourceType: 'CONSENT',
    resourceId: newConsent.id,
    details: newConsent.purposes,
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json(newConsent);
});

// 5. HOSPITALS, DEPARTMENTS & PRACTITIONERS
apiRouter.get('/hospitals', (req, res) => {
  res.json(db.getState().hospitals);
});

apiRouter.get('/departments', (req, res) => {
  const { hospitalId } = req.query;
  const deps = db.getState().departments.filter(d => !hospitalId || d.hospitalId === hospitalId);
  res.json(deps);
});

apiRouter.get('/doctors', (req, res) => {
  const { departmentId, hospitalId } = req.query;
  const docs = db.getState().practitioners.filter(d => 
    (!departmentId || d.departmentId === departmentId) &&
    (!hospitalId || d.hospitalId === hospitalId)
  );
  res.json(docs);
});

// 6. APPOINTMENTS & QUEUE
apiRouter.get('/appointments', (req, res) => {
  res.json(db.getState().appointments);
});

apiRouter.post('/appointments', (req, res) => {
  const state = db.getState();
  const count = state.appointments.length + 27;
  const apt = {
    id: 'APT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    appointmentNumber: `APT-2026-0828-${String(count).padStart(3, '0')}`,
    bookedAt: new Date().toISOString(),
    status: 'BOOKED' as const,
    ...req.body
  };
  state.appointments.push(apt);

  // Auto-generate Token
  const token = QueueEngine.generateToken(apt.patientId, apt.id, apt.practitionerId);

  db.addAuditLog({
    correlationId: 'APT-BOOK',
    actorId: apt.patientId,
    actorRole: 'PATIENT',
    action: 'APPOINTMENT_BOOKED',
    resourceType: 'APPOINTMENT',
    resourceId: apt.id,
    details: { appointmentNumber: apt.appointmentNumber, tokenNumber: token.tokenNumber },
    ipAddress: req.ip || '127.0.0.1'
  });

  // Add confirmation notification
  db.addNotification({
    patientId: apt.patientId,
    channel: 'SMS',
    title: 'Appointment Confirmed',
    message: `Your appointment is confirmed. Token: ${token.tokenNumber}. Approx wait: ${token.estimatedWaitMins} mins.`,
    status: 'DELIVERED'
  });

  res.json({ appointment: apt, token });
});

apiRouter.get('/queue/tokens', (req, res) => {
  res.json(db.getState().queueTokens);
});

apiRouter.post('/queue/checkin', (req, res) => {
  const { tokenNumber, patientId } = req.body;
  const state = db.getState();
  const token = state.queueTokens.find(t => t.tokenNumber === tokenNumber || t.patientId === patientId);
  if (!token) return res.status(404).json({ message: 'Token not found' });

  token.status = 'WAITING';
  token.checkInTime = new Date().toISOString();
  db.save();

  db.broadcast('QUEUE_CHECKIN', token);
  res.json({ success: true, token });
});

apiRouter.post('/queue/advance', (req, res) => {
  const { practitionerId } = req.body;
  const nextToken = QueueEngine.advanceQueue(practitionerId || 'PRAC-01');
  res.json({ success: true, activeToken: nextToken });
});

// 7. CLINICAL INTAKE & ADAPTIVE HISTORY
apiRouter.post('/clinical/questions', (req, res) => {
  const { chiefComplaint, isAyush } = req.body;
  const questions = ClinicalAIService.getInitialQuestions(chiefComplaint || '', !!isAyush);
  res.json(questions);
});

apiRouter.post('/clinical/session', (req, res) => {
  const state = db.getState();
  const session = {
    id: 'SES-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    startedAt: new Date().toISOString(),
    status: 'IN_PROGRESS' as const,
    redFlagTriggered: false,
    ...req.body
  };
  state.clinicalSessions.push(session);
  db.save();
  res.json(session);
});

apiRouter.post('/clinical/answer', (req, res) => {
  const { sessionId, questionId, questionText, answerText, inputMode, voiceTranscript, patientId } = req.body;
  const state = db.getState();
  const patient = state.patients.find(p => p.id === patientId);

  const answer = {
    id: 'ANS-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
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

  // Evaluate Emergency Red-Flags in real-time
  const redFlag = RedFlagEngine.evaluateInput(
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

  state.clinicalAnswers.push(answer);
  db.save();

  res.json({ answer, redFlagAlert: redFlag });
});

apiRouter.post('/clinical/ayush', (req, res) => {
  const { sessionId, answers } = req.body;
  const state = db.getState();
  const prakritiCalc = ClinicalAIService.calculatePrakriti(answers || {});

  const assessment = {
    id: 'AYUSH-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
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

  state.ayushAssessments.push(assessment);
  db.save();

  res.json(assessment);
});

// 8. DOCUMENTS & OCR PIPELINE
apiRouter.get('/documents/:patientId', (req, res) => {
  const docs = db.getState().documents.filter(d => d.patientId === req.params.patientId);
  res.json(docs);
});

apiRouter.post('/documents/process-demo', async (req, res) => {
  const { documentId, patientId, fileName, rawText } = req.body;
  const state = db.getState();

  const pipelineResult = await OcrEngine.processDocument(documentId, patientId, fileName, rawText);

  state.documentOcrResults.push(pipelineResult.ocrResult);
  for (const ent of pipelineResult.entities) {
    state.medicalEntities.push(ent);
  }
  db.save();

  db.addAuditLog({
    correlationId: 'OCR-PROC',
    actorId: 'AI_OCR_ENGINE',
    actorRole: 'SYSTEM_ADMIN',
    action: 'DOCUMENT_OCR_PROCESSED',
    resourceType: 'DOCUMENT',
    resourceId: documentId,
    details: { entitiesCount: pipelineResult.entities.length, confidence: pipelineResult.ocrResult.confidence },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json(pipelineResult);
});

apiRouter.get('/entities/:patientId', (req, res) => {
  const entities = db.getState().medicalEntities.filter(e => e.patientId === req.params.patientId);
  res.json(entities);
});

apiRouter.post('/entities/:id/verify', (req, res) => {
  const state = db.getState();
  const entity = state.medicalEntities.find(e => e.id === req.params.id);
  if (!entity) return res.status(404).json({ message: 'Entity not found' });

  entity.isVerified = true;
  if (req.body.name) entity.name = req.body.name;
  if (req.body.value) entity.value = req.body.value;
  db.save();

  res.json({ success: true, entity });
});

// 9. TIMELINE & ABDM
apiRouter.get('/timeline/:patientId', (req, res) => {
  const events = db.getState().timelineEvents.filter(t => t.patientId === req.params.patientId);
  res.json(events);
});

apiRouter.get('/abdm/records/:patientId', (req, res) => {
  const records = db.getState().abdmRecords.filter(r => r.patientId === req.params.patientId);
  res.json(records);
});

apiRouter.get('/abdm/fhir/:patientId', (req, res) => {
  const bundle = AbdmAdapter.generateFhirPatientBundle(req.params.patientId);
  res.json(bundle);
});

// 10. AI STRUCTURED SUMMARY
apiRouter.get('/ai-summary/:sessionId', (req, res) => {
  const summary = db.getState().aiSummaries.find(s => s.sessionId === req.params.sessionId);
  res.json(summary || null);
});

apiRouter.post('/ai-summary/generate', (req, res) => {
  const { sessionId, patientId } = req.body;
  const summary = SummaryEngine.generateSummary(sessionId, patientId);
  res.json(summary);
});

apiRouter.post('/ai-summary/:id/verify', (req, res) => {
  const state = db.getState();
  const summary = state.aiSummaries.find(s => s.id === req.params.id);
  if (!summary) return res.status(404).json({ message: 'Summary not found' });

  summary.status = 'PHYSICIAN_VERIFIED';
  summary.version = (summary.version || 1) + 1;
  summary.physicianVerifiedAt = new Date().toISOString();
  summary.verifiedByDoctorId = req.body.doctorId || 'USR-DOC-01';
  summary.doctorNotes = req.body.doctorNotes || 'Physician review complete. History confirmed with patient.';

  if (req.body.chiefComplaint) summary.chiefComplaint = req.body.chiefComplaint;
  if (req.body.historyOfPresentIllness) summary.historyOfPresentIllness = req.body.historyOfPresentIllness;

  db.save();

  db.addAuditLog({
    correlationId: 'SUM-VERIFY',
    actorId: summary.verifiedByDoctorId || 'USR-DOC-01',
    actorRole: 'DOCTOR',
    action: 'PHYSICIAN_VERIFIED_AI_SUMMARY',
    resourceType: 'AI_SUMMARY',
    resourceId: summary.id,
    details: { version: summary.version, notes: summary.doctorNotes },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, summary });
});

// 11. TRIAGE ALERTS
apiRouter.get('/triage/alerts', (req, res) => {
  res.json(db.getState().redFlagAlerts);
});

apiRouter.post('/triage/acknowledge/:id', (req, res) => {
  const state = db.getState();
  const alert = state.redFlagAlerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ message: 'Alert not found' });

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = req.body.acknowledgedBy || 'Sister Suniti Rao (Triage Nurse)';
  alert.acknowledgedAt = new Date().toISOString();
  alert.clinicalActionTaken = req.body.actionTaken || 'Patient prioritized in queue. Vitals checked.';
  db.save();

  db.broadcast('TRIAGE_ACKNOWLEDGED', alert);
  res.json({ success: true, alert });
});

// 12. CONSULTATION & PRESCRIPTION
apiRouter.get('/consultations/:patientId', (req, res) => {
  const state = db.getState();
  const consultations = state.consultations.filter(c => c.patientId === req.params.patientId);
  res.json(consultations);
});

apiRouter.post('/consultations', (req, res) => {
  const state = db.getState();
  const consultation = {
    id: 'CON-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    startedAt: new Date().toISOString(),
    status: 'IN_PROGRESS' as const,
    ...req.body
  };
  state.consultations.push(consultation);
  db.save();
  res.json(consultation);
});

apiRouter.post('/consultations/:id/finalize', async (req, res) => {
  const state = db.getState();
  const consultation = state.consultations.find(c => c.id === req.params.id) || {
    id: req.params.id,
    appointmentId: req.body.appointmentId,
    patientId: req.body.patientId,
    practitionerId: req.body.practitionerId || 'PRAC-01',
    aiSummaryId: req.body.aiSummaryId || 'SUM-HERO-01',
    clinicalExamination: req.body.clinicalExamination || { generalAppearance: 'Conscious, oriented', vitals: { bp: '124/82 mmHg', pulse: '76 bpm', temp: '98.4 F', spo2: '99%', respRate: '16/min' }, systemicExam: 'Knee joints: Crepitus on flexion, no warm effusion' },
    assessment: req.body.assessment || 'Janu Sandhivata (Bilateral Knee Osteoarthritis) with Mandagni',
    finalDiagnosis: req.body.finalDiagnosis || [{ code: 'M17.0', name: 'Primary Bilateral Osteoarthritis of Knee', system: 'ICD11' }, { code: 'NAMASTE-AYU-042', name: 'Janu Sandhivata', system: 'NAMASTE_AYUSH' }],
    ayushChikitsaSutra: 'Vatahara, Shoolahara, Agni-Deepana & Rasayana Chikitsa',
    followUpDate: req.body.followUpDate || '2026-09-28',
    dietLifestyleAdvice: req.body.dietLifestyleAdvice || ['Avoid cold and dry items', 'Daily mild warm oil massage (Mahanarayana Taila)', 'Avoid squatting on floor'],
    status: 'FINALIZED' as const,
    startedAt: new Date().toISOString(),
    finalizedAt: new Date().toISOString()
  };

  if (!state.consultations.find(c => c.id === consultation.id)) {
    state.consultations.push(consultation);
  } else {
    consultation.status = 'FINALIZED';
    consultation.finalizedAt = new Date().toISOString();
  }

  // Save prescriptions
  if (req.body.prescriptions && Array.isArray(req.body.prescriptions)) {
    for (const rx of req.body.prescriptions) {
      state.prescriptions.push({
        id: 'RX-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        consultationId: consultation.id,
        ...rx
      });
    }
  }

  // Sync to HIS EMR Gateway
  await HisAdapter.syncPreIntakeEncounter({
    encounterId: consultation.id,
    patientId: consultation.patientId,
    practitionerId: consultation.practitionerId,
    departmentId: 'DEP-01',
    chiefComplaint: consultation.assessment,
    aiSummaryId: consultation.aiSummaryId,
    intakeTimestamp: new Date().toISOString()
  });

  db.save();

  db.addAuditLog({
    correlationId: 'CON-FINAL',
    actorId: consultation.practitionerId,
    actorRole: 'DOCTOR',
    action: 'CONSULTATION_FINALIZED',
    resourceType: 'CONSULTATION',
    resourceId: consultation.id,
    details: { diagnosis: consultation.finalDiagnosis, prescriptionsCount: req.body.prescriptions?.length || 0 },
    ipAddress: req.ip || '127.0.0.1'
  });

  res.json({ success: true, consultation });
});

// 13. NOTIFICATIONS, AUDIT & SYSTEM HEALTH
apiRouter.get('/notifications/:patientId', (req, res) => {
  const notifs = db.getState().notifications.filter(n => n.patientId === req.params.patientId);
  res.json(notifs);
});

apiRouter.get('/audit/logs', (req, res) => {
  res.json(db.getState().auditLogs);
});

apiRouter.get('/system/health', (req, res) => {
  res.json(db.getState().systemHealth);
});

apiRouter.get('/integrations/events', (req, res) => {
  res.json(db.getState().integrationEvents);
});

// 14. DEMO CONTROL CENTER
apiRouter.post('/demo/reset', (req, res) => {
  seedDatabase(true);
  res.json({ success: true, message: 'MediKiosk demo environment reset to pristine initial state.' });
});

apiRouter.get('/demo/state', (req, res) => {
  res.json(db.getState());
});
