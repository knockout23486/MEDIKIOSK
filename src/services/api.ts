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

function isAuthEndpoint(input: string): boolean {
  try {
    const pathname = new URL(input, window.location.origin).pathname;
    return pathname.endsWith('/login') || pathname.endsWith('/logout');
  } catch {
    return input.includes('/login') || input.includes('/logout');
  }
}

/**
 * fetch() wrapper that authenticates every request and centrally expires a
 * browser session when the API rejects it. Login/logout responses are exempt
 * so failed credentials and best-effort logout can be handled by their caller.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const response = await fetch(input, { ...init, headers });
  if ((response.status === 401 || response.status === 403) && !isAuthEndpoint(input)) {
    authToken = null;
    localStorage.clear();
    sessionStorage.clear();
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }
  return response;
}

function isErrorPayload(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return payload.success === false || typeof payload.error === 'string' ||
    payload.code === 'FORBIDDEN' || payload.code === 'UNAUTHENTICATED';
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/** Return only genuine list payloads; API error objects can never reach views. */
export async function getList<T>(url: string): Promise<T[]> {
  const payload = await authFetch(url).then(readJson);
  return !isErrorPayload(payload) && Array.isArray(payload) ? payload as T[] : [];
}

/** Return a JSON value, or null for HTTP/API errors and malformed responses. */
export async function getJson<T>(url: string): Promise<T | null> {
  const response = await authFetch(url);
  const payload = await readJson(response);
  if (!response.ok || payload === null || isErrorPayload(payload)) return null;
  return payload as T;
}

const jsonPost = async (url: string, body: unknown): Promise<any> => {
  const response = await authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return readJson(response);
};

export const api = {
  // Auth — credential login ONLY (SEC-006): the API verifies the bcrypt hash
  // for every account; there is no passwordless role login anymore.
  login: (username: string, password: string): Promise<{ success?: boolean; user?: any; token?: string }> =>
    jsonPost('/api/auth/login', { username, password }).then((res: any) => {
      if (res?.token) setAuthToken(res.token);
      return res;
    }),

  /** Revoke the JWT before dropping it locally (SEC-017). */
  logout: async (): Promise<void> => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* network failure — clear locally regardless */
    }
    setAuthToken(null);
  },

  // Patients & ABHA
  getPatients: (): Promise<Patient[]> => getList('/api/patients'),
  getPatient: (id: string): Promise<Patient | null> => getJson(`/api/patients/${id}`),
  createPatient: (data: Partial<Patient>): Promise<Patient> => jsonPost('/api/patients', data),
  verifyAbha: (abhaNumber: string, otp?: string) => jsonPost('/api/abha/verify', { abhaNumber, otp }),

  // Consents
  getConsent: (patientId: string): Promise<Consent | null> => getJson(`/api/consents/${patientId}`),
  grantConsent: (consent: Partial<Consent>): Promise<Consent> => jsonPost('/api/consents', consent),

  // Hospital & Depts
  getHospitals: (): Promise<Hospital[]> => getList('/api/hospitals'),
  getDepartments: (hospitalId?: string): Promise<Department[]> => getList(`/api/departments${hospitalId ? `?hospitalId=${hospitalId}` : ''}`),
  getDoctors: (departmentId?: string, hospitalId?: string): Promise<Practitioner[]> => getList(`/api/doctors?${departmentId ? `departmentId=${departmentId}&` : ''}${hospitalId ? `hospitalId=${hospitalId}` : ''}`),

  // Appointments & Queue
  createAppointment: (data: any) => jsonPost('/api/appointments', data),
  getQueueTokens: (): Promise<QueueToken[]> => getList('/api/queue/tokens'),
  advanceQueue: (practitionerId: string) => jsonPost('/api/queue/advance', { practitionerId }),
  checkInToken: (tokenNumber: string, patientId: string) => jsonPost('/api/queue/checkin', { tokenNumber, patientId }),

  // Clinical History & AYUSH
  getQuestions: (chiefComplaint: string, isAyush: boolean) => jsonPost('/api/clinical/questions', { chiefComplaint, isAyush }),
  createClinicalSession: (data: Partial<ClinicalSession>) => jsonPost('/api/clinical/session', data),
  saveClinicalAnswer: (data: any) => jsonPost('/api/clinical/answer', data),
  saveAyushAssessment: (sessionId: string, answers: Record<string, string>) => jsonPost('/api/clinical/ayush', { sessionId, answers }),

  // Documents & OCR
  getDocuments: (patientId: string): Promise<MedicalDocument[]> => getList(`/api/documents/${patientId}`),
  processDemoDocument: (data: any) => jsonPost('/api/documents/process-demo', data),
  getEntities: (patientId: string): Promise<MedicalEntity[]> => getList(`/api/entities/${patientId}`),
  verifyEntity: (id: string, updates: Partial<MedicalEntity>) => jsonPost(`/api/entities/${id}/verify`, updates),

  // Timeline & ABDM
  getTimeline: (patientId: string): Promise<TimelineEvent[]> => getList(`/api/timeline/${patientId}`),
  getAbdmRecords: (patientId: string): Promise<AbdmRecord[]> => getList(`/api/abdm/records/${patientId}`),
  getFhirBundle: (patientId: string) => getJson(`/api/abdm/fhir/${patientId}`),

  // AI Summary
  getAiSummary: (sessionId: string): Promise<AiSummary | null> => getJson(`/api/ai-summary/${sessionId}`),
  generateAiSummary: (sessionId: string, patientId: string): Promise<AiSummary> => jsonPost('/api/ai-summary/generate', { sessionId, patientId }),
  verifyAiSummary: (id: string, updates: any): Promise<{ success: boolean; summary: AiSummary }> => jsonPost(`/api/ai-summary/${id}/verify`, updates),

  // Triage Alerts
  getTriageAlerts: (): Promise<RedFlagAlert[]> => getList('/api/triage/alerts'),
  acknowledgeAlert: (id: string, actionTaken: string) => jsonPost(`/api/triage/acknowledge/${id}`, { actionTaken }),

  // Consultations
  finalizeConsultation: (id: string, data: any) => jsonPost(`/api/consultations/${id}/finalize`, data),

  // Admin, Audit, Health & Integrations
  getAuditLogs: (): Promise<AuditLog[]> => getList('/api/audit/logs'),
  getSystemHealth: (): Promise<SystemHealthStatus[]> => getList('/api/system/health'),
  getIntegrationEvents: (): Promise<IntegrationEvent[]> => getList('/api/integrations/events'),
  getNotifications: (patientId: string): Promise<NotificationItem[]> => getList(`/api/notifications/${patientId}`),
  resetDemo: () => jsonPost('/api/demo/reset', {}),
  getDemoState: () => getJson('/api/demo/state')
};
