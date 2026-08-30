import React from 'react';
import { ShieldCheck, Lock, FileText, Database, UserCheck, Eye } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-ayush-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-emerald-600/80 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4" />
          Digital Personal Data Protection (DPDP) Act 2023
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          MediKiosk Privacy & Data Governance Center
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Comprehensive compliance architecture ensuring privacy-by-design, granular consent lifecycle, non-exposure of sensitive identifiers, and immutable audit logs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-ayush-600" />
            1. Purpose Limitation & Data Minimization
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Data collected through speech and touch is strictly bound to pre-consultation case-taking and clinical history synthesis for the attending physician. Data is never used for profiling, commercial marketing, or external monetization.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            2. Data Principal Consent Lifecycle
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Citizens give granular, informed consent prior to case-taking. Every consent grant and modification creates an immutable audit artifact containing version, scope, IP address, and electronic signature hash.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            3. Temporary Session & Retention Policy
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Raw ephemeral voice audio stream buffers are purged immediately following transcription extraction. Medical records remain encrypted at rest and in transit using TLS 1.3 standards.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600" />
            4. Masked Identifier Protection
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            ABHA IDs and demographic details are masked on public kiosk interfaces (`91-****-****-4821`) preventing shoulder surfing in busy hospital waiting halls.
          </p>
        </div>
      </div>
    </div>
  );
};
