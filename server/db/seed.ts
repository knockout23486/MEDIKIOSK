// ============================================================================
// MediKiosk Demo Seed — executes entirely against PostgreSQL.
// Previously this wrote a JSON blob to a flat file; it now seeds
// the relational schema inside a single transaction (see store.resetDemoState).
// ============================================================================
import { db, DatabaseState } from './store.js';
import { seededUsers, seededHospitals, seededDepartments, seededPractitioners } from './seedUsers.js';
import {
  seededPatients, seededConsents, seededAppointments, seededQueueTokens,
  seededClinicalSessions, seededClinicalAnswers, seededAyushAssessments
} from './seedPatients.js';
import {
  seededDocuments, seededDocumentOcrResults, seededMedicalEntities,
  seededTimelineEvents, seededAbdmRecords, seededAiSummaries,
  seededRedFlagAlerts, seededNotifications, seededIntegrationEvents,
  seededAuditLogs, seededSystemHealth
} from './seedClinical.js';

export function getInitialSeedData(): DatabaseState {
  return {
    users: seededUsers,
    patients: seededPatients,
    consents: seededConsents,
    hospitals: seededHospitals,
    departments: seededDepartments,
    practitioners: seededPractitioners,
    appointments: seededAppointments,
    queueTokens: seededQueueTokens,
    clinicalSessions: seededClinicalSessions,
    clinicalAnswers: seededClinicalAnswers,
    ayushAssessments: seededAyushAssessments,
    documents: seededDocuments,
    documentOcrResults: seededDocumentOcrResults,
    medicalEntities: seededMedicalEntities,
    timelineEvents: seededTimelineEvents,
    abdmRecords: seededAbdmRecords,
    aiSummaries: seededAiSummaries,
    redFlagAlerts: seededRedFlagAlerts,
    consultations: [],
    prescriptions: [],
    investigations: [],
    notifications: seededNotifications,
    integrationEvents: seededIntegrationEvents,
    auditLogs: seededAuditLogs,
    systemHealth: seededSystemHealth
  };
}

/**
 * Seeds the relational database with the demo dataset when it is empty, or
 * force-resets it (`forceReset === true`, used by `npm run reset-demo` and the
 * Demo Control Center). All writes happen in one SQL transaction.
 */
export async function seedDatabase(forceReset: boolean = false): Promise<void> {
  const existingPatients = await db.patients.count();
  if (!forceReset && existingPatients > 0) {
    console.log('[Seed] Existing PostgreSQL database loaded with', existingPatients, 'patients.');
    return;
  }
  console.log('[Seed] Seeding MediKiosk PostgreSQL database with realistic Indian clinical datasets...');
  const seedData = getInitialSeedData();
  await db.resetDemoState(seedData);
  console.log('[Seed] Database successfully seeded! Total patients:', seedData.patients.length);
}

// Auto-run if executed directly via npm run seed / npm run reset-demo
if (process.argv[1]?.includes('seed')) {
  const isReset = process.argv.includes('--reset');
  seedDatabase(isReset)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Failed:', err);
      process.exit(1);
    });
}
