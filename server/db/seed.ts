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

export function seedDatabase(forceReset: boolean = false): void {
  const isLoaded = db.load();
  if (!isLoaded || forceReset || db.getState().patients.length === 0) {
    console.log('[Seed] Seeding MediKiosk database with realistic Indian clinical datasets...');
    const seedData = getInitialSeedData();
    db.setState(seedData);
    console.log('[Seed] Database successfully seeded! Total patients:', seedData.patients.length);
  } else {
    console.log('[Seed] Existing database loaded with', db.getState().patients.length, 'patients.');
  }
}

// Auto-run if executed directly via npm run seed or reset-demo
if (process.argv[1]?.includes('seed')) {
  const isReset = process.argv.includes('--reset');
  seedDatabase(isReset);
}
