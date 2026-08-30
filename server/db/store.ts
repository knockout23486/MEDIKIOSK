import fs from 'fs';
import path from 'path';
import {
  User, Patient, Consent, Hospital, Department, Practitioner,
  Appointment, QueueToken, ClinicalSession, ClinicalAnswer,
  AyushAssessment, MedicalDocument, DocumentOcrResult, MedicalEntity,
  TimelineEvent, AbdmRecord, AiSummary, RedFlagAlert, Consultation,
  PrescriptionItem, InvestigationOrder, NotificationItem, IntegrationEvent,
  AuditLog, SystemHealthStatus
} from './schema.js';

export interface DatabaseState {
  users: User[];
  patients: Patient[];
  consents: Consent[];
  hospitals: Hospital[];
  departments: Department[];
  practitioners: Practitioner[];
  appointments: Appointment[];
  queueTokens: QueueToken[];
  clinicalSessions: ClinicalSession[];
  clinicalAnswers: ClinicalAnswer[];
  ayushAssessments: AyushAssessment[];
  documents: MedicalDocument[];
  documentOcrResults: DocumentOcrResult[];
  medicalEntities: MedicalEntity[];
  timelineEvents: TimelineEvent[];
  abdmRecords: AbdmRecord[];
  aiSummaries: AiSummary[];
  redFlagAlerts: RedFlagAlert[];
  consultations: Consultation[];
  prescriptions: PrescriptionItem[];
  investigations: InvestigationOrder[];
  notifications: NotificationItem[];
  integrationEvents: IntegrationEvent[];
  auditLogs: AuditLog[];
  systemHealth: SystemHealthStatus[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'medikiosk_db.json');

class DatabaseStore {
  private state: DatabaseState = {
    users: [],
    patients: [],
    consents: [],
    hospitals: [],
    departments: [],
    practitioners: [],
    appointments: [],
    queueTokens: [],
    clinicalSessions: [],
    clinicalAnswers: [],
    ayushAssessments: [],
    documents: [],
    documentOcrResults: [],
    medicalEntities: [],
    timelineEvents: [],
    abdmRecords: [],
    aiSummaries: [],
    redFlagAlerts: [],
    consultations: [],
    prescriptions: [],
    investigations: [],
    notifications: [],
    integrationEvents: [],
    auditLogs: [],
    systemHealth: []
  };

  private listeners: Array<(event: string, data: any) => void> = [];

  constructor() {
    this.ensureDataDir();
    this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load(): boolean {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        return true;
      }
    } catch (err) {
      console.error('Failed to load database from file, using empty state:', err);
    }
    return false;
  }

  public save(): void {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public setState(newState: DatabaseState): void {
    this.state = newState;
    this.save();
    this.broadcast('STATE_RESET', { timestamp: new Date().toISOString() });
  }

  // Real-time Event Subscription for SSE
  public subscribe(listener: (event: string, data: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public broadcast(event: string, data: any): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('Error in event listener:', err);
      }
    }
  }

  // Generic helpers
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const fullLog: AuditLog = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      ...log
    };
    this.state.auditLogs.unshift(fullLog);
    // Keep max 1000 logs
    if (this.state.auditLogs.length > 1000) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 1000);
    }
    this.save();
    return fullLog;
  }

  public addIntegrationEvent(evt: Omit<IntegrationEvent, 'id' | 'timestamp'>): IntegrationEvent {
    const fullEvent: IntegrationEvent = {
      id: 'INT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      ...evt
    };
    this.state.integrationEvents.unshift(fullEvent);
    if (this.state.integrationEvents.length > 500) {
      this.state.integrationEvents = this.state.integrationEvents.slice(0, 500);
    }
    this.save();
    return fullEvent;
  }

  public addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp'>): NotificationItem {
    const fullNotif: NotificationItem = {
      id: 'NOTIF-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      timestamp: new Date().toISOString(),
      ...notification
    };
    this.state.notifications.unshift(fullNotif);
    this.save();
    this.broadcast('NEW_NOTIFICATION', fullNotif);
    return fullNotif;
  }
}

export const db = new DatabaseStore();
