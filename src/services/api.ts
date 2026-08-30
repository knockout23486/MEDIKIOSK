import {
  Patient, Consent, Hospital, Department, Practitioner,
  Appointment, QueueToken, ClinicalSession, ClinicalAnswer,
  AyushAssessment, MedicalDocument, MedicalEntity, TimelineEvent,
  AbdmRecord, AiSummary, RedFlagAlert, Consultation, PrescriptionItem,
  NotificationItem, AuditLog, SystemHealthStatus, IntegrationEvent
} from '../types/index.js';

export const api = {
  // Auth
  login: (role: string) => fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role })
  }).then(r => r.json()),

  // Patients & ABHA
  getPatients: (): Promise<Patient[]> => fetch('/api/patients').then(r => r.json()),
  getPatient: (id: string): Promise<Patient> => fetch(`/api/patients/${id}`).then(r => r.json()),
  createPatient: (data: Partial<Patient>): Promise<Patient> => fetch('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  verifyAbha: (abhaNumber: string, otp?: string) => fetch('/api/abha/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ abhaNumber, otp })
  }).then(r => r.json()),

  // Consents
  getConsent: (patientId: string): Promise<Consent> => fetch(`/api/consents/${patientId}`).then(r => r.json()),
  grantConsent: (consent: Partial<Consent>): Promise<Consent> => fetch('/api/consents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consent)
  }).then(r => r.json()),

  // Hospital & Depts
  getHospitals: (): Promise<Hospital[]> => fetch('/api/hospitals').then(r => r.json()),
  getDepartments: (hospitalId?: string): Promise<Department[]> => fetch(`/api/departments${hospitalId ? `?hospitalId=${hospitalId}` : ''}`).then(r => r.json()),
  getDoctors: (departmentId?: string, hospitalId?: string): Promise<Practitioner[]> => fetch(`/api/doctors?${departmentId ? `departmentId=${departmentId}&` : ''}${hospitalId ? `hospitalId=${hospitalId}` : ''}`).then(r => r.json()),

  // Appointments & Queue
  createAppointment: (data: any) => fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getQueueTokens: (): Promise<QueueToken[]> => fetch('/api/queue/tokens').then(r => r.json()),
  advanceQueue: (practitionerId: string) => fetch('/api/queue/advance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ practitionerId })
  }).then(r => r.json()),
  checkInToken: (tokenNumber: string, patientId: string) => fetch('/api/queue/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenNumber, patientId })
  }).then(r => r.json()),

  // Clinical History & AYUSH
  getQuestions: (chiefComplaint: string, isAyush: boolean) => fetch('/api/clinical/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chiefComplaint, isAyush })
  }).then(r => r.json()),
  createClinicalSession: (data: Partial<ClinicalSession>) => fetch('/api/clinical/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  saveClinicalAnswer: (data: any) => fetch('/api/clinical/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  saveAyushAssessment: (sessionId: string, answers: Record<string, string>) => fetch('/api/clinical/ayush', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, answers })
  }).then(r => r.json()),

  // Documents & OCR
  getDocuments: (patientId: string): Promise<MedicalDocument[]> => fetch(`/api/documents/${patientId}`).then(r => r.json()),
  processDemoDocument: (data: any) => fetch('/api/documents/process-demo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  getEntities: (patientId: string): Promise<MedicalEntity[]> => fetch(`/api/entities/${patientId}`).then(r => r.json()),
  verifyEntity: (id: string, updates: Partial<MedicalEntity>) => fetch(`/api/entities/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).then(r => r.json()),

  // Timeline & ABDM
  getTimeline: (patientId: string): Promise<TimelineEvent[]> => fetch(`/api/timeline/${patientId}`).then(r => r.json()),
  getAbdmRecords: (patientId: string): Promise<AbdmRecord[]> => fetch(`/api/abdm/records/${patientId}`).then(r => r.json()),
  getFhirBundle: (patientId: string) => fetch(`/api/abdm/fhir/${patientId}`).then(r => r.json()),

  // AI Summary
  getAiSummary: (sessionId: string): Promise<AiSummary | null> => fetch(`/api/ai-summary/${sessionId}`).then(r => r.json()),
  generateAiSummary: (sessionId: string, patientId: string): Promise<AiSummary> => fetch('/api/ai-summary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, patientId })
  }).then(r => r.json()),
  verifyAiSummary: (id: string, updates: any): Promise<{ success: boolean; summary: AiSummary }> => fetch(`/api/ai-summary/${id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  }).then(r => r.json()),

  // Triage Alerts
  getTriageAlerts: (): Promise<RedFlagAlert[]> => fetch('/api/triage/alerts').then(r => r.json()),
  acknowledgeAlert: (id: string, actionTaken: string) => fetch(`/api/triage/acknowledge/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionTaken })
  }).then(r => r.json()),

  // Consultations
  finalizeConsultation: (id: string, data: any) => fetch(`/api/consultations/${id}/finalize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),

  // Admin, Audit, Health & Integrations
  getAuditLogs: (): Promise<AuditLog[]> => fetch('/api/audit/logs').then(r => r.json()),
  getSystemHealth: (): Promise<SystemHealthStatus[]> => fetch('/api/system/health').then(r => r.json()),
  getIntegrationEvents: (): Promise<IntegrationEvent[]> => fetch('/api/integrations/events').then(r => r.json()),
  resetDemo: () => fetch('/api/demo/reset', { method: 'POST' }).then(r => r.json()),
  getDemoState: () => fetch('/api/demo/state').then(r => r.json())
};
