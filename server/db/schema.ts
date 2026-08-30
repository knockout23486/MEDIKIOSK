export type UserRole = 'PATIENT' | 'DOCTOR' | 'TRIAGE' | 'ADMIN' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  mkPatientId: string; // e.g. MK-PAT-2026-000124
  abhaNumber: string; // e.g. 91-4829-1029-4821
  abhaAddress: string; // e.g. radha.sharma@abdm
  name: string;
  age: number;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  language: string;
  accessibilityNeeds?: string[];
  isDemo: boolean;
  registeredAt: string;
}

export interface Consent {
  id: string;
  patientId: string;
  version: string;
  purposes: {
    personalInfo: boolean;
    clinicalHistory: boolean;
    voiceRecording: boolean;
    ocrDocuments: boolean;
    aiSummary: boolean;
    abdmDataExchange: boolean;
  };
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  grantedAt: string;
  ipAddress: string;
  signatureType: 'ELECTRONIC_DEMO' | 'BIOMETRIC' | 'OTP';
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  type: 'AYUSH_CENTRAL' | 'GOVT_STATE' | 'DISTRICT_INTEGRATED';
  address: string;
  phone: string;
  activeOpdCount: number;
  currentQueueLength: number;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  isAyush: boolean;
  ayushBranch?: 'KAYACHIKITSA' | 'PANCHAKARMA' | 'SHALYA' | 'SHALAKYA' | 'STRIROGA' | 'KAUMARBHRITYA' | 'SWASTHAVRITTA';
  description: string;
  iconName: string;
}

export interface Practitioner {
  id: string;
  userId: string;
  hospitalId: string;
  departmentId: string;
  name: string;
  title: string; // e.g. Prof. Dr. / Vaidya
  specialty: string;
  qualifications: string; // e.g. BAMS, MD (Ayurveda), PhD
  roomNumber: string;
  experienceYears: number;
  opdTiming: string; // e.g. 09:00 AM - 01:00 PM
  isAvailable: boolean;
  avgConsultationMins: number;
  activeQueueCount: number;
}

export interface Appointment {
  id: string;
  appointmentNumber: string; // e.g. APT-2026-0828-027
  patientId: string;
  practitionerId: string;
  departmentId: string;
  hospitalId: string;
  slotDate: string; // YYYY-MM-DD
  slotTime: string; // HH:MM AM/PM
  status: 'BOOKED' | 'CHECKED_IN' | 'TRIAGED' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';
  bookedAt: string;
}

export interface QueueToken {
  id: string;
  tokenNumber: string; // e.g. A-027
  appointmentId: string;
  patientId: string;
  practitionerId: string;
  status: 'WAITING' | 'TRIAGE_URGENT' | 'CALLED' | 'WITH_DOCTOR' | 'COMPLETED' | 'NO_SHOW';
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  estimatedWaitMins: number;
  checkInTime: string;
  calledTime?: string;
  completedTime?: string;
}

export interface ClinicalSession {
  id: string;
  patientId: string;
  appointmentId: string;
  departmentId: string;
  isAyush: boolean;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED_EMERGENCY';
  chiefComplaint: string;
  startedAt: string;
  completedAt?: string;
  redFlagTriggered: boolean;
}

export type ProvenanceSource = 
  | 'PATIENT_VOICE' 
  | 'PATIENT_TOUCH' 
  | 'OCR_DOCUMENT' 
  | 'ABDM_FHIR' 
  | 'AI_INFERENCE' 
  | 'PHYSICIAN';

export interface ClinicalAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  questionText: string;
  answerText: string;
  inputMode: 'VOICE' | 'TOUCH' | 'MIXED';
  voiceTranscript?: string;
  confidence: number; // 0.0 - 1.0
  redFlagFlagged: boolean;
  provenance: ProvenanceSource;
  timestamp: string;
}

export interface AyushAssessment {
  id: string;
  sessionId: string;
  prakriti: {
    vata: number; // 0 - 100
    pitta: number;
    kapha: number;
    dominant: 'VATA' | 'PITTA' | 'KAPHA' | 'VATA_PITTA' | 'PITTA_KAPHA' | 'VATA_KAPHA' | 'SAMA';
  };
  vikriti: {
    imbalance: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
  };
  dashavidha: {
    sara: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    samhanana: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    pramana: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    satmya: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    sattva: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    aharaShakti: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    vyayamaShakti: 'PRAVARA' | 'MADHYAMA' | 'AVARA';
    vaya: 'BALA' | 'MADHYA' | 'VRIDDHA';
  };
  agni: 'SAMAGNI' | 'MANDAGNI' | 'TIKSHNAGNI' | 'VISHAMAGNI';
  koshtha: 'MRIDU' | 'MADHYAMA' | 'KRURA';
  ahara: string; // Diet habits
  vihara: string; // Lifestyle habits
  nidana: string[]; // Etiological factors
  sampraptiSummary?: string;
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  fileName: string;
  fileType: 'PRESCRIPTION' | 'LAB_REPORT' | 'DISCHARGE_SUMMARY' | 'IMAGING' | 'OTHER';
  fileSize: number;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  isDemo: boolean;
  status: 'UPLOADED' | 'PROCESSING' | 'OCR_COMPLETED' | 'VERIFIED' | 'ERROR';
}

export interface DocumentOcrResult {
  id: string;
  documentId: string;
  rawText: string;
  confidence: number;
  processingTimeMs: number;
  extractedAt: string;
}

export interface MedicalEntity {
  id: string;
  documentId?: string;
  sessionId?: string;
  patientId: string;
  entityType: 'DIAGNOSIS' | 'MEDICATION' | 'INVESTIGATION' | 'ALLERGY' | 'PROCEDURE' | 'VITAL';
  name: string;
  value?: string;
  unit?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  duration?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  abnormalDirection?: 'HIGH' | 'LOW' | 'CRITICAL';
  confidence: number;
  sourceTextSnippet: string;
  provenance: ProvenanceSource;
  isVerified: boolean;
  verifiedByDoctor?: string;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  date: string;
  title: string;
  category: 'DISCHARGE' | 'PRESCRIPTION' | 'LAB_TEST' | 'CONSULTATION' | 'AYUSH_INTAKE';
  institution: string;
  description: string;
  keyEntities: string[];
  documentId?: string;
  provenance: ProvenanceSource;
}

export interface AbdmRecord {
  id: string;
  patientId: string;
  resourceType: 'Patient' | 'Encounter' | 'Observation' | 'Condition' | 'MedicationRequest' | 'DiagnosticReport' | 'DocumentReference' | 'Consent';
  fhirJson: Record<string, any>;
  hipName: string;
  hipId: string;
  recordDate: string;
  isSimulated: boolean;
}

export interface AiSummary {
  id: string;
  sessionId: string;
  patientId: string;
  version: number;
  status: 'DRAFT_AI' | 'PHYSICIAN_EDITED' | 'PHYSICIAN_VERIFIED';
  patientSnapshot: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  relevantPastHistory: string[];
  surgicalHistory: string[];
  medicationHistory: Array<{ name: string; dose: string; freq: string; source: string; confidence: number }>;
  allergies: Array<{ allergen: string; severity: string; reaction: string }>;
  familyHistory: string[];
  personalHistory: {
    diet: string;
    sleep: string;
    bowel: string;
    bladder: string;
    appetite: string;
    substances: string;
    physicalActivity: string;
  };
  reviewOfSystems: Record<string, string>;
  previousInvestigations: Array<{ test: string; value: string; date: string; isAbnormal: boolean }>;
  ayushAssessmentSummary?: string;
  redFlagsDetected: string[];
  missingInformation: string[];
  confidenceOverall: number;
  provenanceSummary: Array<{ fact: string; source: ProvenanceSource; confidence: number }>;
  createdAt: string;
  physicianVerifiedAt?: string;
  verifiedByDoctorId?: string;
  doctorNotes?: string;
}

export interface RedFlagAlert {
  id: string;
  sessionId: string;
  patientId: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  gender: string;
  triggerRule: string;
  triggerInput: string;
  severity: 'URGENT' | 'EMERGENCY_CRITICAL';
  detectedAt: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'ESCALATED' | 'RESOLVED';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  clinicalActionTaken?: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  practitionerId: string;
  aiSummaryId: string;
  clinicalExamination: {
    generalAppearance: string;
    vitals: {
      bp: string;
      pulse: string;
      temp: string;
      spo2: string;
      respRate: string;
    };
    systemicExam: string;
    ashtavidhaPariksha?: {
      nadi: string;
      mutra: string;
      mala: string;
      jihva: string;
      shabda: string;
      sparsha: string;
      drik: string;
      akriti: string;
    };
  };
  assessment: string;
  finalDiagnosis: Array<{ code: string; name: string; system: 'ICD11' | 'NAMASTE_AYUSH' }>;
  ayushChikitsaSutra?: string;
  followUpDate: string;
  dietLifestyleAdvice: string[];
  status: 'IN_PROGRESS' | 'FINALIZED';
  startedAt: string;
  finalizedAt?: string;
}

export interface PrescriptionItem {
  id: string;
  consultationId: string;
  medicineName: string;
  type: 'AYURVEDIC' | 'ALLOPATHIC';
  form: 'TABLET' | 'KASHAYAM' | 'CHURNA' | 'TAILA' | 'SYRUP' | 'CAPSULE' | 'GHRITA';
  dosage: string;
  frequency: string; // e.g. 1-0-1 after food with warm water
  durationDays: number;
  anupana?: string; // Vehicle e.g. Luke warm water / Honey
  instructions: string;
}

export interface InvestigationOrder {
  id: string;
  consultationId: string;
  testName: string;
  category: 'LABORATORY' | 'RADIOLOGY' | 'AYUSH_PARIKSHA';
  priority: 'ROUTINE' | 'URGENT';
  instructions: string;
  status: 'ORDERED' | 'SAMPLE_COLLECTED' | 'COMPLETED';
}

export interface NotificationItem {
  id: string;
  patientId: string;
  channel: 'SMS' | 'WHATSAPP' | 'PUSH' | 'KIOSK';
  title: string;
  message: string;
  timestamp: string;
  status: 'DELIVERED' | 'SENT' | 'SIMULATED';
}

export interface IntegrationEvent {
  id: string;
  integrationType: 'HIS_EMR' | 'ABDM_M1' | 'ABDM_M2' | 'ABDM_M3' | 'AI_OCR_SERVICE' | 'SPEECH_API';
  direction: 'OUTBOUND' | 'INBOUND';
  endpoint: string;
  status: 'SUCCESS' | 'SIMULATED_SUCCESS' | 'FAILED' | 'RETRYING';
  latencyMs: number;
  payload: Record<string, any>;
  response: Record<string, any>;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  correlationId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  timestamp: string;
}

export interface SystemHealthStatus {
  service: string;
  status: 'OPERATIONAL' | 'DEMO_MODE' | 'DEGRADED' | 'UNAVAILABLE';
  latencyMs: number;
  lastCheck: string;
  notes: string;
}
