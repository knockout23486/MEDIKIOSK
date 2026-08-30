import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { api } from '../../services/api.js';
import {
  ShieldCheck, Volume2, CheckCircle2, XCircle,
  FileText, Mic, Image, Sparkles, Building2, ArrowLeft, ArrowRight
} from 'lucide-react';

interface ConsentEngineProps {
  patientId: string;
  onConsentAccepted: () => void;
  onConsentDeclined: () => void;
  onBack: () => void;
}

export const ConsentEngine: React.FC<ConsentEngineProps> = ({
  patientId,
  onConsentAccepted,
  onConsentDeclined,
  onBack
}) => {
  const { language, t, speak } = useLanguage();

  const [purposes, setPurposes] = useState({
    personalInfo: true,
    clinicalHistory: true,
    voiceRecording: true,
    ocrDocuments: true,
    aiSummary: true,
    abdmDataExchange: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePurpose = (key: keyof typeof purposes) => {
    setPurposes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      await api.grantConsent({
        patientId,
        version: 'v2.4-DPDP-2026',
        purposes,
        status: 'ACTIVE',
        signatureType: 'ELECTRONIC_DEMO'
      });
      onConsentAccepted();
    } catch (err) {
      console.error(err);
      onConsentAccepted();
    } finally {
      setIsSubmitting(false);
    }
  };

  const playConsentAudio = () => {
    const audioText = language === 'hi'
      ? 'मेडीकियोस्क आपकी व्यक्तिगत जानकारी, लक्षणों की आवाज रिकॉर्डिंग और पुराने पर्चों का उपयोग केवल डॉक्टर के लिए सारांश बनाने के लिए करेगा। एआई कोई स्वतंत्र निदान नहीं करेगा। अंतिम निर्णय केवल डॉक्टर का होगा। क्या आप सहमत हैं?'
      : 'MediKiosk collects your clinical responses, voice recording, and uploaded prescriptions strictly to assist your doctor. The AI does not independently diagnose. The physician remains responsible for all medical decisions.';
    speak(audioText);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      {/* Header Back */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-ayush-100 text-ayush-800 font-bold px-3 py-1 rounded-full border border-ayush-300">
          DPDP Act 2023 Consent Protocol (v2.4)
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-ayush-700 text-white rounded-2xl flex items-center justify-center shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {t.consentTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.consentSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={playConsentAudio}
            className="inline-flex items-center gap-2 bg-ayush-50 dark:bg-ayush-950 text-ayush-800 dark:text-ayush-300 border border-ayush-300 dark:border-ayush-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-ayush-100 transition shadow-sm"
          >
            <Volume2 className="w-4 h-4 text-ayush-700" />
            {language === 'hi' ? 'सहमति ऑडियो सुनें' : 'Audio Explanation'}
          </button>
        </div>

        {/* 3 Structured Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {/* Column 1: What is collected */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              {t.whatCollected}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Demographic profile & ABHA link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Clinical complaint & pain history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Voice audio recordings during case-taking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>Uploaded prescriptions, CBC, and discharge summaries for OCR</span>
              </li>
            </ul>
          </div>

          {/* Column 2: What it will be used for */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ayush-600" />
              {t.whatUsedFor}
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-ayush-600 font-bold">•</span>
                <span>Preparing a structured clinical summary for the doctor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ayush-600 font-bold">•</span>
                <span>Constructing a chronological medical timeline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ayush-600 font-bold">•</span>
                <span>Screening for emergency red-flag symptoms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ayush-600 font-bold">•</span>
                <span>Authorizing ABDM FHIR health record exchange</span>
              </li>
            </ul>
          </div>

          {/* Column 3: What will NOT happen (Safety Guarantee) */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl p-5 border border-emerald-300 dark:border-emerald-700">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t.whatNotHappen}
            </h3>
            <ul className="space-y-2 text-xs text-emerald-800 dark:text-emerald-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✕</span>
                <span className="font-semibold">AI will NOT independently diagnose.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✕</span>
                <span>No automated medicine ordering or discontinuation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✕</span>
                <span>Data is NEVER sold or used for commercial ads.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="font-bold">Doctor remains in 100% control of diagnosis and prescription.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Granular Consent Controls */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
            Granular Consent Preferences (Toggle Allowed)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={purposes.voiceRecording}
                onChange={() => togglePurpose('voiceRecording')}
                className="w-4 h-4 text-ayush-600 rounded"
              />
              <span>Voice Speech-to-Text Recording</span>
            </label>

            <label className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={purposes.ocrDocuments}
                onChange={() => togglePurpose('ocrDocuments')}
                className="w-4 h-4 text-ayush-600 rounded"
              />
              <span>OCR Document Entity Extraction</span>
            </label>

            <label className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={purposes.aiSummary}
                onChange={() => togglePurpose('aiSummary')}
                className="w-4 h-4 text-ayush-600 rounded"
              />
              <span>AI Clinical Summary Preparation</span>
            </label>

            <label className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={purposes.abdmDataExchange}
                onChange={() => togglePurpose('abdmDataExchange')}
                className="w-4 h-4 text-ayush-600 rounded"
              />
              <span>ABDM Health Record Interoperability</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <button
            onClick={handleAccept}
            disabled={isSubmitting}
            className="flex-1 py-4 px-6 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{t.acceptAndContinue}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onConsentDeclined}
            className="py-4 px-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4 text-slate-500" />
            <span>{t.declineConsent}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
