import React, { useState } from 'react';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import {
  Pill, Plus, Trash2, CheckCircle2, ArrowRight,
  ArrowLeft, Stethoscope, FileText, Calendar, Sparkles
} from 'lucide-react';

interface PrescriptionBuilderProps {
  onFinalized: (consultationData: any) => void;
  onBack: () => void;
}

export const PrescriptionBuilder: React.FC<PrescriptionBuilderProps> = ({
  onFinalized,
  onBack
}) => {
  const { activePatientId, activeAppointmentId, activeSessionId } = useDemo();

  const [vitals, setVitals] = useState({
    bp: '126/82 mmHg',
    pulse: '76 bpm',
    temp: '98.4 F',
    spo2: '99%',
    respRate: '16 /min'
  });

  const [assessment, setAssessment] = useState<string>(
    'Janu Sandhivata (Bilateral Knee Osteoarthritis) with Mandagni & Dhatukshaya. Essential Hypertension (controlled).'
  );

  const [diagnoses, setDiagnoses] = useState([
    { code: 'NAMASTE-AYU-042', name: 'Janu Sandhivata (जानु संधिवात)', system: 'NAMASTE_AYUSH' },
    { code: 'M17.0', name: 'Primary Bilateral Osteoarthritis of Knee', system: 'ICD11' },
    { code: 'BA00', name: 'Essential Hypertension', system: 'ICD11' }
  ]);

  const [medicines, setMedicines] = useState([
    {
      medicineName: 'Yogaraj Guggulu',
      type: 'AYURVEDIC',
      form: 'TABLET',
      dosage: '2 Tablets (500mg each)',
      frequency: 'Twice Daily (Morning & Night)',
      durationDays: 30,
      anupana: 'Lukewarm water',
      instructions: 'Take after meals'
    },
    {
      medicineName: 'Shallaki (Boswellia serrata) 500mg',
      type: 'AYURVEDIC',
      form: 'CAPSULE',
      dosage: '1 Capsule',
      frequency: 'Twice Daily',
      durationDays: 30,
      anupana: 'Warm water',
      instructions: 'Take after meals'
    },
    {
      medicineName: 'Mahanarayana Taila',
      type: 'AYURVEDIC',
      form: 'TAILA',
      dosage: '15 ml',
      frequency: 'Twice Daily local application',
      durationDays: 30,
      anupana: 'N/A',
      instructions: 'Apply warm oil gently over knee joints without heavy pressure, followed by hot fomentation (Svedana)'
    },
    {
      medicineName: 'Tab Amlodipine 5mg',
      type: 'ALLOPATHIC',
      form: 'TABLET',
      dosage: '1 Tablet',
      frequency: 'Once Daily (Morning)',
      durationDays: 30,
      anupana: 'Water',
      instructions: 'Continue regular BP medication with daily morning monitoring'
    }
  ]);

  const [investigations, setInvestigations] = useState([
    { testName: 'X-Ray Bilateral Knee Joints (Standing AP & Lateral)', category: 'RADIOLOGY', priority: 'ROUTINE' },
    { testName: 'Serum Uric Acid & ESR Repeat', category: 'LABORATORY', priority: 'ROUTINE' }
  ]);

  const [followUpDate, setFollowUpDate] = useState<string>('2026-09-28');
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  const handleAddMedicine = () => {
    setMedicines([
      ...medicines,
      {
        medicineName: 'Dashamoola Kwatha',
        type: 'AYURVEDIC',
        form: 'KASHAYAM',
        dosage: '15 ml with equal water',
        frequency: 'Twice daily empty stomach',
        durationDays: 15,
        anupana: 'Lukewarm water',
        instructions: 'Morning and evening before meals'
      }
    ]);
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      const payload = {
        appointmentId: activeAppointmentId,
        patientId: activePatientId,
        practitionerId: 'PRAC-01',
        aiSummaryId: 'SUM-HERO-01',
        clinicalExamination: {
          generalAppearance: 'Conscious, oriented, ambulatory with mild antalgic gait',
          vitals,
          systemicExam: 'Knee joints: Crepitus on passive flexion, no active joint effusion, range of motion 0-110 degrees'
        },
        assessment,
        finalDiagnosis: diagnoses,
        prescriptions: medicines,
        investigations,
        followUpDate,
        dietLifestyleAdvice: [
          'Avoid cold drinks, curd at night, and dry fast food (Vatakara Ahara)',
          'Daily gentle warm oil massage with Mahanarayana Taila',
          'Avoid cross-legged sitting and deep squatting on floor',
          'Perform isometric quadriceps strengthening exercises under guidance'
        ]
      };

      const res = await api.finalizeConsultation('CON-HERO-01', payload);
      onFinalized(res.consultation || payload);
    } catch (e) {
      console.error(e);
      onFinalized({});
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Summary View
        </button>
        <span className="text-xs bg-clinical-100 text-clinical-800 font-bold px-3 py-1 rounded-full">
          Consultation & Prescription Builder
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
        {/* Vitals Recording */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-clinical-600" />
            1. Clinical Examination & Vitals
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">BP (mmHg)</span>
              <input
                type="text"
                value={vitals.bp}
                onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                className="font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full mt-0.5"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Pulse (bpm)</span>
              <input
                type="text"
                value={vitals.pulse}
                onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                className="font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full mt-0.5"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">SpO2</span>
              <input
                type="text"
                value={vitals.spo2}
                onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                className="font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full mt-0.5"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Temperature</span>
              <input
                type="text"
                value={vitals.temp}
                onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                className="font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full mt-0.5"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block">Resp Rate</span>
              <input
                type="text"
                value={vitals.respRate}
                onChange={e => setVitals({ ...vitals, respRate: e.target.value })}
                className="font-bold text-slate-900 dark:text-white bg-transparent outline-none w-full mt-0.5"
              />
            </div>
          </div>
        </div>

        {/* Diagnosis Coding */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-ayush-600" />
            2. Final Clinical & AYUSH Diagnosis
          </h3>
          <div className="space-y-2">
            {diagnoses.map((d, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-ayush-100 dark:bg-ayush-950 text-ayush-800 dark:text-ayush-300 font-bold px-2 py-0.5 rounded border border-ayush-300">
                    {d.code}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{d.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{d.system}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Medicines List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              3. Prescriptions & ChikitsaSutra ({medicines.length})
            </h3>
            <button
              onClick={handleAddMedicine}
              className="text-xs bg-ayush-50 text-ayush-800 border border-ayush-300 px-3 py-1 rounded-lg font-bold flex items-center gap-1 hover:bg-ayush-100 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Medicine
            </button>
          </div>

          <div className="space-y-3">
            {medicines.map((m, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {m.medicineName}
                    </span>
                    <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold">
                      {m.form}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                    {m.dosage} • {m.frequency} • {m.durationDays} Days
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {m.instructions} {m.anupana && `(Anupana: ${m.anupana})`}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveMedicine(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition self-end sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Finalize Button */}
        <button
          onClick={handleFinalize}
          disabled={isFinalizing}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
        >
          {isFinalizing ? (
            <span>Transmitting to HIS EMR Gateway & Finalizing...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Finalize Consultation & Generate Medical Record</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
