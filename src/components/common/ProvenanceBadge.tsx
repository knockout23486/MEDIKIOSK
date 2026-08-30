import React from 'react';
import { ProvenanceSource } from '../../types/index.js';

interface ProvenanceBadgeProps {
  source: ProvenanceSource;
  confidence?: number;
  showTooltip?: boolean;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ source, confidence }) => {
  const getBadgeStyle = () => {
    switch (source) {
      case 'PATIENT_VOICE':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          label: 'Patient Voice (ASR)',
          icon: '🎙️'
        };
      case 'PATIENT_TOUCH':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Patient Touch',
          icon: '👆'
        };
      case 'OCR_DOCUMENT':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'OCR Document Extraction',
          icon: '📄'
        };
      case 'ABDM_FHIR':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'ABDM FHIR Record',
          icon: '🏛️'
        };
      case 'AI_INFERENCE':
        return {
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          label: 'AI Synthesis',
          icon: '🧠'
        };
      case 'PHYSICIAN':
        return {
          bg: 'bg-teal-100 text-teal-800 border-teal-300',
          label: 'Physician Verified',
          icon: '🩺'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          label: source,
          icon: '📌'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg}`}>
      <span>{style.icon}</span>
      <span>{style.label}</span>
      {confidence !== undefined && (
        <span className="opacity-75 font-mono text-[10px] ml-0.5">({Math.round(confidence * 100)}%)</span>
      )}
    </span>
  );
};
