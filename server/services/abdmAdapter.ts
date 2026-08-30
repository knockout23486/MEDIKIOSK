import { db } from '../db/store.js';
import { AbdmRecord } from '../db/schema.js';

export interface AbdmVerificationResult {
  verified: boolean;
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  gender: string;
  dob: string;
  kycStatus: 'VERIFIED' | 'PENDING';
  simulated: boolean;
}

export class AbdmAdapter {
  public static async verifyAbha(abhaNumber: string, otp?: string): Promise<AbdmVerificationResult> {
    const startTime = Date.now();

    // In demo mode, simulate ABDM Sandbox Milestone 1 OTP verification
    const isHero = abhaNumber.includes('4829') || abhaNumber.includes('radha');
    const result: AbdmVerificationResult = {
      verified: true,
      abhaNumber: abhaNumber || '91-4829-1029-4821',
      abhaAddress: isHero ? 'radha.sharma@abdm' : 'patient.demo@abdm',
      name: isHero ? 'Smt. Radha Sharma' : 'Demo Verified Citizen',
      gender: isHero ? 'FEMALE' : 'MALE',
      dob: isHero ? '1968-04-14' : '1980-01-01',
      kycStatus: 'VERIFIED',
      simulated: true
    };

    // Record Integration Event
    db.addIntegrationEvent({
      integrationType: 'ABDM_M1',
      direction: 'OUTBOUND',
      endpoint: 'https://sandbox.abdm.gov.in/v1/registration/mobile/verifyOtp',
      status: 'SIMULATED_SUCCESS',
      latencyMs: Date.now() - startTime + 120,
      payload: { abhaNumber, authMode: 'DEMO_SIMULATION', timestamp: new Date().toISOString() },
      response: { status: 'SUCCESS', verified: true, kycStatus: 'VERIFIED', abhaAddress: result.abhaAddress }
    });

    return result;
  }

  public static generateFhirPatientBundle(patientId: string): Record<string, any> {
    const state = db.getState();
    const patient = state.patients.find(p => p.id === patientId);

    return {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: patient?.mkPatientId || 'MK-PAT-DEMO',
            identifier: [
              { system: 'https://abdm.gov.in/abha', value: patient?.abhaNumber },
              { system: 'https://aiia.gov.in/mrn', value: patient?.mkPatientId }
            ],
            name: [{ text: patient?.name }],
            telecom: [{ system: 'phone', value: patient?.phone }],
            gender: patient?.gender?.toLowerCase() || 'female',
            birthDate: patient?.dob || '1968-04-14'
          }
        }
      ]
    };
  }
}
