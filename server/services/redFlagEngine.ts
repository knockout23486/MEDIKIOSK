import { db } from '../db/store.js';
import { RedFlagAlert } from '../db/schema.js';

export interface RedFlagRule {
  id: string;
  name: string;
  category: 'CARDIAC' | 'NEUROLOGICAL' | 'RESPIRATORY' | 'ANAPHYLAXIS' | 'BLEEDING' | 'PSYCH_EMERGENCY';
  severity: 'URGENT' | 'EMERGENCY_CRITICAL';
  keywordsEn: string[];
  keywordsHi: string[];
  requiredCombinations?: string[][];
  clinicalDisclaimer: string;
}

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: 'RED_FLAG_ACUTE_CORONARY_SYNDROME',
    name: 'Suspected Acute Coronary Syndrome (Myocardial Ischemia)',
    category: 'CARDIAC',
    severity: 'EMERGENCY_CRITICAL',
    keywordsEn: ['chest pain', 'squeezing', 'crushing', 'left arm', 'jaw pain', 'sweating', 'breathlessness', 'diaphoresis'],
    keywordsHi: ['छाती में दर्द', 'सीने में दर्द', 'बायां हाथ', 'पसीना', 'घबराहट', 'सांस फूलना'],
    requiredCombinations: [
      ['PRESSURE_HEAVY', 'LEFT_ARM_SHOULDER'],
      ['PRESSURE_HEAVY', 'COLD_SWEATING'],
      ['PRESSURE_HEAVY', 'DYSPNEA_SHORT_BREATH'],
      ['chest pain', 'left arm'],
      ['chest pain', 'sweating']
    ],
    clinicalDisclaimer: 'Emergency Safety Alert: Potential acute cardiac symptoms detected. Immediate ECG & clinician triage required.'
  },
  {
    id: 'RED_FLAG_ACUTE_STROKE_FAST',
    name: 'Suspected Acute Neurological Deficit (Stroke / TIA)',
    category: 'NEUROLOGICAL',
    severity: 'EMERGENCY_CRITICAL',
    keywordsEn: ['facial drooping', 'slurred speech', 'arm weakness', 'sudden numbness', 'loss of speech', 'paralysis'],
    keywordsHi: ['चेहरा टेढ़ा', 'आवाज लड़खड़ाना', 'हाथ में कमजोरी', 'अचानक सुन्न', 'लकवा'],
    clinicalDisclaimer: 'Emergency Safety Alert: Symptoms consistent with acute neurological deficit. Rapid stroke protocol triage initiated.'
  },
  {
    id: 'RED_FLAG_ACUTE_RESPIRATORY_FAILURE',
    name: 'Acute Severe Respiratory Distress (Severe Dyspnea / Stridor)',
    category: 'RESPIRATORY',
    severity: 'EMERGENCY_CRITICAL',
    keywordsEn: ['cannot breathe', 'gasping', 'choking', 'stridor', 'severe asthma', 'blue lips'],
    keywordsHi: ['सांस नहीं आ रही', 'दम घुटना', 'नीले होंठ', 'सांस में भारी घरघराहट'],
    clinicalDisclaimer: 'Emergency Safety Alert: Impending respiratory compromise detected. Immediate oxygenation and airway evaluation required.'
  },
  {
    id: 'RED_FLAG_ANAPHYLAXIS',
    name: 'Suspected Severe Anaphylactic Reaction',
    category: 'ANAPHYLAXIS',
    severity: 'EMERGENCY_CRITICAL',
    keywordsEn: ['throat swelling', 'difficulty swallowing', 'widespread hives', 'swelling of lips', 'severe allergy'],
    keywordsHi: ['गले में सूजन', 'निगलने में रुकावट', 'पूरे शरीर पर दाने', 'होंठों में भारी सूजन'],
    clinicalDisclaimer: 'Emergency Safety Alert: Potential anaphylaxis detected. Immediate physician review and resuscitation readiness required.'
  }
];

export class RedFlagEngine {
  public static evaluateInput(
    input: string,
    structuredAnswers: Record<string, string>,
    patientInfo: { id: string; name: string; age: number; gender: string; tokenNumber?: string; sessionId: string }
  ): RedFlagAlert | null {
    const textLower = (input + ' ' + Object.values(structuredAnswers).join(' ')).toLowerCase();

    for (const rule of RED_FLAG_RULES) {
      let isTriggered = false;

      // 1. Check combinations
      if (rule.requiredCombinations) {
        for (const combo of rule.requiredCombinations) {
          const matchAll = combo.every(item => textLower.includes(item.toLowerCase()));
          if (matchAll) {
            isTriggered = true;
            break;
          }
        }
      }

      // 2. Check keyword clusters
      if (!isTriggered) {
        let count = 0;
        for (const kw of rule.keywordsEn) {
          if (textLower.includes(kw.toLowerCase())) count++;
        }
        for (const kw of rule.keywordsHi) {
          if (input.includes(kw)) count++;
        }
        if (count >= 2) {
          isTriggered = true;
        }
      }

      if (isTriggered) {
        const alert: RedFlagAlert = {
          id: 'RFA-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          sessionId: patientInfo.sessionId,
          patientId: patientInfo.id,
          tokenNumber: patientInfo.tokenNumber || 'EMERG-' + Math.floor(100 + Math.random() * 900),
          patientName: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          triggerRule: rule.id,
          triggerInput: input.length > 200 ? input.substring(0, 200) + '...' : input,
          severity: rule.severity,
          detectedAt: new Date().toISOString(),
          status: 'PENDING'
        };

        // Add to database state
        const state = db.getState();
        state.redFlagAlerts.unshift(alert);

        // Escalate token priority if exists
        const token = state.queueTokens.find(t => t.patientId === patientInfo.id);
        if (token) {
          token.priority = 'EMERGENCY';
          token.status = 'TRIAGE_URGENT';
          token.estimatedWaitMins = 1;
        }

        // Add audit log
        db.addAuditLog({
          correlationId: 'CORR-RFA-' + alert.id,
          actorId: 'RED_FLAG_SAFETY_ENGINE',
          actorRole: 'SYSTEM_ADMIN',
          action: 'EMERGENCY_RED_FLAG_TRIGGERED',
          resourceType: 'RED_FLAG_ALERT',
          resourceId: alert.id,
          details: { ruleId: rule.id, severity: rule.severity, triggerInput: alert.triggerInput },
          ipAddress: '127.0.0.1'
        });

        // Broadcast real-time SSE event to Triage dashboard
        db.broadcast('RED_FLAG_TRIGGERED', alert);
        db.save();

        return alert;
      }
    }

    return null;
  }
}
