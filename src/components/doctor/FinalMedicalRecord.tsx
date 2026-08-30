import React, { useState } from 'react';
import { useDemo } from '../../contexts/DemoContext.js';
import {
  Printer, Download, CheckCircle2, ShieldCheck,
  Building2, QrCode, ArrowLeft, Sparkles, Activity, FileCode
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FinalMedicalRecordProps {
  consultationData: any;
  onBackToDashboard: () => void;
}

export const FinalMedicalRecord: React.FC<FinalMedicalRecordProps> = ({
  consultationData,
  onBackToDashboard
}) => {
  const { activePatientId } = useDemo();
  const [showFhirJson, setShowFhirJson] = useState<boolean>(false);

  const fhirBundle = {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: new Date().toISOString(),
    entry: [
      {
        resource: {
          resourceType: 'Composition',
          id: 'comp-20260828-01',
          status: 'final',
          type: { text: 'Outpatient Clinical Consultation Note' },
          subject: { reference: 'Patient/MK-PAT-2026-000124', display: 'Smt. Radha Sharma' },
          author: [{ reference: 'Practitioner/PRAC-01', display: 'Prof. (Dr.) Ananya Sharma' }],
          title: 'AIIA OPD Consultation Record',
          section: [
            { title: 'Chief Complaint', text: { status: 'generated', div: 'Bilateral knee joint pain for 6 months' } },
            { title: 'Diagnosis', text: { status: 'generated', div: 'Janu Sandhivata (ICD-11: M17.0)' } },
            { title: 'Prescription', text: { status: 'generated', div: 'Yogaraj Guggulu 2 tab BD + Shallaki 500mg' } }
          ]
        }
      }
    ]
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4 space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctor Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFhirJson(!showFhirJson)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300"
          >
            <FileCode className="w-3.5 h-3.5" />
            {showFhirJson ? 'Hide FHIR R4' : 'View FHIR R4 Bundle'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-ayush-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Outbound HIS Sync Success Pill */}
      <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-900 no-print">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>HIS EMR Encounter Synced: <span className="font-mono font-bold">AIIA-HIS-ENC-882194</span></span>
        </div>
        <span className="bg-emerald-600 text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
          Ack: HL7-AA
        </span>
      </div>

      {/* FHIR JSON Preview Drawer */}
      {showFhirJson && (
        <div className="bg-slate-950 text-emerald-400 p-5 rounded-2xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-2xl no-print max-h-96">
          <div className="text-slate-400 mb-2 font-sans font-bold flex items-center justify-between">
            <span>FHIR R4 Composition Resource (ABDM Interoperability Ready)</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">JSON-LD</span>
          </div>
          <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
        </div>
      )}

      {/* OFFICIAL CLINICAL RECORD SHEET (Printable Paper Style) */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-300 space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Hospital Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-ayush-800 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 shadow">
              <Activity className="w-9 h-9" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
                All India Institute of Ayurveda (AIIA)
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                Ministry of Ayush, Government of India • Gautampuri, Sarita Vihar, New Delhi - 110076
              </p>
              <p className="text-[11px] text-ayush-800 font-bold uppercase tracking-wider mt-0.5">
                Department of Kayachikitsa (Internal Ayurvedic Medicine) • OPD Prescription & Case Summary
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="bg-slate-100 px-2 py-1 rounded font-bold block border">
              Token: A-027
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Date: 28-Aug-2026
            </span>
          </div>
        </div>

        {/* Patient Demographic Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border text-xs">
          <div>
            <span className="text-slate-500 block">Patient Name:</span>
            <span className="font-extrabold text-sm text-slate-900">Smt. Radha Sharma</span>
          </div>
          <div>
            <span className="text-slate-500 block">Age / Gender:</span>
            <span className="font-bold text-slate-900">58 Yrs / Female</span>
          </div>
          <div>
            <span className="text-slate-500 block">ABHA Number:</span>
            <span className="font-mono font-bold text-emerald-800">91-4829-1029-4821</span>
          </div>
          <div>
            <span className="text-slate-500 block">MediKiosk MRN:</span>
            <span className="font-mono font-bold text-slate-800">MK-PAT-2026-000124</span>
          </div>
        </div>

        {/* Clinical History & Examination */}
        <div className="space-y-3 text-xs">
          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
              • Chief Complaint & History of Present Illness (Pre-Intake Verified):
            </span>
            <p className="text-slate-700 leading-relaxed pl-3 border-l-2 border-ayush-600">
              Bilateral knee joint pain with morning stiffness (30-45 mins) for 6 months. Aggravated by cold exposure and stairs, relieved by warm fomentation. Controlled Hypertension on Amlodipine 5mg OD.
            </p>
          </div>

          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
              • Clinical Examination & Vitals:
            </span>
            <div className="pl-3 flex flex-wrap gap-4 text-slate-700 font-mono font-semibold">
              <span>BP: 126/82 mmHg</span>
              <span>Pulse: 76 bpm</span>
              <span>SpO2: 99%</span>
              <span>Temp: 98.4 F</span>
              <span>Knee: Bilateral Crepitus (+)</span>
            </div>
          </div>

          <div>
            <span className="font-bold text-slate-900 uppercase tracking-wider block mb-1">
              • AYUSH Dashavidha Pariksha & Diagnosis:
            </span>
            <div className="pl-3 bg-ayush-50 p-3 rounded-xl border border-ayush-200">
              <span className="font-bold text-ayush-950 block">
                Primary Diagnosis: Janu Sandhivata (ICD-11: M17.0 / NAMASTE-AYU-042)
              </span>
              <span className="text-ayush-800 text-[11px] block mt-0.5">
                Doshic Status: Vata-Pitta Prakriti, Mandagni, Krura Koshtha with Asthi-Dhatukshaya.
              </span>
            </div>
          </div>
        </div>

        {/* Prescription Table (Rx) */}
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm mb-2 uppercase tracking-wider">
            <span>℞ Prescription & ChikitsaSutra</span>
          </div>

          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-2.5 rounded-l-lg">Medicine Name</th>
                <th className="p-2.5">Dosage</th>
                <th className="p-2.5">Frequency & Anupana</th>
                <th className="p-2.5">Duration</th>
                <th className="p-2.5 rounded-r-lg">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50">
                <td className="p-2.5 font-bold">Yogaraj Guggulu (500mg)</td>
                <td className="p-2.5">2 Tablets</td>
                <td className="p-2.5">Twice daily with warm water</td>
                <td className="p-2.5 font-mono font-bold">30 Days</td>
                <td className="p-2.5 text-slate-600">After food</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2.5 font-bold">Shallaki (Boswellia 500mg)</td>
                <td className="p-2.5">1 Capsule</td>
                <td className="p-2.5">Twice daily after meals</td>
                <td className="p-2.5 font-mono font-bold">30 Days</td>
                <td className="p-2.5 text-slate-600">After food</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2.5 font-bold">Mahanarayana Taila</td>
                <td className="p-2.5">15 ml</td>
                <td className="p-2.5">Local application BD</td>
                <td className="p-2.5 font-mono font-bold">30 Days</td>
                <td className="p-2.5 text-slate-600">Gentle warm oil massage + hot fomentation</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-2.5 font-bold">Tab Amlodipine 5mg</td>
                <td className="p-2.5">1 Tablet</td>
                <td className="p-2.5">Once daily (Morning)</td>
                <td className="p-2.5 font-mono font-bold">30 Days</td>
                <td className="p-2.5 text-slate-600">Continue regular BP medication</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dietary / Lifestyle Advice */}
        <div className="bg-slate-50 p-4 rounded-2xl border text-xs">
          <span className="font-bold text-slate-900 block mb-1">Pathya-Apathya (Diet & Lifestyle Counseling):</span>
          <p className="text-slate-700 leading-relaxed">
            • Avoid cold, refrigerated food, curd at night, and heavy dry snacks (Vatakara).<br />
            • Avoid squatting on the floor; use western commode.<br />
            • Perform isometric knee quadriceps exercises twice daily.
          </p>
        </div>

        {/* Doctor Signature & QR Verification Footer */}
        <div className="pt-6 border-t-2 border-slate-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 border-2 border-slate-900 rounded-xl p-1 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-slate-900" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-slate-500 block">ABDM / AIIA Digital Record Verification</span>
              <span className="font-mono font-bold text-slate-900">VERIFY-ID: MK-2026-CON-882194</span>
              <span className="text-[10px] text-emerald-700 block font-semibold">Digitally Signed & Timestamped</span>
            </div>
          </div>

          <div className="text-right">
            <div className="font-serif italic text-lg text-slate-800 font-bold">
              Prof. (Dr.) Ananya Sharma
            </div>
            <div className="text-xs font-bold text-slate-900">
              BAMS, MD (AIIA), PhD
            </div>
            <div className="text-[11px] text-slate-600">
              Senior Consultant & Head, Kayachikitsa OPD 104
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
