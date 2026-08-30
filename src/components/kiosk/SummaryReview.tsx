import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { ProvenanceBadge } from '../common/ProvenanceBadge.js';
import { DisclaimerBanner } from '../common/DisclaimerBanner.js';
import {
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck,
  User, Activity, FileText, ArrowRight, ArrowLeft, Pill, HeartPulse
} from 'lucide-react';

interface SummaryReviewProps {
  onConfirmed: () => void;
  onBack: () => void;
}

export const SummaryReview: React.FC<SummaryReviewProps> = ({ onConfirmed, onBack }) => {
  const { language, t } = useLanguage();
  const { activeSessionId, activePatientId } = useDemo();

  const [summary, setSummary] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  useEffect(() => {
    setIsGenerating(true);
    api.generateAiSummary(activeSessionId, activePatientId)
      .then(res => {
        setSummary(res);
      })
      .catch(() => {})
      .finally(() => setIsGenerating(false));
  }, [activeSessionId, activePatientId]);

  if (isGenerating || !summary) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <div className="w-14 h-14 border-4 border-ayush-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          Fusing Multi-Source Clinical Intelligence...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Unifying Patient Voice + Touch Answers + OCR Records + AYUSH Prakriti + ABDM Data...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1 rounded-full">
          Step 11 of 12: Pre-Consultation Summary Review
        </span>
      </div>

      <DisclaimerBanner />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 mt-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ayush-100 dark:bg-ayush-950 text-ayush-800 dark:text-ayush-300 text-xs font-bold rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Physician-Ready Clinical Snapshot (v{summary.version})
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {language === 'hi' ? 'क्या यह जानकारी सही है?' : 'Is this information accurate?'}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Created: {new Date(summary.createdAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Patient Snapshot */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Clinical Snapshot
          </h3>
          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
            {summary.patientSnapshot}
          </p>
        </div>

        {/* 2-Col Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allergies */}
          <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
            <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Known Allergies (Allergy Alert)
            </h4>
            {summary.allergies.map((al: any, i: number) => (
              <div key={i} className="text-xs font-semibold text-rose-950 dark:text-rose-200">
                • {al.allergen} ({al.severity}): {al.reaction}
              </div>
            ))}
          </div>

          {/* Current Medications */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-blue-600" />
              Current Medications ({summary.medicationHistory.length})
            </h4>
            <div className="space-y-1">
              {summary.medicationHistory.map((m: any, i: number) => (
                <div key={i} className="text-xs text-blue-950 dark:text-blue-200 flex items-center justify-between">
                  <span className="font-semibold">{m.name} {m.dose} ({m.freq})</span>
                  <span className="text-[10px] text-blue-600 opacity-80">{m.source}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AYUSH Assessment Pane */}
        {summary.ayushAssessmentSummary && (
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              AYUSH Dashavidha & Prakriti Assessment
            </h4>
            <p className="text-emerald-950 dark:text-emerald-200 leading-relaxed font-medium">
              {summary.ayushAssessmentSummary}
            </p>
          </div>
        )}

        {/* Provenance Traceability Tags */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            Information Provenance & Traceability (How this was gathered)
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.provenanceSummary.slice(0, 5).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                <ProvenanceBadge source={p.source} confidence={p.confidence} />
                <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium truncate max-w-[200px]">
                  {p.fact}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirmed}
          className="w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span>{language === 'hi' ? 'जानकारी सत्यापित करें और टोकन नंबर प्राप्त करें' : 'Confirm Information & Issue Queue Token'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
