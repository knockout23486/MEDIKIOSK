import React, { useState, useEffect } from 'react';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { ProvenanceBadge } from '../common/ProvenanceBadge.js';
import { ConfidenceBadge } from '../common/ConfidenceBadge.js';
import { DisclaimerBanner } from '../common/DisclaimerBanner.js';
import {
  Stethoscope, CheckCircle2, Edit3, Save, FileText,
  Activity, Clock, AlertTriangle, Pill, ShieldCheck,
  ChevronDown, ChevronUp, History, Download, Sparkles
} from 'lucide-react';

interface PatientConsultationViewProps {
  onProceedToPrescription: () => void;
}

export const PatientConsultationView: React.FC<PatientConsultationViewProps> = ({
  onProceedToPrescription
}) => {
  const { activePatientId, activeSessionId } = useDemo();

  const [patient, setPatient] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedHpi, setEditedHpi] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'ayush' | 'labs'>('summary');

  useEffect(() => {
    api.getPatient(activePatientId).then(setPatient);
    api.getAiSummary(activeSessionId).then(s => {
      if (s) {
        setSummary(s);
        setEditedHpi(s.historyOfPresentIllness);
      }
    });
    api.getTimeline(activePatientId).then(setTimeline);
  }, [activePatientId, activeSessionId]);

  const handleVerifySummary = async () => {
    if (!summary) return;
    setIsSaving(true);
    try {
      const res = await api.verifyAiSummary(summary.id, {
        doctorId: 'USR-DOC-01',
        historyOfPresentIllness: editedHpi,
        doctorNotes: 'History and joint stiffness verified in person with patient Radha Sharma.'
      });
      if (res.summary) {
        setSummary(res.summary);
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!patient || !summary) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 border-4 border-clinical-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Clinical Case-Taking Workstation...</p>
      </div>
    );
  }

  const isVerified = summary.status === 'PHYSICIAN_VERIFIED';

  return (
    <div className="space-y-6">
      {/* Patient Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-ayush-600 to-ayush-800 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-md shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-white">{patient.name}</h2>
              <span className="bg-ayush-700 text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                Token: A-027
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
              <span>{patient.age} yrs • {patient.gender}</span>
              <span>•</span>
              <span className="font-mono text-emerald-400 font-bold">ABHA: {patient.abhaNumber}</span>
              <span>•</span>
              <span className="font-mono text-slate-400">ID: {patient.mkPatientId}</span>
            </div>
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex items-center gap-3">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow">
              <ShieldCheck className="w-4 h-4" />
              Physician Verified (v{summary.version})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow">
              <Sparkles className="w-4 h-4" />
              AI Draft (Requires Verification)
            </span>
          )}

          <button
            onClick={onProceedToPrescription}
            className="px-5 py-2.5 bg-clinical-600 hover:bg-clinical-500 text-white text-xs font-extrabold rounded-xl shadow transition"
          >
            Start Consultation & Rx
          </button>
        </div>
      </div>

      {/* Sub-Tabs: AI Summary, Timeline, AYUSH Radar, Lab Trends */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'summary'
              ? 'border-clinical-600 text-clinical-700 bg-clinical-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          AI Clinical Summary
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'timeline'
              ? 'border-clinical-600 text-clinical-700 bg-clinical-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Medical Timeline ({timeline.length})
        </button>

        <button
          onClick={() => setActiveTab('ayush')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeTab === 'ayush'
              ? 'border-ayush-600 text-ayush-700 bg-ayush-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-ayush-600" />
          AYUSH Dashavidha Pariksha
        </button>
      </div>

      {/* TAB 1: AI SUMMARY */}
      {activeTab === 'summary' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex items-center justify-between">
            <DisclaimerBanner type={isVerified ? 'verified' : 'draft_ai'} />
            {!isVerified && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="ml-3 shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-200"
              >
                <Edit3 className="w-4 h-4" /> Edit Summary
              </button>
            )}
          </div>

          {/* Chief Complaint */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Chief Complaint (CC)
              </span>
              <ProvenanceBadge source="PATIENT_VOICE" confidence={0.96} />
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {summary.chiefComplaint}
            </p>
          </div>

          {/* History of Present Illness (Editable) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. History of Present Illness (HPI)
              </span>
              <ProvenanceBadge source="PATIENT_VOICE" confidence={0.95} />
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-2">
                <textarea
                  rows={4}
                  value={editedHpi}
                  onChange={e => setEditedHpi(e.target.value)}
                  className="w-full text-xs font-medium p-3 rounded-xl border border-clinical-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifySummary}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-clinical-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Save & Verify
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium mt-1">
                {summary.historyOfPresentIllness}
              </p>
            )}
          </div>

          {/* 3-Col Clinical Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Medications */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-300 block mb-2 uppercase tracking-wider">
                Medication History
              </span>
              <div className="space-y-1.5">
                {summary.medicationHistory.map((m: any, i: number) => (
                  <div key={i} className="text-blue-950 dark:text-blue-200 flex items-center justify-between">
                    <span className="font-semibold">{m.name} {m.dose}</span>
                    <span className="text-[10px] text-blue-600 opacity-80 font-mono">({m.freq})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-xs">
              <span className="font-bold text-rose-900 dark:text-rose-300 block mb-2 uppercase tracking-wider">
                Allergies
              </span>
              {summary.allergies.map((al: any, i: number) => (
                <div key={i} className="text-rose-950 dark:text-rose-200 font-semibold">
                  • {al.allergen} ({al.severity}): {al.reaction}
                </div>
              ))}
            </div>

            {/* Past Medical History */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2 uppercase tracking-wider">
                Past Medical History
              </span>
              {summary.relevantPastHistory.map((pm: string, i: number) => (
                <div key={i} className="text-slate-700 dark:text-slate-300 font-medium">
                  • {pm}
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Verification Action Bar */}
          {!isVerified && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Ready to Approve Pre-Intake Case-Taking?
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Clicking 'Accept & Verify' transitions the record to 'Physician Verified' with digital doctor signature.
                </p>
              </div>

              <button
                onClick={handleVerifySummary}
                disabled={isSaving}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Verify All (v2)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEDICAL TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Chronological Longitudinal Health Record
          </h3>

          <div className="relative pl-6 border-l-2 border-ayush-400 space-y-6">
            {timeline.map((event, idx) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-ayush-600 border-2 border-white" />
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-400 font-bold">{event.date}</span>
                    <ProvenanceBadge source={event.provenance} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {event.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {event.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {event.keyEntities.map((k: string, i: number) => (
                      <span key={i} className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-mono font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AYUSH PARIKSHA */}
      {activeTab === 'ayush' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center gap-2 text-ayush-800 dark:text-ayush-300 font-bold text-lg">
            <Activity className="w-5 h-5" />
            AYUSH Dashavidha Pariksha Synthesis
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-ayush-50 dark:bg-ayush-950 rounded-2xl border border-ayush-200 dark:border-ayush-800">
              <span className="text-slate-500 font-bold uppercase block mb-1">Prakriti</span>
              <span className="font-extrabold text-sm text-ayush-900 dark:text-ayush-200">Vata-Pitta (55% Vata, 30% Pitta, 15% Kapha)</span>
            </div>
            <div className="p-4 bg-ayush-50 dark:bg-ayush-950 rounded-2xl border border-ayush-200 dark:border-ayush-800">
              <span className="text-slate-500 font-bold uppercase block mb-1">Agni Status</span>
              <span className="font-extrabold text-sm text-ayush-900 dark:text-ayush-200">Mandagni / Vishamagni (Sluggish & Irregular)</span>
            </div>
            <div className="p-4 bg-ayush-50 dark:bg-ayush-950 rounded-2xl border border-ayush-200 dark:border-ayush-800">
              <span className="text-slate-500 font-bold uppercase block mb-1">Koshtha</span>
              <span className="font-extrabold text-sm text-ayush-900 dark:text-ayush-200">Krura Koshtha (Constipated tendency)</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
              Samprapti Ghataka (Pathogenesis Summary)
            </span>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Vata Prakopa localizes at Janu Sandhi (Khavaigunya) causing Shoola (pain), Shopha (swelling/crepitus), and Stambha (stiffness) consistent with Sandhivata (Osteoarthritis).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
