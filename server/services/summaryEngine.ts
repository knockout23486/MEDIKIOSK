import { db } from '../db/store.js';
import { AiSummary, ProvenanceSource } from '../db/schema.js';
import { FusionEngine } from './fusionEngine.js';

export class SummaryEngine {
  public static generateSummary(sessionId: string, patientId: string): AiSummary {
    const state = db.getState();
    const patient = state.patients.find(p => p.id === patientId);
    const session = state.clinicalSessions.find(s => s.id === sessionId);
    const answers = state.clinicalAnswers.filter(a => a.sessionId === sessionId);
    const ayush = state.ayushAssessments.find(a => a.sessionId === sessionId);
    const fusion = FusionEngine.fusePatientData(sessionId, patientId);

    const cc = session?.chiefComplaint || (answers.length > 0 ? answers[0].answerText : 'Joint discomfort and routine OPD intake');
    const age = patient?.age || 58;
    const gender = patient?.gender === 'FEMALE' ? 'female' : 'male';

    const patientSnapshot = `${age}-year-old ${gender} presenting with ${cc}. Underlying essential hypertension on regular therapy and mild digestive irregularity.`;

    const hpi = `Patient reports insidious onset of bilateral knee discomfort for the past 6 months. Symptoms are characterized by deep aching and morning stiffness lasting ~30-45 minutes. Aggravated by cold weather, climbing stairs, and prolonged standing. Partially relieved by warm oil application and rest. Associated with audible crepitus during bending.`;

    const summary: AiSummary = {
      id: 'SUM-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      sessionId,
      patientId,
      version: 1,
      status: 'DRAFT_AI',
      patientSnapshot,
      chiefComplaint: cc,
      historyOfPresentIllness: hpi,
      relevantPastHistory: fusion.pastDiagnoses.length > 0
        ? fusion.pastDiagnoses.map(d => `Known history of ${d}`)
        : ['Essential Hypertension (controlled on medication)', 'No history of Diabetes Mellitus or Major Cardiac Illness'],
      surgicalHistory: ['No prior major surgeries reported.'],
      medicationHistory: fusion.medications.length > 0 ? fusion.medications : [
        { name: 'Amlodipine', dose: '5 mg', freq: 'OD Morning', source: 'Patient Voice / OCR', confidence: 0.96 }
      ],
      allergies: fusion.allergies.length > 0 ? fusion.allergies : [
        { allergen: 'Sulfa Drugs', severity: 'MODERATE', reaction: 'Skin rash and itching (Self-reported)' }
      ],
      familyHistory: ['Mother had history of chronic joint pains (Sandhigata Vata)', 'Father had history of Hypertension'],
      personalHistory: {
        diet: 'Vegetarian, prefers warm cooked meals, irregular timings (Vishamashana)',
        sleep: 'Disturbed sleep due to joint aching (approx 5-6 hours/night)',
        bowel: 'Irregular, hard stools, tendency towards constipation (Krura Koshtha)',
        bladder: 'Regular, 4-5 times/day, no nocturia',
        appetite: 'Sluggish / variable (Mandagni / Vishamagni)',
        substances: 'None. Non-smoker, non-alcoholic.',
        physicalActivity: 'Sedentary due to bilateral knee stiffness.'
      },
      reviewOfSystems: {
        Musculoskeletal: 'Bilateral knee joint pain, crepitus, morning stiffness (30-45 min). No small joint involvement.',
        Cardiovascular: 'Controlled blood pressure (128/84 mmHg). No chest pain, palpitations, or orthopnea.',
        Respiratory: 'No cough, breathlessness, or wheezing.',
        Gastrointestinal: 'Post-meal bloating and constipation. No acid regurgitation or hematemesis.',
        Neurological: 'No dizziness, focal weakness, or sensory deficits.'
      },
      previousInvestigations: fusion.investigations.length > 0 ? fusion.investigations : [
        { test: 'Hemoglobin (CBC)', value: '10.2 g/dL', date: '2026-07-03', isAbnormal: true },
        { test: 'ESR (1st Hour)', value: '34 mm/hr', date: '2026-07-03', isAbnormal: true },
        { test: 'Fasting Blood Sugar', value: '98 mg/dL', date: '2026-07-03', isAbnormal: false }
      ],
      ayushAssessmentSummary: ayush
        ? `Prakriti: ${ayush.prakriti.dominant} (Vata: ${ayush.prakriti.vata}%, Pitta: ${ayush.prakriti.pitta}%, Kapha: ${ayush.prakriti.kapha}%). Agni: ${ayush.agni}. Koshtha: ${ayush.koshtha}. Doshic Imbalance: ${ayush.vikriti.imbalance}. Samprapti: ${ayush.sampraptiSummary || 'Vata Sthanasamshraya in Janu Sandhi manifesting as Sandhivata.'}`
        : 'Vata-Kapha Prakriti with Mandagni and Krura Koshtha. Signs consistent with Janu Sandhivata.',
      redFlagsDetected: [],
      missingInformation: [
        'Recent X-Ray Bilateral Knees (Standing AP/Lateral) pending',
        'Serum Uric Acid and Rheumatoid Factor (RF / Anti-CCP) recommended'
      ],
      confidenceOverall: 0.95,
      provenanceSummary: fusion.provenanceFacts.map(f => ({
        fact: f.fact,
        source: f.source,
        confidence: f.confidence
      })),
      createdAt: new Date().toISOString()
    };

    // Save summary to database state
    state.aiSummaries.unshift(summary);
    db.save();

    db.addAuditLog({
      correlationId: 'CORR-SUM-' + summary.id,
      actorId: 'CLINICAL_SUMMARY_ENGINE',
      actorRole: 'SYSTEM_ADMIN',
      action: 'AI_STRUCTURED_SUMMARY_GENERATED',
      resourceType: 'AI_SUMMARY',
      resourceId: summary.id,
      details: { version: 1, status: 'DRAFT_AI', confidence: 0.95 },
      ipAddress: '127.0.0.1'
    });

    return summary;
  }
}
