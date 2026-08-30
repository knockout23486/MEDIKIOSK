import {
  MedicalDocument, DocumentOcrResult, MedicalEntity, TimelineEvent,
  AbdmRecord, AiSummary, RedFlagAlert, NotificationItem,
  IntegrationEvent, AuditLog, SystemHealthStatus
} from './schema.js';

export const seededDocuments: MedicalDocument[] = [
  {
    id: 'DOC-001',
    patientId: 'PAT-HERO-01',
    fileName: 'AIIA_Discharge_Summary_2025-11-12.pdf',
    fileType: 'DISCHARGE_SUMMARY',
    fileSize: 428000,
    fileUrl: '/demo_docs/AIIA_Discharge_Summary_2025-11-12.pdf',
    uploadedAt: '2026-08-28T08:18:00Z',
    isDemo: true,
    status: 'VERIFIED'
  },
  {
    id: 'DOC-002',
    patientId: 'PAT-HERO-01',
    fileName: 'City_PathLab_CBC_Report_2026-07-03.pdf',
    fileType: 'LAB_REPORT',
    fileSize: 215000,
    fileUrl: '/demo_docs/City_PathLab_CBC_Report_2026-07-03.pdf',
    uploadedAt: '2026-08-28T08:19:00Z',
    isDemo: true,
    status: 'VERIFIED'
  },
  {
    id: 'DOC-003',
    patientId: 'PAT-HERO-01',
    fileName: 'OPD_Prescription_Card_2026-06-15.pdf',
    fileType: 'PRESCRIPTION',
    fileSize: 185000,
    fileUrl: '/demo_docs/OPD_Prescription_Card_2026-06-15.pdf',
    uploadedAt: '2026-08-28T08:20:00Z',
    isDemo: true,
    status: 'VERIFIED'
  }
];

export const seededDocumentOcrResults: DocumentOcrResult[] = [
  {
    id: 'OCR-001',
    documentId: 'DOC-001',
    rawText: `ALL INDIA INSTITUTE OF AYURVEDA (AIIA)
Department of Kayachikitsa - Discharge Summary
Patient: Smt. Radha Sharma | Age: 57 F | IPD No: IP-2025-8841
Admission Date: 05-Nov-2025 | Discharge Date: 12-Nov-2025
Diagnosis: Essential Hypertension (Controlled), Mild Janu Sandhivata (Bilateral Knee Osteoarthritis)
Treatment Given: Janu Basti with Mahanarayana Taila, Yogaraj Guggulu 2 tab BD, Amlodipine 5mg OD.
Condition at Discharge: Stable. BP: 128/84 mmHg. Advice follow up after 6 months.`,
    confidence: 0.95,
    processingTimeMs: 1420,
    extractedAt: '2026-08-28T08:18:02Z'
  },
  {
    id: 'OCR-002',
    documentId: 'DOC-002',
    rawText: `DR. LAL & METROPOLIS CLINICAL PATHOLOGY LAB
Patient: Radha Sharma (58 F) | Date: 03-Jul-2026 | Ref: Dr. A. Sharma
COMPLETE BLOOD COUNT (CBC):
- Hemoglobin (Hb): 10.2 g/dL [Ref: 12.0 - 15.0 g/dL] (LOW / ABNORMAL)
- Total WBC Count: 6,800 /cu.mm [Ref: 4,000 - 11,000] (Normal)
- Platelet Count: 2.2 Lakhs /cu.mm [Ref: 1.5 - 4.5] (Normal)
- ESR (1st hour): 34 mm/hr [Ref: 0 - 20 mm/hr] (HIGH / ABNORMAL)
- Fasting Blood Sugar: 98 mg/dL [Ref: 70 - 100 mg/dL] (Normal)`,
    confidence: 0.97,
    processingTimeMs: 980,
    extractedAt: '2026-08-28T08:19:02Z'
  },
  {
    id: 'OCR-003',
    documentId: 'DOC-003',
    rawText: `OPD PRESCRIPTION CARD - AYUSH WELLNESS CLINIC
Date: 15-Jun-2026 | Patient: Radha Sharma
Rx:
1. Tab Amlodipine 5mg - 1 Tab OD Morning (Oral)
2. Yogaraj Guggulu - 2 Tab BD with warm water
3. Shallaki (Boswellia serrata) 500mg - 1 Cap BD after meals
4. Prasaranyadi Kwatha - 15ml BD with 45ml boiled lukewarm water
Advice: Avoid cold foods, curd at night, avoid squatting on floor.`,
    confidence: 0.94,
    processingTimeMs: 1100,
    extractedAt: '2026-08-28T08:20:02Z'
  }
];

export const seededMedicalEntities: MedicalEntity[] = [
  {
    id: 'ENT-001',
    documentId: 'DOC-001',
    patientId: 'PAT-HERO-01',
    entityType: 'DIAGNOSIS',
    name: 'Essential Hypertension',
    confidence: 0.96,
    sourceTextSnippet: 'Diagnosis: Essential Hypertension (Controlled)',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  },
  {
    id: 'ENT-002',
    documentId: 'DOC-001',
    patientId: 'PAT-HERO-01',
    entityType: 'DIAGNOSIS',
    name: 'Janu Sandhivata (Bilateral Knee Osteoarthritis)',
    confidence: 0.94,
    sourceTextSnippet: 'Mild Janu Sandhivata (Bilateral Knee Osteoarthritis)',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  },
  {
    id: 'ENT-003',
    documentId: 'DOC-002',
    patientId: 'PAT-HERO-01',
    entityType: 'INVESTIGATION',
    name: 'Hemoglobin',
    value: '10.2',
    unit: 'g/dL',
    referenceRange: '12.0 - 15.0 g/dL',
    isAbnormal: true,
    abnormalDirection: 'LOW',
    confidence: 0.98,
    sourceTextSnippet: 'Hemoglobin (Hb): 10.2 g/dL [Ref: 12.0 - 15.0 g/dL] (LOW)',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  },
  {
    id: 'ENT-004',
    documentId: 'DOC-002',
    patientId: 'PAT-HERO-01',
    entityType: 'INVESTIGATION',
    name: 'ESR (Erythrocyte Sedimentation Rate)',
    value: '34',
    unit: 'mm/hr',
    referenceRange: '0 - 20 mm/hr',
    isAbnormal: true,
    abnormalDirection: 'HIGH',
    confidence: 0.97,
    sourceTextSnippet: 'ESR (1st hour): 34 mm/hr [Ref: 0 - 20 mm/hr] (HIGH)',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  },
  {
    id: 'ENT-005',
    documentId: 'DOC-003',
    patientId: 'PAT-HERO-01',
    entityType: 'MEDICATION',
    name: 'Amlodipine',
    dosage: '5 mg',
    frequency: 'Once Daily (Morning)',
    route: 'Oral',
    confidence: 0.96,
    sourceTextSnippet: 'Tab Amlodipine 5mg - 1 Tab OD Morning',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  },
  {
    id: 'ENT-006',
    documentId: 'DOC-003',
    patientId: 'PAT-HERO-01',
    entityType: 'MEDICATION',
    name: 'Yogaraj Guggulu',
    dosage: '2 Tablets (500mg each)',
    frequency: 'Twice Daily (Morning & Evening)',
    route: 'Oral with lukewarm water',
    confidence: 0.95,
    sourceTextSnippet: 'Yogaraj Guggulu - 2 Tab BD with warm water',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  },
  {
    id: 'ENT-007',
    documentId: 'DOC-003',
    patientId: 'PAT-HERO-01',
    entityType: 'MEDICATION',
    name: 'Shallaki (Boswellia serrata)',
    dosage: '500 mg',
    frequency: 'Twice Daily (after meals)',
    route: 'Oral',
    confidence: 0.93,
    sourceTextSnippet: 'Shallaki (Boswellia serrata) 500mg - 1 Cap BD',
    provenance: 'OCR_DOCUMENT',
    isVerified: true
  }
];

export const seededTimelineEvents: TimelineEvent[] = [
  {
    id: 'TL-001',
    patientId: 'PAT-HERO-01',
    date: '2025-11-12',
    title: 'Inpatient Discharge — AIIA Kayachikitsa Ward',
    category: 'DISCHARGE',
    institution: 'All India Institute of Ayurveda, New Delhi',
    description: 'Managed for early Janu Sandhivata and BP stabilization. Received Janu Basti therapies.',
    keyEntities: ['Hypertension', 'Janu Sandhivata', 'Janu Basti', 'Yogaraj Guggulu'],
    documentId: 'DOC-001',
    provenance: 'OCR_DOCUMENT'
  },
  {
    id: 'TL-002',
    patientId: 'PAT-HERO-01',
    date: '2026-06-15',
    title: 'Ayush Wellness OPD Follow-up Prescription',
    category: 'PRESCRIPTION',
    institution: 'Ayush Wellness Clinic, Ghaziabad',
    description: 'Prescription renewed: Amlodipine 5mg, Yogaraj Guggulu, Shallaki 500mg, Prasaranyadi Kwatha.',
    keyEntities: ['Amlodipine', 'Yogaraj Guggulu', 'Shallaki', 'Prasaranyadi Kwatha'],
    documentId: 'DOC-003',
    provenance: 'OCR_DOCUMENT'
  },
  {
    id: 'TL-003',
    patientId: 'PAT-HERO-01',
    date: '2026-07-03',
    title: 'Routine CBC Lab Investigation Report',
    category: 'LAB_TEST',
    institution: 'City Pathology Diagnostic Centre',
    description: 'Hb: 10.2 g/dL (Mild Anaemia / Pandu lakshana), ESR: 34 mm/hr (Elevated inflammatory marker).',
    keyEntities: ['Hb 10.2 g/dL (Low)', 'ESR 34 mm/hr (High)', 'FBS 98 mg/dL'],
    documentId: 'DOC-002',
    provenance: 'OCR_DOCUMENT'
  },
  {
    id: 'TL-004',
    patientId: 'PAT-HERO-01',
    date: '2026-08-28',
    title: 'MediKiosk Pre-Consultation Case-Taking & Intake',
    category: 'AYUSH_INTAKE',
    institution: 'AIIA OPD Kiosk Terminal #03',
    description: 'AI-assisted clinical intake completed in Hindi. Vata-Kapha Prakriti, Agnimandya, Bilateral knee pain (VAS 6/10).',
    keyEntities: ['Sandhivata', 'Vishamagni', 'Krura Koshtha', 'Vata-Kapha'],
    provenance: 'AI_INFERENCE'
  }
];

export const seededAbdmRecords: AbdmRecord[] = [
  {
    id: 'ABDM-001',
    patientId: 'PAT-HERO-01',
    resourceType: 'DiagnosticReport',
    hipName: 'AIIA Central Diagnostic Laboratory (HIP-IN-00192)',
    hipId: 'IN0710000019',
    recordDate: '2026-07-03',
    isSimulated: true,
    fhirJson: {
      resourceType: 'DiagnosticReport',
      id: 'dr-cb-20260703-01',
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0074', code: 'LAB' }] }],
      code: { text: 'Complete Blood Count (CBC) with ESR' },
      subject: { reference: 'Patient/MK-PAT-2026-000124', display: 'Smt. Radha Sharma' },
      effectiveDateTime: '2026-07-03T10:30:00+05:30',
      result: [
        { display: 'Hemoglobin: 10.2 g/dL (Below Normal)' },
        { display: 'ESR: 34 mm/hr (Above Normal)' }
      ]
    }
  },
  {
    id: 'ABDM-002',
    patientId: 'PAT-HERO-01',
    resourceType: 'MedicationRequest',
    hipName: 'Govt. Ayush Wellness Dispensary (HIP-IN-00441)',
    hipId: 'IN0710000044',
    recordDate: '2026-06-15',
    isSimulated: true,
    fhirJson: {
      resourceType: 'MedicationRequest',
      id: 'mr-20260615-02',
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: { text: 'Amlodipine 5mg Tablet + Yogaraj Guggulu 500mg' },
      subject: { reference: 'Patient/MK-PAT-2026-000124' },
      authoredOn: '2026-06-15'
    }
  }
];

export const seededAiSummaries: AiSummary[] = [
  {
    id: 'SUM-HERO-01',
    sessionId: 'SES-HERO-01',
    patientId: 'PAT-HERO-01',
    version: 1,
    status: 'DRAFT_AI',
    patientSnapshot: '58-year-old female presenting with chronic bilateral knee pain (Sandhivata) for 6 months with morning stiffness, underlying controlled Hypertension on Amlodipine 5mg, and mild Agnimandya (digestive sluggishness).',
    chiefComplaint: 'Bilateral knee joint pain, morning stiffness (30-45 mins), difficulty in climbing stairs for past 6 months.',
    historyOfPresentIllness: 'Symptoms began insidiously 6 months ago as mild aching in the right knee, gradually involving both knees. Pain is aggravated by cold weather, prolonged walking, and descending stairs. Relieved partially by warm oil application and rest. Associated with audible crepitus and mild localized heaviness. No history of sudden lock, fever, or traumatic injury.',
    relevantPastHistory: [
      'Known case of Essential Hypertension for 4 years (well-controlled on regular medication)',
      'History of Janu Basti treatment at AIIA in Nov 2025 with good symptomatic relief',
      'No past history of Diabetes Mellitus, Asthma, or Cardiac events'
    ],
    surgicalHistory: ['No major surgical interventions reported.'],
    medicationHistory: [
      { name: 'Amlodipine', dose: '5 mg', freq: 'OD Morning', source: 'Patient Voice & OCR Prescription', confidence: 0.98 },
      { name: 'Yogaraj Guggulu', dose: '2 Tablets (500mg)', freq: 'BD with warm water', source: 'OCR Prescription 2026-06-15', confidence: 0.95 },
      { name: 'Shallaki (Boswellia)', dose: '500 mg', freq: 'BD after meals', source: 'OCR Prescription 2026-06-15', confidence: 0.93 },
      { name: 'Paracetamol', dose: '650 mg', freq: 'SOS (as needed)', source: 'Patient Voice', confidence: 0.90 }
    ],
    allergies: [
      { allergen: 'Sulfa Drugs / Co-trimoxazole', severity: 'MODERATE', reaction: 'Skin rash and itching (self-reported 5 years ago)' }
    ],
    familyHistory: [
      'Mother had history of chronic joint pains (Sandhigata Vata)',
      'Father had history of Hypertension'
    ],
    personalHistory: {
      diet: 'Vegetarian, prefers warm cooked food, irregular meal timings (Vishamashana)',
      sleep: 'Disturbed / light sleep due to knee discomfort when turning sides (approx 5-6 hrs/night)',
      bowel: 'Irregular, hard stools, tendency towards constipation (Krura Koshtha)',
      bladder: 'Regular, 4-5 times/day, no nocturia or dysuria',
      appetite: 'Sluggish / variable (Mandagni / Vishamagni)',
      substances: 'None. Does not consume tobacco or alcohol.',
      physicalActivity: 'Sedentary. Minimal walking due to knee pain.'
    },
    reviewOfSystems: {
      Musculoskeletal: 'Bilateral knee pain, crepitus, morning stiffness (30-45 mins). No small joint involvement in hands/feet.',
      Cardiovascular: 'Controlled BP (128/84 mmHg). No chest pain, palpitations, or orthopnea.',
      Respiratory: 'No cough, wheezing, or breathlessness on flat walking.',
      Gastrointestinal: 'Post-meal fullness, bloating, constipation. No acidity or hematemesis.',
      Neurological: 'No dizziness, numbness, tingling, or focal weakness.'
    },
    previousInvestigations: [
      { test: 'Hemoglobin (CBC)', value: '10.2 g/dL', date: '2026-07-03', isAbnormal: true },
      { test: 'ESR (1st Hour)', value: '34 mm/hr', date: '2026-07-03', isAbnormal: true },
      { test: 'Fasting Blood Sugar', value: '98 mg/dL', date: '2026-07-03', isAbnormal: false }
    ],
    ayushAssessmentSummary: 'Doshic Imbalance: Vata-Kapha Prakopa with Dhatukshaya in Asthi-Majja Dhatu. Agni: Mandagni. Koshtha: Krura. Dushya: Asthi, Sandhi, Majja, Snayu. Nidana: Vatakara intake + aging factor (Vaya). Samprapti: Vata Sthanasamshraya in Janu Sandhi manifesting as Sandhivata (Osteoarthritis).',
    redFlagsDetected: [],
    missingInformation: [
      'Recent X-Ray Bilateral Knees (Standing AP/Lateral) pending',
      'Serum Uric Acid and Rheumatoid Factor (RF / Anti-CCP) to rule out inflammatory arthropathy'
    ],
    confidenceOverall: 0.95,
    provenanceSummary: [
      { fact: 'Chief Complaint: Knee pain & stiffness for 6 months', source: 'PATIENT_VOICE', confidence: 0.96 },
      { fact: 'Pain severity 6/10, worse on stairs & cold weather', source: 'PATIENT_TOUCH', confidence: 1.0 },
      { fact: 'Amlodipine 5mg regular daily', source: 'OCR_DOCUMENT', confidence: 0.98 },
      { fact: 'Sulfa allergy', source: 'PATIENT_VOICE', confidence: 0.92 },
      { fact: 'Hb 10.2 g/dL (Mild Anaemia / Pandu)', source: 'OCR_DOCUMENT', confidence: 0.97 },
      { fact: 'Vata-Kapha Prakriti & Mandagni synthesis', source: 'AI_INFERENCE', confidence: 0.94 }
    ],
    createdAt: '2026-08-28T08:25:30Z'
  }
];

export const seededRedFlagAlerts: RedFlagAlert[] = [
  {
    id: 'RFA-EMERG-01',
    sessionId: 'SES-EMERG-02',
    patientId: 'PAT-EMERG-02',
    tokenNumber: 'EMERG-001',
    patientName: 'Shri Rajesh Patel',
    age: 62,
    gender: 'MALE',
    triggerRule: 'RED_FLAG_ACUTE_CORONARY_SYNDROME',
    triggerInput: 'Voice intake: "Severe pressing chest pain for 45 minutes radiating to left shoulder and jaw with heavy sweating and breathlessness."',
    severity: 'EMERGENCY_CRITICAL',
    detectedAt: '2026-08-28T08:48:15Z',
    status: 'ACKNOWLEDGED',
    acknowledgedBy: 'Sister Suniti Rao (Triage Nurse)',
    acknowledgedAt: '2026-08-28T08:49:00Z',
    clinicalActionTaken: 'Immediate transfer to Emergency Resuscitation Bay. STAT ECG 12-Lead, O2 support @ 4L/min, IV access secured. Attending physician Dr. Sen notified.'
  }
];

export const seededNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-001',
    patientId: 'PAT-HERO-01',
    channel: 'SMS',
    title: 'Appointment Confirmed — AIIA MediKiosk',
    message: 'Dear Radha Sharma, your appointment with Prof. (Dr.) Ananya Sharma (Kayachikitsa) is confirmed for 28-Aug-2026 at 09:15 AM. Token: A-027. Room: OPD 104.',
    timestamp: '2026-08-28T08:08:30Z',
    status: 'DELIVERED'
  },
  {
    id: 'NOTIF-002',
    patientId: 'PAT-HERO-01',
    channel: 'WHATSAPP',
    title: 'Queue Update',
    message: 'MediKiosk Live Queue: Token A-025 is currently with Dr. Ananya Sharma. Your Token is A-027. Approx waiting time: 18 mins. Please proceed to OPD Waiting Lounge.',
    timestamp: '2026-08-28T08:45:10Z',
    status: 'DELIVERED'
  }
];

export const seededIntegrationEvents: IntegrationEvent[] = [
  {
    id: 'INT-001',
    integrationType: 'ABDM_M1',
    direction: 'OUTBOUND',
    endpoint: 'https://sandbox.abdm.gov.in/v1/registration/mobile/verifyOtp',
    status: 'SIMULATED_SUCCESS',
    latencyMs: 140,
    payload: { abhaNumber: '91-4829-1029-4821', authMode: 'DEMO_SIMULATION' },
    response: { status: 'SUCCESS', verified: true, kycStatus: 'VERIFIED', abhaAddress: 'radha.sharma@abdm' },
    timestamp: '2026-08-28T08:04:30Z'
  },
  {
    id: 'INT-002',
    integrationType: 'HIS_EMR',
    direction: 'OUTBOUND',
    endpoint: 'https://his-demo.aiia.gov.in/api/v2/opd/encounter-preintake',
    status: 'SIMULATED_SUCCESS',
    latencyMs: 180,
    payload: { encounterId: 'ENC-2026-0828-027', patientId: 'MK-PAT-2026-000124', intakeStatus: 'COMPLETED_BY_AI' },
    response: { status: 'RECEIVED', hisEncounterRef: 'AIIA-HIS-ENC-882194' },
    timestamp: '2026-08-28T08:26:00Z'
  }
];

export const seededAuditLogs: AuditLog[] = [
  {
    id: 'AUD-001',
    correlationId: 'CORR-INIT-01',
    actorId: 'PAT-HERO-01',
    actorRole: 'PATIENT',
    action: 'CONSENT_GRANTED',
    resourceType: 'CONSENT',
    resourceId: 'CNS-001',
    details: { version: 'v2.4-DPDP-2026', scopes: ['PERSONAL_INFO', 'VOICE', 'OCR', 'ABDM_SHARING'] },
    ipAddress: '192.168.1.104',
    timestamp: '2026-08-28T08:05:12Z'
  },
  {
    id: 'AUD-002',
    correlationId: 'CORR-OCR-01',
    actorId: 'AI_OCR_ENGINE',
    actorRole: 'SYSTEM_ADMIN',
    action: 'OCR_EXTRACTION_COMPLETED',
    resourceType: 'DOCUMENT',
    resourceId: 'DOC-002',
    details: { fileName: 'City_PathLab_CBC_Report_2026-07-03.pdf', confidence: 0.97, extractedEntitiesCount: 5 },
    ipAddress: '127.0.0.1',
    timestamp: '2026-08-28T08:19:05Z'
  },
  {
    id: 'AUD-003',
    correlationId: 'CORR-SUM-01',
    actorId: 'CLINICAL_AI_SERVICE',
    actorRole: 'SYSTEM_ADMIN',
    action: 'AI_SUMMARY_GENERATED',
    resourceType: 'AI_SUMMARY',
    resourceId: 'SUM-HERO-01',
    details: { status: 'DRAFT_AI', confidence: 0.95, redFlagsCount: 0 },
    ipAddress: '127.0.0.1',
    timestamp: '2026-08-28T08:25:35Z'
  }
];

export const seededSystemHealth: SystemHealthStatus[] = [
  {
    service: 'Relational Database Store (SQLite/State)',
    status: 'OPERATIONAL',
    latencyMs: 4,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'State persistent with ACID file flush. Zero query bottlenecks.'
  },
  {
    service: 'MediKiosk Clinical AI Engine (Ollama/LLM Gateway)',
    status: 'DEMO_MODE',
    latencyMs: 180,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'Deterministic clinical ontology with LLM fallback adapter.'
  },
  {
    service: 'Document OCR & Medical Entity Extraction Pipeline',
    status: 'OPERATIONAL',
    latencyMs: 950,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'Preprocessing, regex, and clinical NER pipeline operational.'
  },
  {
    service: 'Web Speech & Multimodal ASR Engine',
    status: 'OPERATIONAL',
    latencyMs: 85,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'Native browser Web Speech API with simulated voice fallback.'
  },
  {
    service: 'ABDM Health Information Exchange (M1, M2, M3 Adapter)',
    status: 'DEMO_MODE',
    latencyMs: 140,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'Simulated ABDM sandbox with FHIR R4 resource generation.'
  },
  {
    service: 'HIS / EMR Integration Gateway',
    status: 'DEMO_MODE',
    latencyMs: 160,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'HL7/FHIR encounter transmission gateway active.'
  },
  {
    service: 'Hospital Notification Center (SMS / WhatsApp Gateway)',
    status: 'DEMO_MODE',
    latencyMs: 45,
    lastCheck: '2026-08-28T08:50:00Z',
    notes: 'Simulated multi-channel notification dispatcher active.'
  }
];
