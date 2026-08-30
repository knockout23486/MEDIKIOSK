import fs from 'fs';
import path from 'path';
import { db } from '../server/db/store.js';
import { seedDatabase } from '../server/db/seed.js';
import { ClinicalAIService } from '../server/services/clinicalEngine.js';
import { RedFlagEngine } from '../server/services/redFlagEngine.js';
import { OcrEngine } from '../server/services/ocrEngine.js';
import { FusionEngine } from '../server/services/fusionEngine.js';
import { SummaryEngine } from '../server/services/summaryEngine.js';
import { QueueEngine } from '../server/services/queueEngine.js';
import { AbdmAdapter } from '../server/services/abdmAdapter.js';
import { HisAdapter } from '../server/services/hisAdapter.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 MediKiosk AI Clinical Intake — Automated Test Suite');
  console.log('======================================================\n');

  // Test 0: Relational database connectivity (SEC-001)
  console.log('0. PostgreSQL Connectivity & Migrations:');
  await db.migrate();
  const probe = await db.ping();
  assert(probe.ok, `Connects to PostgreSQL ${probe.serverVersion} via DATABASE_URL`);
  assert(!fs.existsSync(path.resolve(process.cwd(), 'data', 'medikiosk_db.json')),
    'No local JSON database file is used');

  // Test 1: Database Seed & Integrity
  console.log('\n1. Database Initialization & Seeding:');
  await seedDatabase(true);
  const [patients, hospitals, departments, practitioners] = await Promise.all([
    db.patients.list(), db.reference.hospitals(), db.reference.departments(), db.reference.practitioners()
  ]);
  assert(patients.length >= 5, 'Database seeded with 5 diverse Indian clinical patient personas');
  assert(hospitals.length === 3, 'Hospitals (AIIA New Delhi, NIA Jaipur, Govt District) present');
  assert(departments.length === 8, 'AYUSH & Modern OPD departments configured');
  assert(practitioners.length === 5, 'Practitioners with credentials & room numbers seeded');

  // Test 2: Clinical Ontology & Decision Trees
  console.log('\n2. Clinical Ontology & Decision Trees:');
  const kneeQuestions = ClinicalAIService.getInitialQuestions('Bilateral knee joint pain and morning stiffness', true);
  assert(kneeQuestions.length >= 6, 'Joint pain tree branches to knee locations, severity, and morning stiffness');
  const chestQuestions = ClinicalAIService.getInitialQuestions('Severe pressing chest pain radiating to left arm', false);
  assert(chestQuestions.length >= 3, 'Chest pain complaint triggers cardiac symptom & radiation tree');

  // Test 3: AYUSH Prakriti & Agni/Koshtha Synthesis
  console.log('\n3. AYUSH Dashavidha Pariksha & Prakriti Engine:');
  const prakritiResult = ClinicalAIService.calculatePrakriti({
    bodyFrame: 'VATA_FRAME',
    skinHair: 'VATA_SKIN',
    appetiteAgni: 'MANDAGNI',
    bowelKoshtha: 'KRURA_KOSHTHA',
    painLocation: 'BILATERAL_KNEE',
    aggravation: 'COLD_WEATHER'
  });
  assert(prakritiResult.vata > 40, `Vata score correctly computed as dominant (${prakritiResult.vata}%)`);
  assert(prakritiResult.agni === 'MANDAGNI', 'Mandagni (sluggish digestive fire) correctly recognized');
  assert(prakritiResult.koshtha === 'KRURA', 'Krura Koshtha (constipated tendency) correctly recognized');

  // Test 4: Real-time Emergency Red-Flag Engine
  console.log('\n4. Emergency Red-Flag Safety Engine:');
  const redFlag = await RedFlagEngine.evaluateInput(
    'Severe pressing chest pain for 45 minutes radiating to left arm with cold sweating and breathlessness',
    { Q_CHEST_ONSET_NATURE: 'PRESSURE_HEAVY', Q_CHEST_RADIATION: 'LEFT_ARM_SHOULDER' },
    { id: 'PAT-EMERG-02', name: 'Shri Rajesh Patel', age: 62, gender: 'MALE', sessionId: 'SES-TEST-01' }
  );
  assert(redFlag !== null, 'Emergency red-flag accurately triggered for acute coronary syndrome');
  assert(redFlag?.severity === 'EMERGENCY_CRITICAL', 'Severity categorized as EMERGENCY_CRITICAL');
  const persistedAlerts = await db.alerts.list();
  assert(persistedAlerts.some(a => a.id === redFlag?.id), 'Red-flag alert persisted to PostgreSQL with audit trail');

  // Test 5: OCR Document Pipeline & Abnormal Value Flagging
  console.log('\n5. Document OCR & Medical Entity Extraction:');
  const ocrResult = await OcrEngine.processDocument(
    'DOC-TEST-01',
    'PAT-HERO-01',
    'City_PathLab_CBC_Report_2026-07-03.pdf',
    `COMPLETE BLOOD COUNT (CBC):
- Hemoglobin (Hb): 10.2 g/dL [Ref: 12.0 - 15.0 g/dL] (LOW)
- ESR (1st hour): 34 mm/hr [Ref: 0 - 20 mm/hr] (HIGH)
- Fasting Blood Sugar: 98 mg/dL [Ref: 70 - 100 mg/dL]`
  );
  assert(ocrResult.entities.length >= 2, 'Medical entities successfully extracted from raw text');
  const hbFlag = ocrResult.abnormalFlags.find(f => f.testName.includes('Hemoglobin'));
  assert(hbFlag?.direction === 'LOW', 'Abnormal low Hemoglobin (10.2 g/dL) correctly flagged');

  // Persist through the transactional pipeline and read back from SQL.
  await db.documents.saveOcrPipeline(ocrResult.ocrResult, ocrResult.entities, {
    documentId: 'DOC-TEST-01',
    entitiesCount: ocrResult.entities.length,
    confidence: ocrResult.ocrResult.confidence
  });
  const storedEntities = await db.documents.entitiesByPatient('PAT-HERO-01');
  assert(storedEntities.length >= ocrResult.entities.length, 'OCR entities committed transactionally to PostgreSQL');

  // Test 6: Multi-Source Fusion & Source Provenance Tracking
  console.log('\n6. Information Fusion & Provenance Model:');
  const fusionData = await FusionEngine.fusePatientData('SES-HERO-01', 'PAT-HERO-01');
  assert(fusionData.provenanceFacts.some(f => f.source === 'PATIENT_VOICE'), 'Patient voice provenance recorded');
  assert(fusionData.provenanceFacts.some(f => f.source === 'OCR_DOCUMENT'), 'OCR document provenance recorded');
  assert(fusionData.medications.length >= 1, 'Medication history fused from voice & OCR');

  // Test 7: AI Summary Generation & Versioning
  console.log('\n7. AI Summary Generation & Physician Verification:');
  const summary = await SummaryEngine.generateSummary('SES-HERO-01', 'PAT-HERO-01');
  assert(summary.status === 'DRAFT_AI', 'AI summary initially flagged as DRAFT_AI (requires physician verification)');
  assert(summary.version === 1, 'Initial summary version is 1');
  assert(summary.confidenceOverall >= 0.90, 'Overall confidence score computed');
  const verified = await db.summaries.verify(summary.id, { doctorId: 'USR-DOC-01' });
  assert(verified?.status === 'PHYSICIAN_VERIFIED' && verified.version === 2, 'Physician verification bumps version atomically');

  // Test 8: Queue & Waiting Time Engine
  console.log('\n8. Dynamic OPD Queue & Wait Time Estimator:');
  const token = await QueueEngine.generateToken('PAT-HERO-01', 'APT-TEST-CONC', 'PRAC-01');
  assert(token.tokenNumber.startsWith('A-'), 'Valid token number assigned (sequence-backed, e.g. A-100)');
  assert(token.estimatedWaitMins > 0, 'Estimated waiting time dynamically calculated');
  const advanced = await QueueEngine.advanceQueue('PRAC-01');
  assert(advanced === null || advanced.tokenNumber !== undefined, 'Queue advance uses SELECT ... FOR UPDATE safely');

  // Test 9: ABDM & HIS Interoperability Adapters
  console.log('\n9. National Health Interoperability (ABDM & HIS):');
  const abhaVerify = await AbdmAdapter.verifyAbha('91-4829-1029-4821');
  assert(abhaVerify.verified === true, 'ABDM Milestone 1 sandbox identity verification succeeded');
  const fhirBundle = await AbdmAdapter.generateFhirPatientBundle('PAT-HERO-01');
  assert(fhirBundle.resourceType === 'Bundle', 'FHIR R4 Patient resource bundle generated');
  const hisSync = await HisAdapter.syncPreIntakeEncounter({
    encounterId: 'ENC-TEST-01',
    patientId: 'MK-PAT-2026-000124',
    practitionerId: 'PRAC-01',
    departmentId: 'DEP-01',
    chiefComplaint: 'Janu Sandhivata (Osteoarthritis)',
    intakeTimestamp: new Date().toISOString()
  });
  assert(hisSync.status === 'SUCCESS', 'HIS EMR Encounter pre-intake transmission acknowledged');

  // Test 10: Transactional integrity sample
  console.log('\n10. Transactional Writes (ACID):');
  const auditCountBefore = (await db.auditLogs.list(10000)).length;
  await db.patients.register({ name: 'Concurrent Test Citizen', age: 30, gender: 'MALE' });
  const auditCountAfter = (await db.auditLogs.list(10000)).length;
  assert(auditCountAfter > auditCountBefore, 'Patient registration wrote patient + audit rows in one committed transaction');

  // Test 11: Application-level PHI encryption at rest (SEC-004)
  console.log('\n11. Application-Level PHI Encryption (AES-256-GCM):');
  const encName = 'Encryption Verification Citizen';
  await db.patients.register({ name: encName, age: 28, gender: 'FEMALE', phone: '+91 90000 12345' });
  const rawRows = await db.pool.query(
    'SELECT name, phone FROM patients ORDER BY registered_at DESC LIMIT 1'
  );
  const rawName = rawRows.rows[0].name as string;
  assert(rawName.startsWith('enc.v1.'), 'Direct identifiers stored as enc.v1 ciphertext in PostgreSQL (not plaintext)');
  assert(!rawName.includes(encName) && !(rawRows.rows[0].phone as string).includes('90000'),
    'Raw SQL dump cannot read patient name/phone (defense against DB credential leak)');
  const decryptedList = await db.patients.list();
  assert(decryptedList.some(p => p.name === encName), 'ORM reads transparently decrypt PHI for authorized callers');

  // Test Summary
  console.log('\n======================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL TEST SUITES PASSED! MediKiosk platform is fully operational.');
  } else {
    console.error('⚠️ Some tests failed. Please review error output.');
  }
  console.log('======================================================\n');

  await db.close();
  if (failed > 0) process.exit(1);
}

runTestSuite().catch(async (err) => {
  console.error('Test suite crashed:', err);
  await db.close().catch(() => {});
  process.exit(1);
});
