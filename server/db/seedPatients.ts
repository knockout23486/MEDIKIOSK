import {
  Patient, Consent, Appointment, QueueToken,
  ClinicalSession, ClinicalAnswer, AyushAssessment
} from './schema.js';

export const seededPatients: Patient[] = [
  // 1. HERO DEMO PATIENT
  {
    id: 'PAT-HERO-01',
    mkPatientId: 'MK-PAT-2026-000124',
    abhaNumber: '91-4829-1029-4821',
    abhaAddress: 'radha.sharma@abdm',
    name: 'Smt. Radha Sharma',
    age: 58,
    dob: '1968-04-14',
    gender: 'FEMALE',
    phone: '+91 98765 43210',
    address: 'H.No. 42, Sector 15, Vasundhara, Ghaziabad, UP',
    emergencyContact: {
      name: 'Manoj Sharma (Son)',
      relationship: 'Son',
      phone: '+91 98765 11223'
    },
    language: 'hi',
    accessibilityNeeds: ['AUDIO_GUIDANCE', 'LARGE_TOUCH_TARGETS'],
    isDemo: true,
    registeredAt: '2026-08-20T08:30:00Z'
  },
  // 2. EMERGENCY RED-FLAG PATIENT
  {
    id: 'PAT-EMERG-02',
    mkPatientId: 'MK-PAT-2026-000125',
    abhaNumber: '91-5912-3841-9920',
    abhaAddress: 'rajesh.patel@abdm',
    name: 'Shri Rajesh Patel',
    age: 62,
    dob: '1964-11-03',
    gender: 'MALE',
    phone: '+91 97111 88990',
    address: 'Flat 302, Green Avenue, Noida Sector 62, UP',
    emergencyContact: {
      name: 'Kavita Patel (Wife)',
      relationship: 'Spouse',
      phone: '+91 97111 44556'
    },
    language: 'en',
    accessibilityNeeds: ['URGENT_TRIAGE'],
    isDemo: true,
    registeredAt: '2026-08-28T07:15:00Z'
  },
  // 3. MULTI-DOCUMENT CHRONIC PATIENT
  {
    id: 'PAT-DOCS-03',
    mkPatientId: 'MK-PAT-2026-000126',
    abhaNumber: '91-7721-4412-8833',
    abhaAddress: 'sunita.verma@abdm',
    name: 'Smt. Sunita Verma',
    age: 52,
    dob: '1974-06-21',
    gender: 'FEMALE',
    phone: '+91 98222 11447',
    address: 'B-14, Mayur Vihar Phase 1, New Delhi',
    emergencyContact: {
      name: 'Alok Verma (Husband)',
      relationship: 'Spouse',
      phone: '+91 98222 99881'
    },
    language: 'en',
    accessibilityNeeds: [],
    isDemo: true,
    registeredAt: '2026-08-25T10:00:00Z'
  },
  // 4. LOW-LITERACY TOUCH-FIRST PATIENT
  {
    id: 'PAT-TOUCH-04',
    mkPatientId: 'MK-PAT-2026-000127',
    abhaNumber: '91-3321-9901-5544',
    abhaAddress: 'ramu.lal@abdm',
    name: 'Shri Ramu Lal',
    age: 67,
    dob: '1959-02-18',
    gender: 'MALE',
    phone: '+91 96555 12345',
    address: 'Village Chhajarsi, District Gautam Buddha Nagar, UP',
    emergencyContact: {
      name: 'Dinesh Lal (Son)',
      relationship: 'Son',
      phone: '+91 96555 67890'
    },
    language: 'hi',
    accessibilityNeeds: ['VOICE_ONLY', 'HIGH_CONTRAST', 'AUDIO_ASSIST'],
    isDemo: true,
    registeredAt: '2026-08-27T09:40:00Z'
  },
  // 5. PEDIATRIC PATIENT
  {
    id: 'PAT-PED-05',
    mkPatientId: 'MK-PAT-2026-000128',
    abhaNumber: '91-1122-3344-5566',
    abhaAddress: 'aarav.mehta@abdm',
    name: 'Master Aarav Mehta',
    age: 7,
    dob: '2019-09-12',
    gender: 'MALE',
    phone: '+91 99100 22334',
    address: 'C-48, Indirapuram, Ghaziabad, UP',
    emergencyContact: {
      name: 'Pooja Mehta (Mother)',
      relationship: 'Parent',
      phone: '+91 99100 22334'
    },
    language: 'hi',
    accessibilityNeeds: [],
    isDemo: true,
    registeredAt: '2026-08-26T11:20:00Z'
  }
];

export const seededConsents: Consent[] = [
  {
    id: 'CNS-001',
    patientId: 'PAT-HERO-01',
    version: 'v2.4-DPDP-2026',
    purposes: {
      personalInfo: true,
      clinicalHistory: true,
      voiceRecording: true,
      ocrDocuments: true,
      aiSummary: true,
      abdmDataExchange: true
    },
    status: 'ACTIVE',
    grantedAt: '2026-08-28T08:05:12Z',
    ipAddress: '192.168.1.104 (Kiosk Terminal #03)',
    signatureType: 'ELECTRONIC_DEMO'
  }
];

export const seededAppointments: Appointment[] = [
  {
    id: 'APT-001',
    appointmentNumber: 'APT-2026-0828-027',
    patientId: 'PAT-HERO-01',
    practitionerId: 'PRAC-01',
    departmentId: 'DEP-01',
    hospitalId: 'HOSP-01',
    slotDate: '2026-08-28',
    slotTime: '09:15 AM',
    status: 'CHECKED_IN',
    bookedAt: '2026-08-28T08:08:00Z'
  },
  {
    id: 'APT-002',
    appointmentNumber: 'APT-2026-0828-028',
    patientId: 'PAT-EMERG-02',
    practitionerId: 'PRAC-03',
    departmentId: 'DEP-08',
    hospitalId: 'HOSP-01',
    slotDate: '2026-08-28',
    slotTime: '09:30 AM',
    status: 'TRIAGED',
    bookedAt: '2026-08-28T08:15:00Z'
  },
  {
    id: 'APT-003',
    appointmentNumber: 'APT-2026-0828-029',
    patientId: 'PAT-DOCS-03',
    practitionerId: 'PRAC-01',
    departmentId: 'DEP-01',
    hospitalId: 'HOSP-01',
    slotDate: '2026-08-28',
    slotTime: '09:45 AM',
    status: 'BOOKED',
    bookedAt: '2026-08-28T08:20:00Z'
  }
];

export const seededQueueTokens: QueueToken[] = [
  {
    id: 'TOK-025',
    tokenNumber: 'A-025',
    appointmentId: 'APT-000',
    patientId: 'PAT-DOCS-03',
    practitionerId: 'PRAC-01',
    status: 'WITH_DOCTOR',
    priority: 'NORMAL',
    estimatedWaitMins: 0,
    checkInTime: '2026-08-28T08:30:00Z',
    calledTime: '2026-08-28T08:50:00Z'
  },
  {
    id: 'TOK-026',
    tokenNumber: 'A-026',
    appointmentId: 'APT-000B',
    patientId: 'PAT-TOUCH-04',
    practitionerId: 'PRAC-01',
    status: 'WAITING',
    priority: 'NORMAL',
    estimatedWaitMins: 6,
    checkInTime: '2026-08-28T08:35:00Z'
  },
  {
    id: 'TOK-027',
    tokenNumber: 'A-027',
    appointmentId: 'APT-001',
    patientId: 'PAT-HERO-01',
    practitionerId: 'PRAC-01',
    status: 'WAITING',
    priority: 'NORMAL',
    estimatedWaitMins: 18,
    checkInTime: '2026-08-28T08:45:00Z'
  },
  {
    id: 'TOK-028',
    tokenNumber: 'EMERG-001',
    appointmentId: 'APT-002',
    patientId: 'PAT-EMERG-02',
    practitionerId: 'PRAC-03',
    status: 'TRIAGE_URGENT',
    priority: 'EMERGENCY',
    estimatedWaitMins: 1,
    checkInTime: '2026-08-28T08:48:00Z'
  }
];

export const seededClinicalSessions: ClinicalSession[] = [
  {
    id: 'SES-HERO-01',
    patientId: 'PAT-HERO-01',
    appointmentId: 'APT-001',
    departmentId: 'DEP-01',
    isAyush: true,
    status: 'COMPLETED',
    chiefComplaint: 'Bilateral knee joint pain, morning stiffness for 6 months, and mild post-meal bloating.',
    startedAt: '2026-08-28T08:10:00Z',
    completedAt: '2026-08-28T08:25:00Z',
    redFlagTriggered: false
  }
];

export const seededClinicalAnswers: ClinicalAnswer[] = [
  {
    id: 'ANS-001',
    sessionId: 'SES-HERO-01',
    questionId: 'Q_CC_01',
    questionText: 'Tell me what brings you to the hospital today. / आज आप किस तकलीफ के लिए आए हैं?',
    answerText: 'Mujhe dono ghutno me pichhle 6 mahine se dard aur subah jakdan rehti hai. Sath hi khana khane ke baad pet me bhari-pan aur gas banti hai.',
    inputMode: 'VOICE',
    voiceTranscript: 'मुझे दोनों घुटनों में पिछले 6 महीने से दर्द और सुबह जकड़न रहती है। साथ ही खाना खाने के बाद पेट में भारीपन और गैस बनती है।',
    confidence: 0.96,
    redFlagFlagged: false,
    provenance: 'PATIENT_VOICE',
    timestamp: '2026-08-28T08:11:30Z'
  },
  {
    id: 'ANS-002',
    sessionId: 'SES-HERO-01',
    questionId: 'Q_PAIN_SEV',
    questionText: 'How severe is the joint pain on a daily basis?',
    answerText: 'Moderate to Severe (Score: 6/10), worsens while climbing stairs and during cold weather.',
    inputMode: 'TOUCH',
    confidence: 1.0,
    redFlagFlagged: false,
    provenance: 'PATIENT_TOUCH',
    timestamp: '2026-08-28T08:12:45Z'
  },
  {
    id: 'ANS-003',
    sessionId: 'SES-HERO-01',
    questionId: 'Q_MORNING_STIFF',
    questionText: 'Do you experience morning stiffness, and for how long?',
    answerText: 'Yes, about 30 to 45 minutes every morning (Sandhi Stambha).',
    inputMode: 'TOUCH',
    confidence: 1.0,
    redFlagFlagged: false,
    provenance: 'PATIENT_TOUCH',
    timestamp: '2026-08-28T08:13:30Z'
  },
  {
    id: 'ANS-004',
    sessionId: 'SES-HERO-01',
    questionId: 'Q_DIGESTION_AGNI',
    questionText: 'How is your appetite and bowel habit? (Agni & Koshtha assessment)',
    answerText: 'Appetite is irregular (Vishamagni). Irregular bowel movements, prone to constipation and dry stools.',
    inputMode: 'MIXED',
    voiceTranscript: 'भूख कभी लगती है कभी नहीं लगती। पेट साफ ठीक से नहीं होता, कब्ज रहता है।',
    confidence: 0.94,
    redFlagFlagged: false,
    provenance: 'PATIENT_VOICE',
    timestamp: '2026-08-28T08:15:10Z'
  },
  {
    id: 'ANS-005',
    sessionId: 'SES-HERO-01',
    questionId: 'Q_MED_HISTORY',
    questionText: 'Are you currently taking any regular medications?',
    answerText: 'Tab Amlodipine 5mg once daily for Hypertension. Occasionally Tab Paracetamol 650mg for knee pain relief.',
    inputMode: 'VOICE',
    voiceTranscript: 'बीपी की गोली खाती हूँ एमलोडिपिन 5 मिलीग्राम रोज। घुटने के दर्द के लिए कभी-कभी पैरासिटामोल ले लेती हूँ।',
    confidence: 0.95,
    redFlagFlagged: false,
    provenance: 'PATIENT_VOICE',
    timestamp: '2026-08-28T08:16:50Z'
  }
];

export const seededAyushAssessments: AyushAssessment[] = [
  {
    id: 'AYUSH-001',
    sessionId: 'SES-HERO-01',
    prakriti: {
      vata: 55,
      pitta: 30,
      kapha: 15,
      dominant: 'VATA_PITTA'
    },
    vikriti: {
      imbalance: 'Vata-Kapha Vriddhi with Dhatukshaya & Avarana at Janu Sandhi',
      severity: 'MODERATE'
    },
    dashavidha: {
      sara: 'MADHYAMA',
      samhanana: 'MADHYAMA',
      pramana: 'MADHYAMA',
      satmya: 'MADHYAMA',
      sattva: 'MADHYAMA',
      aharaShakti: 'AVARA',
      vyayamaShakti: 'AVARA',
      vaya: 'VRIDDHA'
    },
    agni: 'MANDAGNI',
    koshtha: 'KRURA',
    ahara: 'Vegetarian, preference for warm cooked food, irregular meal timings, occasional dry snacks',
    vihara: 'Sedentary, minimal brisk walking due to knee pain, disturbed sleep due to joint aching',
    nidana: ['Vatakara Ahara (dry/cold food)', 'Ativyayama / Stair climbing history', 'Aging (Vaya-janya Vata Vriddhi)', 'Irregular food timings (Vishamashana)'],
    sampraptiSummary: 'Prakupita Vata localizes in Janu Sandhi (Khavaigunya) causing Shoola (pain), Shopha (crepitus/mild swelling), and Stambha (stiffness) consistent with Sandhivata (Osteoarthritis).'
  }
];
