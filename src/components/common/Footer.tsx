import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, FileText, Cpu, HeartHandshake } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Activity className="w-5 h-5 text-ayush-500" />
            MediKiosk Platform
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Smart Clinical Pre-Intake & Case-Taking System. Developed for the Ministry of Ayush / All India Institute of Ayurveda under SIH 2026 (Problem Statement ID: 26047).
          </p>
        </div>

        <div>
          <h4 className="text-slate-200 font-semibold mb-2">Core Clinical Engines</h4>
          <ul className="space-y-1 text-xs">
            <li>• Adaptive Clinical Ontology & Questioning</li>
            <li>• AYUSH Dashavidha Pariksha & Agni/Koshtha</li>
            <li>• Real-Time Emergency Red-Flag Triage</li>
            <li>• Document OCR & Medical Entity Extraction</li>
            <li>• Unified Information Fusion & Provenance</li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-200 font-semibold mb-2">Interoperability & Safety</h4>
          <ul className="space-y-1 text-xs">
            <li>• ABDM Milestone 1, 2, 3 FHIR R4 Ready</li>
            <li>• Hospital Information System (HIS/EMR) Gateway</li>
            <li>• DPDP Act 2023 Granular Consent Architecture</li>
            <li>• Immutable System Audit Logging</li>
            <li>• Mandatory Physician Review Principle</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="text-slate-200 font-semibold">Demo & Presentation</h4>
          <div className="flex flex-col gap-1.5">
            <Link to="/demo" className="text-amber-400 hover:underline flex items-center gap-1">
              ⭐ SIH 2026 Demo Control Suite
            </Link>
            <Link to="/privacy" className="hover:text-slate-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> DPDP Privacy Center
            </Link>
            <Link to="/architecture" className="hover:text-slate-200 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> Architecture & Data Flow Visualizer
            </Link>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            AI Assists. Clinicians Decide. © 2026 MediKiosk.
          </p>
        </div>
      </div>
    </footer>
  );
};
