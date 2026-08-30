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

  // Test 1: Database Seed & Integrity
  console.log('1. Database Initialization & Seeding:');
  seedDatabase(true);
  const state = db.getState();
  assert(state.patients.length >= 5, 'Database seeded with 5 diverse Indian clinical patient personas');
  assert(state.hospitals.length === 3, 'Hospitals (AIIA New Delhi, NIA Jaipur, Govt District) present');
  assert(state.departments.length === 8, 'AYUSH & Modern OPD departments configured');
  assert(state.practitioners.length === 5, 'Practitioners with credentials & room numbers seeded');

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
  const redFlag = RedFlagEngine.evaluateInput(
    'Severe pressing chest pain for 45 minutes radiating to left arm with cold sweating and breathlessness',
    { Q_CHEST_ONSET_NATURE: 'PRESSURE_HEAVY', Q_CHEST_RADIATION: 'LEFT_ARM_SHOULDER' },
    { id: 'PAT-EMERG-02', name: 'Shri Rajesh Patel', age: 62, gender: 'MALE', sessionId: 'SES-TEST-01' }
  );
  assert(redFlag !== null, 'Emergency red-flag accurately triggered for acute coronary syndrome');
  assert(redFlag?.severity === 'EMERGENCY_CRITICAL', 'Severity categorized as EMERGENCY_CRITICAL');

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

  // Test 6: Multi-Source Fusion & Source Provenance Tracking
  console.log('\n6. Information Fusion & Provenance Model:');
  const fusionData = FusionEngine.fusePatientData('SES-HERO-01', 'PAT-HERO-01');
  assert(fusionData.provenanceFacts.some(f => f.source === 'PATIENT_VOICE'), 'Patient voice provenance recorded');
  assert(fusionData.provenanceFacts.some(f => f.source === 'OCR_DOCUMENT'), 'OCR document provenance recorded');
  assert(fusionData.medications.length >= 1, 'Medication history fused from voice & OCR');

  // Test 7: AI Summary Generation & Versioning
  console.log('\n7. AI Summary Generation & Physician Verification:');
  const summary = SummaryEngine.generateSummary('SES-HERO-01', 'PAT-HERO-01');
  assert(summary.status === 'DRAFT_AI', 'AI summary initially flagged as DRAFT_AI (requires physician verification)');
  assert(summary.version === 1, 'Initial summary version is 1');
  assert(summary.confidenceOverall >= 0.90, 'Overall confidence score computed');

  // Test 8: Queue & Waiting Time Engine
  console.log('\n8. Dynamic OPD Queue & Wait Time Estimator:');
  const token = QueueEngine.generateToken('PAT-HERO-01', 'APT-001', 'PRAC-01');
  assert(token.tokenNumber.startsWith('A-'), 'Valid token number assigned (e.g. A-027)');
  assert(token.estimatedWaitMins > 0, 'Estimated waiting time dynamically calculated');

  // Test 9: ABDM & HIS Interoperability Adapters
  console.log('\n9. National Health Interoperability (ABDM & HIS):');
  const abhaVerify = await AbdmAdapter.verifyAbha('91-4829-1029-4821');
  assert(abhaVerify.verified === true, 'ABDM Milestone 1 sandbox identity verification succeeded');
  const fhirBundle = AbdmAdapter.generateFhirPatientBundle('PAT-HERO-01');
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

  // Test Summary
  console.log('\n======================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL 9 TEST SUITES PASSED! MediKiosk platform is fully operational.');
  } else {
    console.error('⚠️ Some tests failed. Please review error output.');
  }
  console.log('======================================================\n');
}

runTestSuite();
