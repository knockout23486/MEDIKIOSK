// ============================================================================
// MediKiosk Data Layer — Relational Schema (PostgreSQL via Drizzle ORM)
// ----------------------------------------------------------------------------
// SEC-001 remediation: the platform previously persisted all clinical data to
// a flat JSON file. It now uses a proper RDBMS. This module defines BOTH:
//   1. The canonical TypeScript domain models (unchanged shape — the API
//      contract used by the React client stays byte-compatible).
//   2. The physical PostgreSQL tables (snake_case columns, jsonb for nested
//      clinical structures, timestamptz for instants, date for calendar days).
// ============================================================================
import {
  pgTable, varchar, text, integer, boolean, doublePrecision, jsonb, index,
  uniqueIndex, pgSequence, customType
} from 'drizzle-orm/pg-core';
import { encryptedText, encryptedJson } from './crypto.js';

// Timestamp-with-time-zone column. SQL stores `timestamptz`; the application
// layer exchanges ISO-8601 strings (UTC) so the wire format is unchanged.
// The driver may hand back a Date object or a raw 'YYYY-MM-DD HH:MM:SS+TZ'
// string depending on parser configuration — normalize both.
export const tstz = customType<{ data: string; driverData: Date | string }>({
  dataType: () => 'timestamp with time zone',
  toDriver(value: string): Date {
    return new Date(value);
  },
  fromDriver(value: Date | string): string {
    if (value instanceof Date) return value.toISOString();
    // Normalize '2026-08-20 08:30:00+00' / '...+05:30' / '...Z' → ISO UTC.
    let s = value.trim().replace(' ', 'T');
    const offset = s.match(/([+-])(\d{2})(?::?(\d{2}))?$/);
    if (offset && offset.index !== undefined) {
      const offsetMinutes = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3] ?? 0));
      const asUtc = new Date(s.slice(0, offset.index) + 'Z');
      return new Date(asUtc.getTime() - offsetMinutes * 60_000).toISOString();
    }
    return new Date(s.endsWith('Z') ? s : s + 'Z').toISOString();
  }
});

// Calendar-date column (DOB, slot date, follow-up...). SQL stores `date`;
// the application layer exchanges plain 'YYYY-MM-DD' strings.
export const dateStr = customType<{ data: string; driverData: string | Date }>({
  dataType: () => 'date',
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string | Date): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value.slice(0, 10);
  }
});

// ---------------------------------------------------------------------------
// DOMAIN MODELS (API contract — unchanged)
// ---------------------------------------------------------------------------

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
  /** Owning portal user (demo kiosk account) — drives record-level access. */
  userId?: string;
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

// ---------------------------------------------------------------------------
// POSTGRESQL SEQUENCES
// Human-readable business identifiers (MK-PAT-2026-000129, A-100, ...) are
// allocated from database sequences so that concurrent registrations can never
// collide or duplicate identifiers (see SEC-001 regression test).
// ---------------------------------------------------------------------------
export const mkPatientIdSeq = pgSequence('mk_patient_id_seq');
export const appointmentNumberSeq = pgSequence('appointment_number_seq');
export const queueTokenNumberSeq = pgSequence('queue_token_number_seq');

// ---------------------------------------------------------------------------
// POSTGRESQL TABLES
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  username: varchar('username', { length: 128 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 512 }).notNull(),
  role: varchar('role', { length: 32 }).$type<UserRole>().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: tstz('created_at').notNull()
});

export const patients = pgTable('patients', {
  id: varchar('id', { length: 64 }).primaryKey(),
  mkPatientId: varchar('mk_patient_id', { length: 64 }).notNull().unique(),
  // Ownership link to the portal user (kiosk demo account). Used to enforce
  // record-level access: a PATIENT token may only read its own record.
  userId: varchar('user_id', { length: 64 }),
  // Direct identifiers are application-encrypted (AES-256-GCM) before they
  // reach PostgreSQL — see server/db/crypto.ts (SEC-004).
  abhaNumber: encryptedText('abha_number').notNull(),
  abhaAddress: encryptedText('abha_address').notNull(),
  name: encryptedText('name').notNull(),
  age: integer('age').notNull(),
  dob: dateStr('dob').notNull(),
  gender: varchar('gender', { length: 16 }).$type<Patient['gender']>().notNull(),
  phone: encryptedText('phone').notNull(),
  address: encryptedText('address').notNull(),
  emergencyContact: encryptedJson<Patient['emergencyContact']>()('emergency_contact').notNull(),
  language: varchar('language', { length: 16 }).notNull(),
  accessibilityNeeds: encryptedJson<string[]>()('accessibility_needs'),
  isDemo: boolean('is_demo').notNull().default(false),
  registeredAt: tstz('registered_at').notNull()
}, (table) => [
  index('patients_user_idx').on(table.userId)
]);

export const consents = pgTable('consents', {
  id: varchar('id', { length: 64 }).primaryKey(),
  patientId: varchar('patient_id', { length: 64 }).notNull().unique(),
  version: varchar('version', { length: 32 }).notNull(),
  purposes: encryptedJson<Consent['purposes']>()('purposes').notNull(),
  status: varchar('status', { length: 32 }).$type<Consent['status']>().notNull(),
  grantedAt: tstz('granted_at').notNull(),
  ipAddress: varchar('ip_address', { length: 64 }).notNull(),
  signatureType: varchar('signature_type', { length: 32 }).$type<Consent['signatureType']>().notNull()
});

export const hospitals = pgTable('hospitals', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  code: varchar('code', { length: 32 }).notNull().unique(),
  type: varchar('type', { length: 32 }).$type<Hospital['type']>().notNull(),
  address: text('address').notNull(),
  phone: varchar('phone', { length: 32 }).notNull(),
  activeOpdCount: integer('active_opd_count').notNull(),
  currentQueueLength: integer('current_queue_length').notNull()
});

export const departments = pgTable('departments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  hospitalId: varchar('hospital_id', { length: 64 }).notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  code: varchar('code', { length: 32 }).notNull(),
  isAyush: boolean('is_ayush').notNull(),
  ayushBranch: varchar('ayush_branch', { length: 32 }).$type<NonNullable<Department['ayushBranch']>>(),
  description: encryptedText('description').notNull(),
  iconName: varchar('icon_name', { length: 64 }).notNull()
});

export const practitioners = pgTable('practitioners', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull(),
  hospitalId: varchar('hospital_id', { length: 64 }).notNull(),
  departmentId: varchar('department_id', { length: 64 }).notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  title: varchar('title', { length: 64 }).notNull(),
  specialty: varchar('specialty', { length: 128 }).notNull(),
  qualifications: varchar('qualifications', { length: 256 }).notNull(),
  roomNumber: varchar('room_number', { length: 32 }).notNull(),
  experienceYears: integer('experience_years').notNull(),
  opdTiming: varchar('opd_timing', { length: 64 }).notNull(),
  isAvailable: boolean('is_available').notNull(),
  avgConsultationMins: integer('avg_consultation_mins').notNull(),
  activeQueueCount: integer('active_queue_count').notNull()
});

export const appointments = pgTable('appointments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  appointmentNumber: varchar('appointment_number', { length: 64 }).notNull().unique(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  practitionerId: varchar('practitioner_id', { length: 64 }).notNull(),
  departmentId: varchar('department_id', { length: 64 }).notNull(),
  hospitalId: varchar('hospital_id', { length: 64 }).notNull(),
  slotDate: dateStr('slot_date').notNull(),
  slotTime: varchar('slot_time', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).$type<Appointment['status']>().notNull(),
  bookedAt: tstz('booked_at').notNull()
}, (table) => [
  index('appointments_patient_idx').on(table.patientId),
  index('appointments_practitioner_idx').on(table.practitionerId)
]);

export const queueTokens = pgTable('queue_tokens', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tokenNumber: varchar('token_number', { length: 32 }).notNull().unique(),
  appointmentId: varchar('appointment_id', { length: 64 }).notNull(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  practitionerId: varchar('practitioner_id', { length: 64 }).notNull(),
  status: varchar('status', { length: 32 }).$type<QueueToken['status']>().notNull(),
  priority: varchar('priority', { length: 16 }).$type<QueueToken['priority']>().notNull(),
  estimatedWaitMins: integer('estimated_wait_mins').notNull(),
  checkInTime: tstz('check_in_time').notNull(),
  calledTime: tstz('called_time'),
  completedTime: tstz('completed_time')
}, (table) => [
  index('queue_tokens_practitioner_status_idx').on(table.practitionerId, table.status)
]);

export const clinicalSessions = pgTable('clinical_sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  appointmentId: varchar('appointment_id', { length: 64 }).notNull(),
  departmentId: varchar('department_id', { length: 64 }).notNull(),
  isAyush: boolean('is_ayush').notNull(),
  status: varchar('status', { length: 32 }).$type<ClinicalSession['status']>().notNull(),
  chiefComplaint: text('chief_complaint').notNull(),
  startedAt: tstz('started_at').notNull(),
  completedAt: tstz('completed_at'),
  redFlagTriggered: boolean('red_flag_triggered').notNull().default(false)
}, (table) => [
  index('clinical_sessions_patient_idx').on(table.patientId)
]);

export const clinicalAnswers = pgTable('clinical_answers', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  questionId: varchar('question_id', { length: 128 }).notNull(),
  questionText: encryptedText('question_text').notNull(),
  answerText: encryptedText('answer_text').notNull(),
  inputMode: varchar('input_mode', { length: 16 }).$type<ClinicalAnswer['inputMode']>().notNull(),
  voiceTranscript: encryptedText('voice_transcript'),
  confidence: doublePrecision('confidence').notNull(),
  redFlagFlagged: boolean('red_flag_flagged').notNull().default(false),
  provenance: varchar('provenance', { length: 32 }).$type<ProvenanceSource>().notNull(),
  timestamp: tstz('timestamp').notNull()
}, (table) => [
  index('clinical_answers_session_idx').on(table.sessionId)
]);

export const ayushAssessments = pgTable('ayush_assessments', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  prakriti: jsonb('prakriti').$type<AyushAssessment['prakriti']>().notNull(),
  vikriti: jsonb('vikriti').$type<AyushAssessment['vikriti']>().notNull(),
  dashavidha: jsonb('dashavidha').$type<AyushAssessment['dashavidha']>().notNull(),
  agni: varchar('agni', { length: 32 }).$type<AyushAssessment['agni']>().notNull(),
  koshtha: varchar('koshtha', { length: 32 }).$type<AyushAssessment['koshtha']>().notNull(),
  ahara: text('ahara').notNull(),
  vihara: text('vihara').notNull(),
  nidana: jsonb('nidana').$type<string[]>().notNull(),
  sampraptiSummary: text('samprapti_summary')
});

export const medicalDocuments = pgTable('medical_documents', {
  id: varchar('id', { length: 64 }).primaryKey(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  fileName: varchar('file_name', { length: 512 }).notNull(),
  fileType: varchar('file_type', { length: 32 }).$type<MedicalDocument['fileType']>().notNull(),
  fileSize: integer('file_size').notNull(),
  fileUrl: text('file_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  uploadedAt: tstz('uploaded_at').notNull(),
  isDemo: boolean('is_demo').notNull().default(false),
  status: varchar('status', { length: 32 }).$type<MedicalDocument['status']>().notNull()
}, (table) => [
  index('medical_documents_patient_idx').on(table.patientId)
]);

export const documentOcrResults = pgTable('document_ocr_results', {
  id: varchar('id', { length: 64 }).primaryKey(),
  documentId: varchar('document_id', { length: 64 }).notNull(),
  rawText: text('raw_text').notNull(),
  confidence: doublePrecision('confidence').notNull(),
  processingTimeMs: integer('processing_time_ms').notNull(),
  extractedAt: tstz('extracted_at').notNull()
});

export const medicalEntities = pgTable('medical_entities', {
  id: varchar('id', { length: 64 }).primaryKey(),
  documentId: varchar('document_id', { length: 64 }),
  sessionId: varchar('session_id', { length: 64 }),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  entityType: varchar('entity_type', { length: 32 }).$type<MedicalEntity['entityType']>().notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  value: varchar('value', { length: 256 }),
  unit: varchar('unit', { length: 64 }),
  dosage: varchar('dosage', { length: 128 }),
  frequency: varchar('frequency', { length: 128 }),
  route: varchar('route', { length: 64 }),
  duration: varchar('duration', { length: 64 }),
  referenceRange: varchar('reference_range', { length: 128 }),
  isAbnormal: boolean('is_abnormal'),
  abnormalDirection: varchar('abnormal_direction', { length: 16 }).$type<NonNullable<MedicalEntity['abnormalDirection']>>(),
  confidence: doublePrecision('confidence').notNull(),
  sourceTextSnippet: encryptedText('source_text_snippet').notNull(),
  provenance: varchar('provenance', { length: 32 }).$type<ProvenanceSource>().notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedByDoctor: varchar('verified_by_doctor', { length: 128 })
}, (table) => [
  index('medical_entities_patient_idx').on(table.patientId),
  index('medical_entities_document_idx').on(table.documentId)
]);

export const timelineEvents = pgTable('timeline_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  date: dateStr('date').notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  category: varchar('category', { length: 32 }).$type<TimelineEvent['category']>().notNull(),
  institution: varchar('institution', { length: 256 }).notNull(),
  description: encryptedText('description').notNull(),
  keyEntities: jsonb('key_entities').$type<string[]>().notNull(),
  documentId: varchar('document_id', { length: 64 }),
  provenance: varchar('provenance', { length: 32 }).$type<ProvenanceSource>().notNull()
}, (table) => [
  index('timeline_events_patient_idx').on(table.patientId)
]);

export const abdmRecords = pgTable('abdm_records', {
  id: varchar('id', { length: 64 }).primaryKey(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  resourceType: varchar('resource_type', { length: 64 }).$type<AbdmRecord['resourceType']>().notNull(),
  fhirJson: encryptedJson<Record<string, any>>()('fhir_json').notNull(),
  hipName: varchar('hip_name', { length: 256 }).notNull(),
  hipId: varchar('hip_id', { length: 128 }).notNull(),
  recordDate: dateStr('record_date').notNull(),
  isSimulated: boolean('is_simulated').notNull()
}, (table) => [
  index('abdm_records_patient_idx').on(table.patientId)
]);

export const aiSummaries = pgTable('ai_summaries', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 32 }).$type<AiSummary['status']>().notNull(),
  patientSnapshot: encryptedText('patient_snapshot').notNull(),
  chiefComplaint: text('chief_complaint').notNull(),
  historyOfPresentIllness: text('history_of_present_illness').notNull(),
  relevantPastHistory: jsonb('relevant_past_history').$type<string[]>().notNull(),
  surgicalHistory: jsonb('surgical_history').$type<string[]>().notNull(),
  medicationHistory: jsonb('medication_history').$type<AiSummary['medicationHistory']>().notNull(),
  allergies: jsonb('allergies').$type<AiSummary['allergies']>().notNull(),
  familyHistory: jsonb('family_history').$type<string[]>().notNull(),
  personalHistory: jsonb('personal_history').$type<AiSummary['personalHistory']>().notNull(),
  reviewOfSystems: jsonb('review_of_systems').$type<Record<string, string>>().notNull(),
  previousInvestigations: jsonb('previous_investigations').$type<AiSummary['previousInvestigations']>().notNull(),
  ayushAssessmentSummary: text('ayush_assessment_summary'),
  redFlagsDetected: jsonb('red_flags_detected').$type<string[]>().notNull(),
  missingInformation: jsonb('missing_information').$type<string[]>().notNull(),
  confidenceOverall: doublePrecision('confidence_overall').notNull(),
  provenanceSummary: jsonb('provenance_summary').$type<AiSummary['provenanceSummary']>().notNull(),
  createdAt: tstz('created_at').notNull(),
  physicianVerifiedAt: tstz('physician_verified_at'),
  verifiedByDoctorId: varchar('verified_by_doctor_id', { length: 128 }),
  doctorNotes: text('doctor_notes')
}, (table) => [
  index('ai_summaries_session_idx').on(table.sessionId)
]);

export const redFlagAlerts = pgTable('red_flag_alerts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  sessionId: varchar('session_id', { length: 64 }).notNull(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  tokenNumber: varchar('token_number', { length: 32 }).notNull(),
  patientName: encryptedText('patient_name').notNull(),
  age: integer('age').notNull(),
  gender: varchar('gender', { length: 16 }).notNull(),
  triggerRule: varchar('trigger_rule', { length: 128 }).notNull(),
  triggerInput: encryptedText('trigger_input').notNull(),
  severity: varchar('severity', { length: 32 }).$type<RedFlagAlert['severity']>().notNull(),
  detectedAt: tstz('detected_at').notNull(),
  status: varchar('status', { length: 32 }).$type<RedFlagAlert['status']>().notNull(),
  acknowledgedBy: varchar('acknowledged_by', { length: 256 }),
  acknowledgedAt: tstz('acknowledged_at'),
  clinicalActionTaken: text('clinical_action_taken')
}, (table) => [
  index('red_flag_alerts_status_idx').on(table.status)
]);

export const consultations = pgTable('consultations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  appointmentId: varchar('appointment_id', { length: 64 }).notNull(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  practitionerId: varchar('practitioner_id', { length: 64 }).notNull(),
  aiSummaryId: varchar('ai_summary_id', { length: 64 }).notNull(),
  clinicalExamination: encryptedJson<Consultation['clinicalExamination']>()('clinical_examination').notNull(),
  assessment: text('assessment').notNull(),
  finalDiagnosis: jsonb('final_diagnosis').$type<Consultation['finalDiagnosis']>().notNull(),
  ayushChikitsaSutra: text('ayush_chikitsa_sutra'),
  followUpDate: dateStr('follow_up_date').notNull(),
  dietLifestyleAdvice: jsonb('diet_lifestyle_advice').$type<string[]>().notNull(),
  status: varchar('status', { length: 32 }).$type<Consultation['status']>().notNull(),
  startedAt: tstz('started_at').notNull(),
  finalizedAt: tstz('finalized_at')
}, (table) => [
  index('consultations_patient_idx').on(table.patientId)
]);

export const prescriptionItems = pgTable('prescription_items', {
  id: varchar('id', { length: 64 }).primaryKey(),
  consultationId: varchar('consultation_id', { length: 64 }).notNull(),
  medicineName: varchar('medicine_name', { length: 256 }).notNull(),
  type: varchar('type', { length: 32 }).$type<PrescriptionItem['type']>().notNull(),
  form: varchar('form', { length: 32 }).$type<PrescriptionItem['form']>().notNull(),
  dosage: varchar('dosage', { length: 128 }).notNull(),
  frequency: varchar('frequency', { length: 128 }).notNull(),
  durationDays: integer('duration_days').notNull(),
  anupana: varchar('anupana', { length: 128 }),
  instructions: text('instructions').notNull()
}, (table) => [
  index('prescription_items_consultation_idx').on(table.consultationId)
]);

export const investigationOrders = pgTable('investigation_orders', {
  id: varchar('id', { length: 64 }).primaryKey(),
  consultationId: varchar('consultation_id', { length: 64 }).notNull(),
  testName: varchar('test_name', { length: 256 }).notNull(),
  category: varchar('category', { length: 32 }).$type<InvestigationOrder['category']>().notNull(),
  priority: varchar('priority', { length: 16 }).$type<InvestigationOrder['priority']>().notNull(),
  instructions: text('instructions').notNull(),
  status: varchar('status', { length: 32 }).$type<InvestigationOrder['status']>().notNull()
});

export const notifications = pgTable('notifications', {
  id: varchar('id', { length: 64 }).primaryKey(),
  patientId: varchar('patient_id', { length: 64 }).notNull(),
  channel: varchar('channel', { length: 16 }).$type<NotificationItem['channel']>().notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  message: encryptedText('message').notNull(),
  timestamp: tstz('timestamp').notNull(),
  status: varchar('status', { length: 32 }).$type<NotificationItem['status']>().notNull()
}, (table) => [
  index('notifications_patient_idx').on(table.patientId)
]);

export const integrationEvents = pgTable('integration_events', {
  id: varchar('id', { length: 64 }).primaryKey(),
  integrationType: varchar('integration_type', { length: 32 }).$type<IntegrationEvent['integrationType']>().notNull(),
  direction: varchar('direction', { length: 16 }).$type<IntegrationEvent['direction']>().notNull(),
  endpoint: text('endpoint').notNull(),
  status: varchar('status', { length: 32 }).$type<IntegrationEvent['status']>().notNull(),
  latencyMs: integer('latency_ms').notNull(),
  payload: jsonb('payload').$type<Record<string, any>>().notNull(),
  response: jsonb('response').$type<Record<string, any>>().notNull(),
  timestamp: tstz('timestamp').notNull()
});

export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  correlationId: varchar('correlation_id', { length: 128 }).notNull(),
  actorId: varchar('actor_id', { length: 128 }).notNull(),
  actorRole: varchar('actor_role', { length: 32 }).$type<UserRole>().notNull(),
  action: varchar('action', { length: 128 }).notNull(),
  resourceType: varchar('resource_type', { length: 64 }).notNull(),
  resourceId: varchar('resource_id', { length: 128 }).notNull(),
  details: jsonb('details').$type<Record<string, any>>().notNull(),
  ipAddress: varchar('ip_address', { length: 64 }).notNull(),
  timestamp: tstz('timestamp').notNull()
}, (table) => [
  index('audit_logs_timestamp_idx').on(table.timestamp)
]);

export const systemHealth = pgTable('system_health', {
  service: varchar('service', { length: 128 }).primaryKey(),
  status: varchar('status', { length: 32 }).$type<SystemHealthStatus['status']>().notNull(),
  latencyMs: integer('latency_ms').notNull(),
  lastCheck: tstz('last_check').notNull(),
  notes: text('notes').notNull()
});
