// ============================================================================
// MediKiosk Data Store — Async PostgreSQL Repository (SEC-001 remediation)
// ----------------------------------------------------------------------------
// This module used to hold the entire "database" in memory and sync it to a
// flat on-disk JSON file. That approach had no ACID
// guarantees, no concurrency control, and was unsafe for multi-user OPD load.
//
// It now provides an async repository over PostgreSQL (Drizzle ORM +
// node-postgres connection pool). Every read is a SQL SELECT and every write
// is executed inside a SQL transaction, so:
//   * concurrent kiosk registrations can never corrupt or lose records,
//   * multi-table writes (patient + audit log, appointment + token + SMS...)
//     are atomic — they either fully commit or fully roll back,
//   * business identifiers (MK-PAT-..., APT-..., A-...) are allocated from
//     PostgreSQL sequences, making duplicate IDs impossible under contention.
//
// The in-process broadcast bus below is used ONLY for real-time SSE fan-out;
// it never touches persistence.
// ============================================================================
import { config as loadEnv } from 'dotenv';
loadEnv();

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { and, asc, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import * as t from './schema.js';
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

// ---------------------------------------------------------------------------
// Connection pool + Drizzle instance
// ---------------------------------------------------------------------------

// node-postgres parses SQL `date` values (OID 1082) into local-time Date
// objects, which can shift calendar dates across timezones. Keep them as raw
// 'YYYY-MM-DD' strings — matching the API contract exactly.
pg.types.setTypeParser(1082, (v: string) => v);

export const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://medikiosk:medikiosk@127.0.0.1:5432/medikiosk';

export const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  application_name: 'medikiosk-api'
});

/** Shared Drizzle instance (thin stateless wrapper over the pool). */
export const orm = drizzle(pool);

/** A transaction handle — anything that can run scoped SQL statements. */
export type Tx = Parameters<Parameters<typeof orm.transaction>[0]>[0];

async function runInTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return orm.transaction(async (tx) => fn(tx as Tx));
}
export { runInTransaction };

// ---------------------------------------------------------------------------
// Row <-> domain mapping helpers
// ---------------------------------------------------------------------------

/**
 * Converts a SQL row into the API domain shape: SQL NULLs become absent keys,
 * so serialized JSON stays identical to the legacy contract (optional fields
 * simply disappear instead of appearing as `null`).
 */
function toDomain<T>(row: Record<string, unknown> | object): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out as T;
}

function toDomainList<T>(rows: Array<Record<string, unknown> | object>): T[] {
  return rows.map((r) => toDomain<T>(r));
}

/** Random, collision-tolerant row id in the legacy 'PREFIX-XXXXXXX' style. */
export function genId(prefix: string): string {
  return prefix + Math.random().toString(36).substring(2, 9).toUpperCase();
}

const now = () => new Date().toISOString();

/** Allocate the next value of a PostgreSQL business-identifier sequence. */
async function nextSeq(exec: Tx, name: string): Promise<number> {
  const res = await exec.execute(sql.raw(`SELECT nextval('${name}') AS seq`));
  return Number((res.rows as Record<string, unknown>[])[0].seq);
}

export interface AuditLogInput extends Omit<AuditLog, 'id' | 'timestamp'> {}
export interface NotificationInput extends Omit<NotificationItem, 'id' | 'timestamp'> {}
export interface IntegrationEventInput extends Omit<IntegrationEvent, 'id' | 'timestamp'> {}

async function insertAuditLog(exec: any, input: AuditLogInput): Promise<AuditLog> {
  const full: AuditLog = { id: genId('AUD-'), timestamp: now(), ...input };
  await exec.insert(t.auditLogs).values(full);
  return full;
}

// ---------------------------------------------------------------------------
// The repository
// ---------------------------------------------------------------------------

export const db = {
  // ---- infrastructure ----------------------------------------------------
  pool,

  /** Verifies connectivity and reports server version + round-trip latency. */
  async ping(): Promise<{ ok: boolean; latencyMs: number; serverVersion?: string; error?: string }> {
    const started = Date.now();
    try {
      const res = await pool.query('SELECT version() AS v');
      return { ok: true, latencyMs: Date.now() - started, serverVersion: res.rows[0].v.split(' ')[1] };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - started, error: err.message };
    }
  },

  /**
   * Applies committed SQL migrations from ./drizzle and makes sure the
   * business-identifier sequences exist (idempotent).
   */
  async migrate(): Promise<void> {
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
    if (!fs.existsSync(migrationsFolder)) {
      throw new Error(
        `Migrations folder not found at ${migrationsFolder}. Run \`npm run db:generate\` first.`
      );
    }
    await migrate(orm as never, { migrationsFolder });
    // Sequences backing business identifiers (no-op if migrations created them).
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS mk_patient_id_seq START 129`);
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS appointment_number_seq START 100`);
    await pool.query(`CREATE SEQUENCE IF NOT EXISTS queue_token_number_seq START 100`);
  },

  async close(): Promise<void> {
    await pool.end();
  },

  /** Run any unit of work inside a single SQL transaction. */
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return runInTransaction(fn);
  },

  /** Full snapshot of every table (demo control center). Reads happen in SQL. */
  async snapshot(): Promise<DatabaseState> {
    const [
      users, patients, consents, hospitals, departments, practitioners,
      appointments, queueTokens, clinicalSessions, clinicalAnswers,
      ayushAssessments, documents, documentOcrResults, medicalEntities,
      timelineEvents, abdmRecords, aiSummaries, redFlagAlerts,
      consultations, prescriptions, investigations, notifications,
      integrationEvents, auditLogsRows, systemHealthRows
    ] = await Promise.all([
      orm.select().from(t.users),
      orm.select().from(t.patients),
      orm.select().from(t.consents),
      orm.select().from(t.hospitals),
      orm.select().from(t.departments),
      orm.select().from(t.practitioners),
      orm.select().from(t.appointments).orderBy(desc(t.appointments.bookedAt)),
      orm.select().from(t.queueTokens),
      orm.select().from(t.clinicalSessions),
      orm.select().from(t.clinicalAnswers),
      orm.select().from(t.ayushAssessments),
      orm.select().from(t.medicalDocuments),
      orm.select().from(t.documentOcrResults),
      orm.select().from(t.medicalEntities),
      orm.select().from(t.timelineEvents),
      orm.select().from(t.abdmRecords),
      orm.select().from(t.aiSummaries),
      orm.select().from(t.redFlagAlerts),
      orm.select().from(t.consultations),
      orm.select().from(t.prescriptionItems),
      orm.select().from(t.investigationOrders),
      orm.select().from(t.notifications).orderBy(desc(t.notifications.timestamp)),
      orm.select().from(t.integrationEvents).orderBy(desc(t.integrationEvents.timestamp)).limit(500),
      orm.select().from(t.auditLogs).orderBy(desc(t.auditLogs.timestamp)).limit(1000),
      orm.select().from(t.systemHealth)
    ]);
    return {
      users: toDomainList<User>(users),
      patients: toDomainList<Patient>(patients),
      consents: toDomainList<Consent>(consents),
      hospitals: toDomainList<Hospital>(hospitals),
      departments: toDomainList<Department>(departments),
      practitioners: toDomainList<Practitioner>(practitioners),
      appointments: toDomainList<Appointment>(appointments),
      queueTokens: toDomainList<QueueToken>(queueTokens),
      clinicalSessions: toDomainList<ClinicalSession>(clinicalSessions),
      clinicalAnswers: toDomainList<ClinicalAnswer>(clinicalAnswers),
      ayushAssessments: toDomainList<AyushAssessment>(ayushAssessments),
      documents: toDomainList<MedicalDocument>(documents),
      documentOcrResults: toDomainList<DocumentOcrResult>(documentOcrResults),
      medicalEntities: toDomainList<MedicalEntity>(medicalEntities),
      timelineEvents: toDomainList<TimelineEvent>(timelineEvents),
      abdmRecords: toDomainList<AbdmRecord>(abdmRecords),
      aiSummaries: toDomainList<AiSummary>(aiSummaries),
      redFlagAlerts: toDomainList<RedFlagAlert>(redFlagAlerts),
      consultations: toDomainList<Consultation>(consultations),
      prescriptions: toDomainList<PrescriptionItem>(prescriptions),
      investigations: toDomainList<InvestigationOrder>(investigations),
      notifications: toDomainList<NotificationItem>(notifications),
      integrationEvents: toDomainList<IntegrationEvent>(integrationEvents),
      auditLogs: toDomainList<AuditLog>(auditLogsRows),
      systemHealth: toDomainList<SystemHealthStatus>(systemHealthRows)
    };
  },

  // ---- real-time SSE bus (in-memory only; unrelated to persistence) -------
  listeners: [] as Array<(event: string, data: any) => void>,
  subscribe(listener: (event: string, data: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  },
  broadcast(event: string, data: any): void {
    for (const listener of [...this.listeners]) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('[SSE] listener error:', err);
      }
    }
  },

  // ---- cross-cutting write helpers ----------------------------------------
  /** Writes an immutable audit trail entry (its own committed transaction). */
  async addAuditLog(log: AuditLogInput): Promise<AuditLog> {
    return runInTransaction((tx) => insertAuditLog(tx, log));
  },

  /** Persists a notification and fans it out over SSE. */
  async addNotification(input: NotificationInput): Promise<NotificationItem> {
    const full: NotificationItem = { id: genId('NOTIF-'), timestamp: now(), ...input };
    await runInTransaction(async (tx) => {
      await tx.insert(t.notifications).values(full);
    });
    this.broadcast('NEW_NOTIFICATION', full);
    return full;
  },

  /** Persists an external integration roundtrip (ABDM / HIS / OCR / speech). */
  async addIntegrationEvent(input: IntegrationEventInput): Promise<IntegrationEvent> {
    const full: IntegrationEvent = { id: genId('INT-'), timestamp: now(), ...input };
    await runInTransaction(async (tx) => {
      await tx.insert(t.integrationEvents).values(full);
    });
    return full;
  },

  // ---- users ---------------------------------------------------------------
  users: {
    async list(): Promise<User[]> {
      return toDomainList<User>(await orm.select().from(t.users));
    },
    /** Demo-login lookup by username OR requested role (parity with legacy). */
    async findByLogin(username?: string, role?: string): Promise<User | undefined> {
      const conditions: SQL[] = [];
      if (username) conditions.push(eq(t.users.username, username));
      if (role) conditions.push(eq(t.users.role, role as User['role']));
      if (conditions.length === 0) return undefined;
      const rows = await orm
        .select()
        .from(t.users)
        .where(or(...conditions))
        // Exact username match wins; otherwise the first-seeded user of the
        // requested role (deterministic across restarts).
        .orderBy(sql`CASE WHEN ${t.users.username} = ${username ?? ''} THEN 0 ELSE 1 END`, t.users.createdAt)
        .limit(1);
      return rows[0] ? toDomain<User>(rows[0]) : undefined;
    }
  },

  // ---- patients --------------------------------------------------------------
  patients: {
    async list(): Promise<Patient[]> {
      return toDomainList<Patient>(
        await orm.select().from(t.patients).orderBy(asc(t.patients.registeredAt))
      );
    },

    async get(idOrMkPatientId: string): Promise<(Patient & { userId?: string | null }) | undefined> {
      const rows = await orm
        .select()
        .from(t.patients)
        .where(or(eq(t.patients.id, idOrMkPatientId), eq(t.patients.mkPatientId, idOrMkPatientId)))
        .limit(1);
      return rows[0] ? toDomain<Patient>(rows[0]) : undefined;
    },

    async count(): Promise<number> {
      const res = await pool.query('SELECT COUNT(*)::int AS n FROM patients');
      return res.rows[0].n;
    },

    /**
     * Registers a patient. The patient row, its sequence-allocated
     * MK-PAT id and the DPDP audit log are inserted in ONE SQL transaction —
     * safe under any number of concurrent kiosk registrations.
     */
    async register(
      input: Partial<Patient>,
      options: { ipAddress?: string } = {}
    ): Promise<Patient> {
      return runInTransaction(async (tx) => {
        const seq = await nextSeq(tx, 'mk_patient_id_seq');
        // Server-generated identifiers always win over client input.
        const {
          id: _id, mkPatientId: _mk, registeredAt: _reg, userId: _uid, ...safeInput
        } = input as any;
        const patient: Patient = {
          id: genId('PAT-'),
          mkPatientId: `MK-PAT-2026-${String(seq).padStart(6, '0')}`,
          registeredAt: now(),
          isDemo: true,
          abhaNumber: '',
          abhaAddress: '',
          name: '',
          age: 0,
          dob: '1980-01-01',
          gender: 'OTHER',
          phone: '',
          address: '',
          emergencyContact: { name: '', relationship: '', phone: '' },
          language: 'en',
          ...safeInput
        };
        await tx.insert(t.patients).values(patient);
        await insertAuditLog(tx, {
          correlationId: 'PAT-REG',
          actorId: patient.id,
          actorRole: 'PATIENT',
          action: 'PATIENT_REGISTERED',
          resourceType: 'PATIENT',
          resourceId: patient.id,
          details: { mkPatientId: patient.mkPatientId, name: patient.name },
          ipAddress: options.ipAddress || '127.0.0.1'
        });
        return toDomain<Patient>(patient);
      });
    }
  },

  // ---- consents ---------------------------------------------------------------
  consents: {
    async get(patientId: string): Promise<Consent | null> {
      const rows = await orm.select().from(t.consents).where(eq(t.consents.patientId, patientId)).limit(1);
      return rows[0] ? toDomain<Consent>(rows[0]) : null;
    },

    /** Creates or replaces the patient's DPDP consent atomically (upsert). */
    async grant(input: Partial<Consent>, options: { ipAddress?: string } = {}): Promise<Consent> {
      const consent: Consent = {
        id: genId('CNS-'),
        version: 'v2.4-DPDP-2026',
        status: 'ACTIVE',
        grantedAt: now(),
        ipAddress: options.ipAddress || '192.168.1.104 (Kiosk)',
        signatureType: 'ELECTRONIC_DEMO',
        patientId: '',
        purposes: {
          personalInfo: false,
          clinicalHistory: false,
          voiceRecording: false,
          ocrDocuments: false,
          aiSummary: false,
          abdmDataExchange: false
        },
        ...input
      };
      await runInTransaction(async (tx) => {
        await tx
          .insert(t.consents)
          .values(consent)
          .onConflictDoUpdate({ target: t.consents.patientId, set: consent });
        await insertAuditLog(tx, {
          correlationId: 'CONSENT-GRANT',
          actorId: consent.patientId,
          actorRole: 'PATIENT',
          action: 'DPDP_CONSENT_GRANTED',
          resourceType: 'CONSENT',
          resourceId: consent.id,
          details: consent.purposes,
          ipAddress: options.ipAddress || '127.0.0.1'
        });
      });
      return consent;
    }
  },

  // ---- hospitals / departments / practitioners ------------------------------
  reference: {
    async hospitals(): Promise<Hospital[]> {
      return toDomainList<Hospital>(await orm.select().from(t.hospitals));
    },
    async departments(hospitalId?: string): Promise<Department[]> {
      const query = orm.select().from(t.departments);
      const rows = hospitalId
        ? await query.where(eq(t.departments.hospitalId, hospitalId))
        : await query;
      return toDomainList<Department>(rows);
    },
    async practitioners(filter: { departmentId?: string; hospitalId?: string } = {}): Promise<Practitioner[]> {
      const conditions: SQL[] = [];
      if (filter.departmentId) conditions.push(eq(t.practitioners.departmentId, filter.departmentId));
      if (filter.hospitalId) conditions.push(eq(t.practitioners.hospitalId, filter.hospitalId));
      const query = orm.select().from(t.practitioners);
      const rows = conditions.length ? await query.where(and(...conditions)) : await query;
      return toDomainList<Practitioner>(rows);
    }
  },

  // ---- appointments & queue ---------------------------------------------------
  appointments: {
    async list(): Promise<Appointment[]> {
      return toDomainList<Appointment>(
        await orm.select().from(t.appointments).orderBy(desc(t.appointments.bookedAt))
      );
    },

    /**
     * Books an appointment and everything that must exist with it — the queue
     * token (sequence-numbered), the SMS confirmation notification and the
     * audit log — inside a single SQL transaction.
     */
    async book(
      input: Partial<Appointment>,
      options: { ipAddress?: string } = {}
    ): Promise<{ appointment: Appointment; token: QueueToken }> {
      return runInTransaction(async (tx) => {
        const aptSeq = await nextSeq(tx, 'appointment_number_seq');
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        // Server-generated identifiers always win over client input.
        const { id: _id, appointmentNumber: _num, bookedAt: _booked, ...safeInput } = input as any;
        const appointment: Appointment = {
          id: genId('APT-'),
          appointmentNumber: `APT-${datePart}-${String(aptSeq).padStart(3, '0')}`,
          bookedAt: now(),
          status: 'BOOKED',
          patientId: '',
          practitionerId: '',
          departmentId: '',
          hospitalId: '',
          slotDate: new Date().toISOString().slice(0, 10),
          slotTime: '',
          ...safeInput
        };
        await tx.insert(t.appointments).values(appointment);

        // Queue token — sequence number + wait time computed from live queue.
        const token = await db.queue.issueToken(
          tx,
          appointment.patientId,
          appointment.id,
          appointment.practitionerId
        );

        await tx.insert(t.notifications).values({
          id: genId('NOTIF-'),
          patientId: appointment.patientId,
          channel: 'SMS',
          title: 'Appointment Confirmed',
          message: `Your appointment is confirmed. Token: ${token.tokenNumber}. Approx wait: ${token.estimatedWaitMins} mins.`,
          timestamp: now(),
          status: 'DELIVERED'
        });

        await insertAuditLog(tx, {
          correlationId: 'APT-BOOK',
          actorId: appointment.patientId,
          actorRole: 'PATIENT',
          action: 'APPOINTMENT_BOOKED',
          resourceType: 'APPOINTMENT',
          resourceId: appointment.id,
          details: {
            appointmentNumber: appointment.appointmentNumber,
            tokenNumber: token.tokenNumber
          },
          ipAddress: options.ipAddress || '127.0.0.1'
        });

        return {
          appointment: toDomain<Appointment>(appointment),
          token: toDomain<QueueToken>(token)
        };
      }).then((result) => {
        db.broadcast('QUEUE_UPDATED', { token: result.token });
        return result;
      });
    }
  },

  queue: {
    async tokens(): Promise<QueueToken[]> {
      return toDomainList<QueueToken>(await orm.select().from(t.queueTokens));
    },

    /** Kiosk check-in: single atomic UPDATE ... RETURNING. */
    async checkIn(tokenNumber?: string, patientId?: string): Promise<QueueToken | null> {
      const conditions: SQL[] = [];
      if (tokenNumber) conditions.push(eq(t.queueTokens.tokenNumber, tokenNumber));
      if (patientId) conditions.push(eq(t.queueTokens.patientId, patientId));
      if (!conditions.length) return null;
      const updated = await orm
        .update(t.queueTokens)
        .set({ status: 'WAITING', checkInTime: now() })
        .where(or(...conditions))
        .returning();
      const token = updated[0] ? toDomain<QueueToken>(updated[0]) : null;
      if (token) db.broadcast('QUEUE_CHECKIN', token);
      return token;
    },

    /**
     * Issues an OPD queue token on a transaction handle. The token number is
     * allocated from a PostgreSQL sequence and the wait estimate is computed
     * from the live queue — safe under concurrent bookings.
     */
    async issueToken(
      tx: Tx,
      patientId: string,
      appointmentId: string,
      practitionerId: string
    ): Promise<QueueToken> {
      const tokenSeq = await nextSeq(tx, 'queue_token_number_seq');
      const waiting = await tx
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(t.queueTokens)
        .where(
          and(
            eq(t.queueTokens.practitionerId, practitionerId),
            eq(t.queueTokens.status, 'WAITING')
          )
        );
      const token: QueueToken = {
        id: genId('TOK-'),
        tokenNumber: `A-${String(tokenSeq).padStart(3, '0')}`,
        appointmentId,
        patientId,
        practitionerId,
        status: 'WAITING',
        priority: 'NORMAL',
        estimatedWaitMins: ((waiting[0]?.n ?? 0) + 1) * 12,
        checkInTime: now()
      };
      await tx.insert(t.queueTokens).values(token);
      return toDomain<QueueToken>(token);
    },

    /**
     * Standalone, idempotent token issue (e.g. re-issuing for an existing
     * appointment): returns the existing token when one is already bound.
     */
    async ensureToken(
      patientId: string,
      appointmentId: string,
      practitionerId: string
    ): Promise<QueueToken> {
      const existing = (await this.tokens()).find((tk) => tk.appointmentId === appointmentId);
      if (existing) return existing;
      const token = await runInTransaction((tx) => this.issueToken(tx, patientId, appointmentId, practitionerId));
      db.broadcast('QUEUE_UPDATED', { token });
      return token;
    },

    /**
     * Advances the OPD queue for a practitioner. Candidate rows are locked
     * with SELECT ... FOR UPDATE so two triage desks advancing the same queue
     * concurrently can never call the same patient twice.
     */
    async advance(practitionerId: string): Promise<QueueToken | null> {
      const result = await runInTransaction(async (tx) => {
        // Complete whoever is currently with the doctor.
        await tx
          .update(t.queueTokens)
          .set({ status: 'COMPLETED', completedTime: now() })
          .where(
            and(
              eq(t.queueTokens.practitionerId, practitionerId),
              eq(t.queueTokens.status, 'WITH_DOCTOR')
            )
          );

        // Deterministic lock order: urgent triage first, then FIFO by check-in.
        const candidates = await tx
          .select()
          .from(t.queueTokens)
          .where(
            and(
              eq(t.queueTokens.practitionerId, practitionerId),
              or(eq(t.queueTokens.status, 'TRIAGE_URGENT'), eq(t.queueTokens.status, 'WAITING'))
            )
          )
          .orderBy(
            sql`CASE WHEN ${t.queueTokens.status} = 'TRIAGE_URGENT' THEN 0 ELSE 1 END`,
            asc(t.queueTokens.checkInTime)
          )
          .for('update');

        const nextRow = candidates[0];
        if (!nextRow) return null;

        const called = await tx
          .update(t.queueTokens)
          .set({ status: 'WITH_DOCTOR', calledTime: now(), estimatedWaitMins: 0 })
          .where(eq(t.queueTokens.id, nextRow.id))
          .returning();

        // Refresh wait estimates for everyone still waiting.
        const remaining = await tx
          .select()
          .from(t.queueTokens)
          .where(
            and(
              eq(t.queueTokens.practitionerId, practitionerId),
              eq(t.queueTokens.status, 'WAITING')
            )
          )
          .orderBy(asc(t.queueTokens.checkInTime));
        for (const [idx, row] of remaining.entries()) {
          await tx
            .update(t.queueTokens)
            .set({ estimatedWaitMins: (idx + 1) * 10 })
            .where(eq(t.queueTokens.id, row.id));
        }
        return called[0] ? toDomain<QueueToken>(called[0]) : null;
      });
      db.broadcast('QUEUE_ADVANCED', { currentDoctor: practitionerId, activeToken: result });
      return result;
    }
  },

  // ---- clinical intake ----------------------------------------------------------
  clinical: {
    async createSession(input: Partial<ClinicalSession>): Promise<ClinicalSession> {
      const session: ClinicalSession = {
        id: genId('SES-'),
        startedAt: now(),
        status: 'IN_PROGRESS',
        redFlagTriggered: false,
        patientId: '',
        appointmentId: '',
        departmentId: '',
        isAyush: false,
        chiefComplaint: '',
        ...input
      };
      await runInTransaction(async (tx) => {
        await tx.insert(t.clinicalSessions).values(session);
      });
      return session;
    },

    async getSession(id: string): Promise<ClinicalSession | undefined> {
      const rows = await orm.select().from(t.clinicalSessions).where(eq(t.clinicalSessions.id, id)).limit(1);
      return rows[0] ? toDomain<ClinicalSession>(rows[0]) : undefined;
    },

    async addAnswer(answer: ClinicalAnswer): Promise<ClinicalAnswer> {
      await runInTransaction(async (tx) => {
        await tx.insert(t.clinicalAnswers).values(answer);
      });
      return answer;
    },

    async answersBySession(sessionId: string): Promise<ClinicalAnswer[]> {
      return toDomainList<ClinicalAnswer>(
        await orm
          .select()
          .from(t.clinicalAnswers)
          .where(eq(t.clinicalAnswers.sessionId, sessionId))
          .orderBy(asc(t.clinicalAnswers.timestamp))
      );
    },

    async saveAyushAssessment(assessment: AyushAssessment): Promise<AyushAssessment> {
      await runInTransaction(async (tx) => {
        await tx.insert(t.ayushAssessments).values(assessment);
      });
      return assessment;
    },

    async ayushBySession(sessionId: string): Promise<AyushAssessment | undefined> {
      const rows = await orm
        .select()
        .from(t.ayushAssessments)
        .where(eq(t.ayushAssessments.sessionId, sessionId))
        .limit(1);
      return rows[0] ? toDomain<AyushAssessment>(rows[0]) : undefined;
    }
  },

  // ---- documents & OCR ----------------------------------------------------------
  documents: {
    async listByPatient(patientId: string): Promise<MedicalDocument[]> {
      return toDomainList<MedicalDocument>(
        await orm.select().from(t.medicalDocuments).where(eq(t.medicalDocuments.patientId, patientId))
      );
    },

    /**
     * Persists an OCR result and its extracted medical entities atomically —
     * a document is never left "half-processed" if the process dies midway.
     */
    async saveOcrPipeline(
      ocrResult: DocumentOcrResult,
      entities: MedicalEntity[],
      audit: { documentId: string; entitiesCount: number; confidence: number; ipAddress?: string }
    ): Promise<void> {
      await runInTransaction(async (tx) => {
        await tx.insert(t.documentOcrResults).values(ocrResult);
        if (entities.length > 0) {
          await tx.insert(t.medicalEntities).values(entities);
        }
        await insertAuditLog(tx, {
          correlationId: 'OCR-PROC',
          actorId: 'AI_OCR_ENGINE',
          actorRole: 'SYSTEM_ADMIN',
          action: 'DOCUMENT_OCR_PROCESSED',
          resourceType: 'DOCUMENT',
          resourceId: audit.documentId,
          details: { entitiesCount: audit.entitiesCount, confidence: audit.confidence },
          ipAddress: audit.ipAddress || '127.0.0.1'
        });
      });
    },

    async entitiesByPatient(patientId: string): Promise<MedicalEntity[]> {
      return toDomainList<MedicalEntity>(
        await orm.select().from(t.medicalEntities).where(eq(t.medicalEntities.patientId, patientId))
      );
    },

    async verifyEntity(
      id: string,
      patch: { name?: string; value?: string; verifiedByDoctor?: string }
    ): Promise<MedicalEntity | null> {
      const updated = await orm
        .update(t.medicalEntities)
        .set({ isVerified: true, ...patch })
        .where(eq(t.medicalEntities.id, id))
        .returning();
      return updated[0] ? toDomain<MedicalEntity>(updated[0]) : null;
    }
  },

  // ---- timeline / ABDM ------------------------------------------------------------
  timeline: {
    async byPatient(patientId: string): Promise<TimelineEvent[]> {
      return toDomainList<TimelineEvent>(
        await orm
          .select()
          .from(t.timelineEvents)
          .where(eq(t.timelineEvents.patientId, patientId))
          .orderBy(desc(t.timelineEvents.date))
      );
    }
  },

  abdm: {
    async recordsByPatient(patientId: string): Promise<AbdmRecord[]> {
      return toDomainList<AbdmRecord>(
        await orm.select().from(t.abdmRecords).where(eq(t.abdmRecords.patientId, patientId))
      );
    }
  },

  // ---- AI summaries -----------------------------------------------------------------
  summaries: {
    async bySession(sessionId: string): Promise<AiSummary | null> {
      const rows = await orm.select().from(t.aiSummaries).where(eq(t.aiSummaries.sessionId, sessionId)).limit(1);
      return rows[0] ? toDomain<AiSummary>(rows[0]) : null;
    },

    /** Inserts a DRAFT_AI summary plus its audit entry in one transaction. */
    async create(summary: AiSummary): Promise<AiSummary> {
      await runInTransaction(async (tx) => {
        await tx.insert(t.aiSummaries).values(summary);
        await insertAuditLog(tx, {
          correlationId: 'CORR-SUM-' + summary.id,
          actorId: 'CLINICAL_SUMMARY_ENGINE',
          actorRole: 'SYSTEM_ADMIN',
          action: 'AI_STRUCTURED_SUMMARY_GENERATED',
          resourceType: 'AI_SUMMARY',
          resourceId: summary.id,
          details: { version: summary.version, status: summary.status, confidence: summary.confidenceOverall },
          ipAddress: '127.0.0.1'
        });
      });
      return summary;
    },

    /** Physician verification bump — update + audit entry atomically. */
    async verify(
      id: string,
      patch: {
        doctorId?: string;
        doctorNotes?: string;
        chiefComplaint?: string;
        historyOfPresentIllness?: string;
      }
    ): Promise<AiSummary | null> {
      return runInTransaction(async (tx) => {
        const existing = await tx.select().from(t.aiSummaries).where(eq(t.aiSummaries.id, id)).limit(1);
        const row = existing[0];
        if (!row) return null;

        const verified = await tx
          .update(t.aiSummaries)
          .set({
            status: 'PHYSICIAN_VERIFIED',
            version: (row.version ?? 1) + 1,
            physicianVerifiedAt: now(),
            verifiedByDoctorId: patch.doctorId || 'USR-DOC-01',
            doctorNotes: patch.doctorNotes || 'Physician review complete. History confirmed with patient.',
            ...(patch.chiefComplaint ? { chiefComplaint: patch.chiefComplaint } : {}),
            ...(patch.historyOfPresentIllness
              ? { historyOfPresentIllness: patch.historyOfPresentIllness }
              : {})
          })
          .where(eq(t.aiSummaries.id, id))
          .returning();

        await insertAuditLog(tx, {
          correlationId: 'SUM-VERIFY',
          actorId: patch.doctorId || 'USR-DOC-01',
          actorRole: 'DOCTOR',
          action: 'PHYSICIAN_VERIFIED_AI_SUMMARY',
          resourceType: 'AI_SUMMARY',
          resourceId: id,
          details: {
            version: (row.version ?? 1) + 1,
            notes: patch.doctorNotes || 'Physician review complete. History confirmed with patient.'
          },
          ipAddress: '127.0.0.1'
        });
        return verified[0] ? toDomain<AiSummary>(verified[0]) : null;
      });
    }
  },

  // ---- red-flag safety engine ---------------------------------------------------------
  alerts: {
    async list(): Promise<RedFlagAlert[]> {
      return toDomainList<RedFlagAlert>(
        await orm.select().from(t.redFlagAlerts).orderBy(desc(t.redFlagAlerts.detectedAt))
      );
    },

    /**
     * Raises an emergency red-flag: alert insert + queue priority escalation +
     * audit log in one transaction, then a real-time SSE broadcast.
     */
    async raise(alert: RedFlagAlert): Promise<RedFlagAlert> {
      await runInTransaction(async (tx) => {
        await tx.insert(t.redFlagAlerts).values(alert);
        await tx
          .update(t.queueTokens)
          .set({ priority: 'EMERGENCY', status: 'TRIAGE_URGENT', estimatedWaitMins: 1 })
          .where(eq(t.queueTokens.patientId, alert.patientId));
        await insertAuditLog(tx, {
          correlationId: 'CORR-RFA-' + alert.id,
          actorId: 'RED_FLAG_SAFETY_ENGINE',
          actorRole: 'SYSTEM_ADMIN',
          action: 'EMERGENCY_RED_FLAG_TRIGGERED',
          resourceType: 'RED_FLAG_ALERT',
          resourceId: alert.id,
          details: { ruleId: alert.triggerRule, severity: alert.severity, triggerInput: alert.triggerInput },
          ipAddress: '127.0.0.1'
        });
      });
      db.broadcast('RED_FLAG_TRIGGERED', alert);
      return alert;
    },

    async acknowledge(
      id: string,
      patch: { acknowledgedBy?: string; actionTaken?: string }
    ): Promise<RedFlagAlert | null> {
      const updated = await orm
        .update(t.redFlagAlerts)
        .set({
          status: 'ACKNOWLEDGED',
          acknowledgedBy: patch.acknowledgedBy || 'Sister Suniti Rao (Triage Nurse)',
          acknowledgedAt: now(),
          clinicalActionTaken: patch.actionTaken || 'Patient prioritized in queue. Vitals checked.'
        })
        .where(eq(t.redFlagAlerts.id, id))
        .returning();
      const alert = updated[0] ? toDomain<RedFlagAlert>(updated[0]) : null;
      if (alert) db.broadcast('TRIAGE_ACKNOWLEDGED', alert);
      return alert;
    }
  },

  // ---- consultations -------------------------------------------------------------------
  consultations: {
    async byPatient(patientId: string): Promise<Consultation[]> {
      return toDomainList<Consultation>(
        await orm.select().from(t.consultations).where(eq(t.consultations.patientId, patientId))
      );
    },

    async create(input: Partial<Consultation>): Promise<Consultation> {
      const consultation: Consultation = {
        id: genId('CON-'),
        startedAt: now(),
        status: 'IN_PROGRESS',
        appointmentId: '',
        patientId: '',
        practitionerId: '',
        aiSummaryId: '',
        clinicalExamination: {
          generalAppearance: '',
          vitals: { bp: '', pulse: '', temp: '', spo2: '', respRate: '' },
          systemicExam: ''
        },
        assessment: '',
        finalDiagnosis: [],
        followUpDate: new Date().toISOString().slice(0, 10),
        dietLifestyleAdvice: [],
        ...input
      } as Consultation;
      await runInTransaction(async (tx) => {
        await tx.insert(t.consultations).values(consultation);
      });
      return consultation;
    },

    /**
     * Finalizes a consultation: consultation upsert + all prescription items +
     * audit log commit atomically. (The HIS EMR sync happens after commit so an
     * external outage can never roll back clinical data.)
     */
    async finalize(
      consultation: Consultation,
      prescriptions: Partial<PrescriptionItem>[],
      options: { ipAddress?: string } = {}
    ): Promise<Consultation> {
      const finalized: Consultation = { ...consultation, status: 'FINALIZED', finalizedAt: now() };
      const rxRows: PrescriptionItem[] = prescriptions.map((rx) => ({
        id: genId('RX-'),
        consultationId: finalized.id,
        medicineName: '',
        type: 'AYURVEDIC',
        form: 'TABLET',
        dosage: '',
        frequency: '',
        durationDays: 0,
        instructions: '',
        ...rx
      }));
      await runInTransaction(async (tx) => {
        await tx
          .insert(t.consultations)
          .values(finalized)
          .onConflictDoUpdate({
            target: t.consultations.id,
            set: {
              status: finalized.status,
              finalizedAt: finalized.finalizedAt,
              clinicalExamination: finalized.clinicalExamination,
              assessment: finalized.assessment,
              finalDiagnosis: finalized.finalDiagnosis,
              followUpDate: finalized.followUpDate,
              dietLifestyleAdvice: finalized.dietLifestyleAdvice,
              ayushChikitsaSutra: finalized.ayushChikitsaSutra,
              aiSummaryId: finalized.aiSummaryId
            }
          });
        if (rxRows.length > 0) {
          await tx.insert(t.prescriptionItems).values(rxRows);
        }
        await insertAuditLog(tx, {
          correlationId: 'CON-FINAL',
          actorId: finalized.practitionerId,
          actorRole: 'DOCTOR',
          action: 'CONSULTATION_FINALIZED',
          resourceType: 'CONSULTATION',
          resourceId: finalized.id,
          details: {
            diagnosis: finalized.finalDiagnosis,
            prescriptionsCount: rxRows.length
          },
          ipAddress: options.ipAddress || '127.0.0.1'
        });
      });
      return finalized;
    }
  },

  // ---- notifications / audit / integration reads -----------------------------------------
  notifications: {
    async byPatient(patientId: string): Promise<NotificationItem[]> {
      return toDomainList<NotificationItem>(
        await orm
          .select()
          .from(t.notifications)
          .where(eq(t.notifications.patientId, patientId))
          .orderBy(desc(t.notifications.timestamp))
      );
    }
  },

  auditLogs: {
    async list(limit = 1000): Promise<AuditLog[]> {
      return toDomainList<AuditLog>(
        await orm.select().from(t.auditLogs).orderBy(desc(t.auditLogs.timestamp)).limit(limit)
      );
    }
  },

  integrationEvents: {
    async list(limit = 500): Promise<IntegrationEvent[]> {
      return toDomainList<IntegrationEvent>(
        await orm
          .select()
          .from(t.integrationEvents)
          .orderBy(desc(t.integrationEvents.timestamp))
          .limit(limit)
      );
    }
  },

  systemHealth: {
    async list(): Promise<SystemHealthStatus[]> {
      return toDomainList<SystemHealthStatus>(await orm.select().from(t.systemHealth));
    }
  },

  // ---- demo reset -------------------------------------------------------------------------
  /** Wipes every table and re-seeds the demo dataset inside one transaction. */
  async resetDemoState(seedData: DatabaseState): Promise<void> {
    await runInTransaction(async (tx) => {
      await tx.execute(sql.raw(`
        TRUNCATE TABLE
          audit_logs, integration_events, notifications, investigation_orders,
          prescription_items, consultations, red_flag_alerts, ai_summaries,
          abdm_records, timeline_events, medical_entities, document_ocr_results,
          medical_documents, ayush_assessments, clinical_answers,
          clinical_sessions, queue_tokens, appointments, practitioners,
          departments, hospitals, consents, patients, users, system_health
        RESTART IDENTITY CASCADE
      `));

      await tx.insert(t.users).values(seedData.users);
      await tx.insert(t.patients).values(seedData.patients);
      await tx.insert(t.consents).values(seedData.consents);
      await tx.insert(t.hospitals).values(seedData.hospitals);
      await tx.insert(t.departments).values(seedData.departments);
      await tx.insert(t.practitioners).values(seedData.practitioners);
      await tx.insert(t.appointments).values(seedData.appointments);
      await tx.insert(t.queueTokens).values(seedData.queueTokens);
      await tx.insert(t.clinicalSessions).values(seedData.clinicalSessions);
      await tx.insert(t.clinicalAnswers).values(seedData.clinicalAnswers);
      await tx.insert(t.ayushAssessments).values(seedData.ayushAssessments);
      await tx.insert(t.medicalDocuments).values(seedData.documents);
      await tx.insert(t.documentOcrResults).values(seedData.documentOcrResults);
      await tx.insert(t.medicalEntities).values(seedData.medicalEntities);
      await tx.insert(t.timelineEvents).values(seedData.timelineEvents);
      await tx.insert(t.abdmRecords).values(seedData.abdmRecords);
      await tx.insert(t.aiSummaries).values(seedData.aiSummaries);
      await tx.insert(t.redFlagAlerts).values(seedData.redFlagAlerts);
      if (seedData.consultations.length) await tx.insert(t.consultations).values(seedData.consultations);
      if (seedData.prescriptions.length) await tx.insert(t.prescriptionItems).values(seedData.prescriptions);
      if (seedData.investigations.length) await tx.insert(t.investigationOrders).values(seedData.investigations);
      await tx.insert(t.notifications).values(seedData.notifications);
      await tx.insert(t.integrationEvents).values(seedData.integrationEvents);
      await tx.insert(t.auditLogs).values(seedData.auditLogs);
      await tx.insert(t.systemHealth).values(seedData.systemHealth);

      // Re-align business-identifier sequences above the freshly seeded rows.
      await tx.execute(sql.raw(`
        SELECT setval('mk_patient_id_seq', COALESCE((
          SELECT MAX((substring(mk_patient_id from '(\\d+)$'))::int) FROM patients
        ), 128))
      `));
      await tx.execute(sql.raw(`
        SELECT setval('appointment_number_seq', COALESCE((
          SELECT MAX((substring(appointment_number from '(\\d+)$'))::int) FROM appointments
        ), 99))
      `));
      await tx.execute(sql.raw(`
        SELECT setval('queue_token_number_seq', COALESCE((
          SELECT MAX((substring(token_number from '(\\d+)$'))::int) FROM queue_tokens
        ), 99))
      `));
    });
    this.broadcast('STATE_RESET', { timestamp: now() });
  }
};

export type MediKioskStore = typeof db;
