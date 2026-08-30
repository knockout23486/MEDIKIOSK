import {
  Patient, Consent, Hospital, Department, Practitioner,
  Appointment, QueueToken, ClinicalSession, ClinicalAnswer,
  AyushAssessment, MedicalDocument, MedicalEntity, TimelineEvent,
  AbdmRecord, AiSummary, RedFlagAlert, Consultation, PrescriptionItem,
  NotificationItem, AuditLog, SystemHealthStatus, IntegrationEvent
} from '../types/index.js';

const TOKEN_KEY = 'medikiosk.jwt';

/**
 * JWT session token issued by POST /api/auth/login (SEC-003). Attached to
 * every API call as `Authorization: Bearer <token>`.
 */
let authToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return authToken;
}

/** fetch() wrapper that authenticates every request. */
const authFetch = (input: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers || {});
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  return fetch(input, { ...init, headers });
};

const jsonPost = (url: string, body: unknown) =>
  authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json());

export const api = {
  // Auth — credential login ONLY (SEC-006): the API verifies the bcrypt hash
  // for every account; there is no passwordless role login anymore.
  login: (username: string, password: string): Promise<{ success?: boolean; user?: any; token?: string }> =>
    jsonPost('/api/auth/login', { username, password }).then((res: any) => {
      if (res?.token) setAuthToken(res.token);
      return res;
    }),

  /**
   * SEC-017: server-side session termination — revokes the JWT (blocklist)
   * before dropping it locally, so the token is invalid even if extracted
   * from the kiosk afterwards.
   */
  logout: async (): Promise<void> => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* network failure — clear locally regardless */
    }
    setAuthToken(null);
  },

  // Patients & ABHA
  getPatients: (): Promise<Patient[]> => authFetch('/api/patients').then(r => r.json()),
  getPatient: (id: string): Promise<Patient> => authFetch(`/api/patients/${id}`).then(r => r.json()),
  createPatient: (data: Partial<Patient>): Promise<Patient> => jsonPost('/api/patients', data),
  verifyAbha: (abhaNumber: string, otp?: string) => jsonPost('/api/abha/verify', { abhaNumber, otp }),

  // Consents
  getConsent: (patientId: string): Promise<Consent> => authFetch(`/api/consents/${patientId}`).then(r => r.json()),
  grantConsent: (consent: Partial<Consent>): Promise<Consent> => jsonPost('/api/consents', consent),

  // Hospital & Depts
  getHospitals: (): Promise<Hospital[]> => authFetch('/api/hospitals').then(r => r.json()),
  getDepartments: (hospitalId?: string): Promise<Department[]> => authFetch(`/api/departments${hospitalId ? `?hospitalId=${hospitalId}` : ''}`).then(r => r.json()),
  getDoctors: (departmentId?: string, hospitalId?: string): Promise<Practitioner[]> => authFetch(`/api/doctors?${departmentId ? `departmentId=${departmentId}&` : ''}${hospitalId ? `hospitalId=${hospitalId}` : ''}`).then(r => r.json()),

  // Appointments & Queue
  createAppointment: (data: any) => jsonPost('/api/appointments', data),
  getQueueTokens: (): Promise<QueueToken[]> => authFetch('/api/queue/tokens').then(r => r.json()),
  advanceQueue: (practitionerId: string) => jsonPost('/api/queue/advance', { practitionerId }),
  checkInToken: (tokenNumber: string, patientId: string) => jsonPost('/api/queue/checkin', { tokenNumber, patientId }),

  // Clinical History & AYUSH
  getQuestions: (chiefComplaint: string, isAyush: boolean) => jsonPost('/api/clinical/questions', { chiefComplaint, isAyush }),
  createClinicalSession: (data: Partial<ClinicalSession>) => jsonPost('/api/clinical/session', data),
  saveClinicalAnswer: (data: any) => jsonPost('/api/clinical/answer', data),
  saveAyushAssessment: (sessionId: string, answers: Record<string, string>) => jsonPost('/api/clinical/ayush', { sessionId, answers }),

  // Documents & OCR
  getDocuments: (patientId: string): Promise<MedicalDocument[]> => authFetch(`/api/documents/${patientId}`).then(r => r.json()),
  processDemoDocument: (data: any) => jsonPost('/api/documents/process-demo', data),
  getEntities: (patientId: string): Promise<MedicalEntity[]> => authFetch(`/api/entities/${patientId}`).then(r => r.json()),
  verifyEntity: (id: string, updates: Partial<MedicalEntity>) => jsonPost(`/api/entities/${id}/verify`, updates),

  // Timeline & ABDM
  getTimeline: (patientId: string): Promise<TimelineEvent[]> => authFetch(`/api/timeline/${patientId}`).then(r => r.json()),
  getAbdmRecords: (patientId: string): Promise<AbdmRecord[]> => authFetch(`/api/abdm/records/${patientId}`).then(r => r.json()),
  getFhirBundle: (patientId: string) => authFetch(`/api/abdm/fhir/${patientId}`).then(r => r.json()),

  // AI Summary
  getAiSummary: (sessionId: string): Promise<AiSummary | null> => authFetch(`/api/ai-summary/${sessionId}`).then(r => r.json()),
  generateAiSummary: (sessionId: string, patientId: string): Promise<AiSummary> => jsonPost('/api/ai-summary/generate', { sessionId, patientId }),
  verifyAiSummary: (id: string, updates: any): Promise<{ success: boolean; summary: AiSummary }> => jsonPost(`/api/ai-summary/${id}/verify`, updates),

  // Triage Alerts
  getTriageAlerts: (): Promise<RedFlagAlert[]> => authFetch('/api/triage/alerts').then(r => r.json()),
  acknowledgeAlert: (id: string, actionTaken: string) => jsonPost(`/api/triage/acknowledge/${id}`, { actionTaken }),

  // Consultations
  finalizeConsultation: (id: string, data: any) => jsonPost(`/api/consultations/${id}/finalize`, data),

  // Admin, Audit, Health & Integrations
  getAuditLogs: (): Promise<AuditLog[]> => authFetch('/api/audit/logs').then(r => r.json()),
  getSystemHealth: (): Promise<SystemHealthStatus[]> => authFetch('/api/system/health').then(r => r.json()),
  getIntegrationEvents: (): Promise<IntegrationEvent[]> => authFetch('/api/integrations/events').then(r => r.json()),
  getNotifications: (patientId: string): Promise<NotificationItem[]> => authFetch(`/api/notifications/${patientId}`).then(r => r.json()),
  resetDemo: () => authFetch('/api/demo/reset', { method: 'POST' }).then(r => r.json()),
  getDemoState: () => authFetch('/api/demo/state').then(r => r.json())
};
