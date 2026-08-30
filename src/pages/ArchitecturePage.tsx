import React from 'react';
import { Cpu, Server, Activity, Database, ShieldCheck, ArrowRight } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-clinical-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-clinical-600/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Cpu className="w-4 h-4" />
          Technical Architecture & Interoperability Model
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          MediKiosk System Architecture
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Multi-tier clinical intake platform integrating Web Speech ASR, OCR pipelines, clinical ontology decision trees, ABDM M1/M2/M3 FHIR gateways, and Hospital Information Systems.
        </p>
      </div>

      {/* Layer-by-Layer Architecture Cards */}
      <div className="space-y-4">
        {/* Tier 1: Patient & Kiosk Tier */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          <div className="flex items-center gap-2.5 text-ayush-800 dark:text-ayush-300 font-extrabold text-base mb-2">
            <span className="w-7 h-7 bg-ayush-100 dark:bg-ayush-950 rounded-lg flex items-center justify-center text-xs font-mono">1</span>
            Patient Kiosk & Multimodal Intake Tier
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Responsive touch-first kiosk & mobile PWA interface with Hindi/English audio guidance, Web Speech ASR, large touch targets, and offline-degraded safety fallback.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Web Speech API</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Audio TTS Guidance</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">High Contrast Mode</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">DPDP Consent Engine</span>
          </div>
        </div>

        {/* Tier 2: AI & Clinical Intelligence Tier */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          <div className="flex items-center gap-2.5 text-blue-800 dark:text-blue-300 font-extrabold text-base mb-2">
            <span className="w-7 h-7 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center text-xs font-mono">2</span>
            Clinical Intelligence & Safety Microservices
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Rule-driven clinical decision trees, emergency red-flag safety detectors, multi-stage OCR pipelines, abnormal reference range flags, and provenance tracking.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Clinical Ontology Engine</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">AYUSH Dashavidha Pariksha</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Real-Time Red-Flag Triage</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Medical Entity NER</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Provenance Fuser</span>
          </div>
        </div>

        {/* Tier 3: Workstation & Interoperability Tier */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 font-extrabold text-base mb-2">
            <span className="w-7 h-7 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center text-xs font-mono">3</span>
            Doctor Workstation & National Health Interoperability Layer
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
            Physician verification workstation with versioning, prescription generator with ICD-11 / NAMASTE Ayush coding, and FHIR R4 / HL7 data transmission adapters.
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] font-mono">
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">Physician Verification Stamp</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">FHIR R4 Composition</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">ABDM M1/M2/M3 Sandbox</span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">HIS EMR Sync Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};
