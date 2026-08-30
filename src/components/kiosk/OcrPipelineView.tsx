import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { ConfidenceBadge } from '../common/ConfidenceBadge.js';
import { DisclaimerBanner } from '../common/DisclaimerBanner.js';
import {
  FileText, CheckCircle2, Edit3, X, AlertTriangle,
  Sparkles, ArrowRight, ArrowLeft, ShieldCheck
} from 'lucide-react';

interface OcrPipelineViewProps {
  onContinue: () => void;
  onBack: () => void;
}

export const OcrPipelineView: React.FC<OcrPipelineViewProps> = ({ onContinue, onBack }) => {
  const { language } = useLanguage();

  const [entities, setEntities] = useState([
    {
      id: 'ENT-003',
      name: 'Hemoglobin (Hb)',
      value: '10.2',
      unit: 'g/dL',
      referenceRange: '12.0 - 15.0 g/dL',
      isAbnormal: true,
      direction: 'LOW',
      confidence: 0.98,
      verified: true
    },
    {
      id: 'ENT-004',
      name: 'ESR (1st Hour)',
      value: '34',
      unit: 'mm/hr',
      referenceRange: '0 - 20 mm/hr',
      isAbnormal: true,
      direction: 'HIGH',
      confidence: 0.97,
      verified: true
    },
    {
      id: 'ENT-005',
      name: 'Amlodipine',
      value: '5 mg',
      unit: 'OD Morning',
      referenceRange: 'Antihypertensive',
      isAbnormal: false,
      confidence: 0.96,
      verified: true
    },
    {
      id: 'ENT-006',
      name: 'Yogaraj Guggulu',
      value: '2 Tablets',
      unit: 'BD with warm water',
      referenceRange: 'Ayurvedic Anti-arthritic',
      isAbnormal: false,
      confidence: 0.95,
      verified: true
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const handleEdit = (ent: any) => {
    setEditingId(ent.id);
    setEditValue(ent.value);
  };

  const handleSaveEdit = (id: string) => {
    setEntities(prev => prev.map(e => (e.id === id ? { ...e, value: editValue } : e)));
    setEditingId(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Human-in-the-Loop Verification
        </span>
      </div>

      <DisclaimerBanner customText="AI extracted entities from uploaded medical documents. Please review and verify values before committing to timeline." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left Col: Original Document Preview */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <FileText className="w-4 h-4 text-amber-400" />
                City_PathLab_CBC_Report_2026-07-03.pdf
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-mono">OCR Processed</span>
            </div>

            {/* Document Canvas Text Box */}
            <div className="bg-slate-950 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 border border-slate-800 leading-relaxed">
              <div className="text-slate-400 pb-1 border-b border-slate-800 text-[10px] font-sans font-bold uppercase tracking-wider">
                Extracted Text Stream
              </div>
              <p className="text-slate-300">PATIENT: SMT. RADHA SHARMA (58 F)</p>
              <p className="text-slate-400">INVESTIGATION: COMPLETE BLOOD COUNT (CBC)</p>
              <p className="text-amber-300 font-bold bg-amber-950/40 p-1 rounded">
                - Hemoglobin: 10.2 g/dL [Ref: 12.0 - 15.0 g/dL] (LOW)
              </p>
              <p className="text-amber-300 font-bold bg-amber-950/40 p-1 rounded">
                - ESR (1st hour): 34 mm/hr [Ref: 0 - 20 mm/hr] (HIGH)
              </p>
              <p className="text-emerald-400">
                - Fasting Blood Sugar: 98 mg/dL [Ref: 70 - 100 mg/dL] (Normal)
              </p>
              <p className="text-emerald-400">
                - Total WBC: 6,800 /cu.mm [Ref: 4000-11000]
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Abnormal Flag: Hemoglobin below normal range (10.2 g/dL). Clinician consultation required.
            </span>
          </div>
        </div>

        {/* Right Col: Extracted Structured Entities & Human Edit */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Extracted Medical Entities ({entities.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Click 'Edit' if any OCR number needs human correction.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {entities.map(ent => (
                <div
                  key={ent.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    ent.isAbnormal
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {ent.name}
                      </span>
                      {ent.isAbnormal && (
                        <span className="text-[10px] bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded-full">
                          Abnormal {ent.direction} ↓
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs">
                      {editingId === ent.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="px-2 py-1 rounded border border-ayush-500 text-xs font-bold w-20"
                          />
                          <button
                            onClick={() => handleSaveEdit(ent.id)}
                            className="bg-ayush-700 text-white px-2 py-0.5 rounded text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {ent.value} {ent.unit}
                        </span>
                      )}
                      <span className="text-slate-400 text-[11px]">
                        Ref: {ent.referenceRange}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={ent.confidence} />
                    {editingId !== ent.id && (
                      <button
                        onClick={() => handleEdit(ent)}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-800 transition"
                        title="Edit value"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onContinue}
            className="mt-6 w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>Confirm Extracted Entities & Generate AI Summary</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
