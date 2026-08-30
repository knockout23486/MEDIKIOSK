import { db } from '../db/store.js';

export interface HisEncounterSyncPayload {
  encounterId: string;
  patientId: string;
  practitionerId: string;
  departmentId: string;
  chiefComplaint: string;
  aiSummaryId?: string;
  intakeTimestamp: string;
}

export class HisAdapter {
  public static async syncPreIntakeEncounter(payload: HisEncounterSyncPayload): Promise<{
    status: 'SUCCESS' | 'FAILED';
    hisEncounterRef: string;
    syncedAt: string;
  }> {
    const startTime = Date.now();
    const hisEncounterRef = 'AIIA-HIS-ENC-' + Math.floor(100000 + Math.random() * 900000);

    const fhirEncounter = {
      resourceType: 'Encounter',
      id: hisEncounterRef,
      status: 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: 'AMB',
        display: 'Ambulatory / OPD'
      },
      subject: { reference: `Patient/${payload.patientId}` },
      participant: [
        {
          individual: { reference: `Practitioner/${payload.practitionerId}` }
        }
      ],
      reasonCode: [
        { text: payload.chiefComplaint }
      ],
      period: {
        start: payload.intakeTimestamp
      }
    };

    // Log integration roundtrip
    db.addIntegrationEvent({
      integrationType: 'HIS_EMR',
      direction: 'OUTBOUND',
      endpoint: 'https://his-demo.aiia.gov.in/api/v2/opd/encounter-preintake',
      status: 'SIMULATED_SUCCESS',
      latencyMs: Date.now() - startTime + 160,
      payload: fhirEncounter,
      response: {
        status: 'RECEIVED',
        hisEncounterRef,
        ackCode: 'AA',
        message: 'Pre-intake structured clinical history successfully linked to HIS EMR queue.'
      }
    });

    return {
      status: 'SUCCESS',
      hisEncounterRef,
      syncedAt: new Date().toISOString()
    };
  }
}
