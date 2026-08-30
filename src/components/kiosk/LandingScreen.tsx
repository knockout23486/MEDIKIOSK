import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import {
  UserCheck, UserPlus, AlertCircle, Sparkles,
  Volume2, ShieldCheck, ArrowRight, Activity, Building2, CheckCircle2
} from 'lucide-react';

interface LandingScreenProps {
  onSelectExisting: () => void;
  onSelectNew: () => void;
  onSelectEmergency: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onSelectExisting,
  onSelectNew,
  onSelectEmergency
}) => {
  const { t, language, speak } = useLanguage();
  const { loadHeroPatient } = useDemo();

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-ayush-900 via-ayush-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden mb-8 border border-ayush-700/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-ayush-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-ayush-700/60 border border-ayush-500/40 px-3 py-1 rounded-full text-xs font-semibold text-ayush-200 mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI-Powered Clinical Intake & Case-Taking
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            {language === 'hi'
              ? 'नमस्ते! डॉक्टर से मिलने से पहले अपना विवरण पूरा करें।'
              : 'Welcome to MediKiosk Clinical Intake.'}
          </h1>

          <p className="text-slate-200 text-sm sm:text-base mt-3 leading-relaxed">
            {language === 'hi'
              ? 'अपनी भाषा में बोलकर या स्क्रीन पर छूकर अपनी तकलीफ, पुराने पर्चे और रिपोर्ट्स बताएं। आपका सारांश सीधे आपके डॉक्टर के पास पहुंचेगा।'
              : 'Complete your structured clinical history, prior documents, and AYUSH assessment in your own language before entering the OPD consultation room.'}
          </p>

          {/* Audio Guidance Helper Button */}
          <button
            onClick={() => speak(
              language === 'hi'
                ? 'मेडीकियोस्क में आपका स्वागत है। डॉक्टर से मिलने से पहले कृपया अपना आभा नंबर या पंजीकरण चुनें। सहायता के लिए माइक पर बोल सकते हैं।'
                : 'Welcome to MediKiosk. Please select your intake option below to proceed.'
            )}
            className="mt-5 inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-4 py-2 rounded-xl transition border border-white/20"
          >
            <Volume2 className="w-4 h-4 text-amber-300" />
            {language === 'hi' ? 'ऑडियो मार्गदर्शन सुनें (Listen Guidance)' : 'Listen to Audio Instructions'}
          </button>
        </div>

        {/* Institution Badge */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-ayush-400" />
            <span>All India Institute of Ayurveda (AIIA) — Smart OPD Kiosk Terminal #03</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium mt-2 sm:mt-0">
            <ShieldCheck className="w-4 h-4" />
            DPDP Act 2023 Compliant • ABDM M1/M2/M3
          </div>
        </div>
      </div>

      {/* Hero 3 Action Cards with Large Touch Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* 1. Existing Patient (ABHA Linked) */}
        <button
          onClick={onSelectExisting}
          className="group text-left bg-white dark:bg-slate-800 rounded-3xl p-7 border-2 border-slate-200 dark:border-slate-700 hover:border-ayush-600 dark:hover:border-ayush-500 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 relative flex flex-col justify-between"
        >
          <div>
            <div className="w-16 h-16 rounded-2xl bg-ayush-100 dark:bg-ayush-950/80 text-ayush-700 dark:text-ayush-400 flex items-center justify-center mb-5 group-hover:bg-ayush-600 group-hover:text-white transition-colors shadow-sm">
              <UserCheck className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t.existingPatient}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              {language === 'hi'
                ? 'यदि आपके पास पहले से आभा (ABHA) नंबर या अस्पताल पंजीकरण है।'
                : 'Verify with 14-digit ABHA number, scanned QR, or mobile OTP.'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-ayush-700 dark:text-ayush-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
            <span>{language === 'hi' ? 'आभा से आगे बढ़ें' : 'Proceed with ABHA'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </button>

        {/* 2. New Patient Registration */}
        <button
          onClick={onSelectNew}
          className="group text-left bg-white dark:bg-slate-800 rounded-3xl p-7 border-2 border-slate-200 dark:border-slate-700 hover:border-clinical-600 dark:hover:border-clinical-500 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 relative flex flex-col justify-between"
        >
          <div>
            <div className="w-16 h-16 rounded-2xl bg-clinical-50 dark:bg-clinical-950/80 text-clinical-600 dark:text-clinical-400 flex items-center justify-center mb-5 group-hover:bg-clinical-600 group-hover:text-white transition-colors shadow-sm">
              <UserPlus className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {t.newPatient}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              {language === 'hi'
                ? 'पहली बार आए हैं? त्वरित नया पर्चा और आंतरिक मेडीकियोस्क आईडी बनाएं।'
                : 'First time visitor? Create a MediKiosk Patient ID with fast ABHA creation simulation.'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-clinical-600 dark:text-clinical-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
            <span>{language === 'hi' ? 'नया पंजीकरण करें' : 'Start Registration'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </button>

        {/* 3. Emergency / Immediate Help (Red Flag Triage) */}
        <button
          onClick={onSelectEmergency}
          className="group text-left bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/30 rounded-3xl p-7 border-2 border-red-300 dark:border-red-800 hover:border-red-600 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 relative flex flex-col justify-between"
        >
          <div>
            <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center mb-5 shadow-md animate-pulse">
              <AlertCircle className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">
              {t.emergencyHelp}
            </h2>
            <p className="text-red-700 dark:text-red-400 text-xs sm:text-sm leading-relaxed font-medium">
              {language === 'hi'
                ? 'छाती में तेज दर्द, सांस लेने में भारी तकलीफ, बेहोशी या गंभीर चोट हेतु तत्काल सहायता।'
                : 'Severe chest pain, breathlessness, neurological deficit, or severe bleeding.'}
            </p>
          </div>

          <div className="mt-6 flex items-center text-red-700 dark:text-red-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
            <span>{language === 'hi' ? 'तत्काल ट्रायज सहायता' : 'Trigger Emergency Triage'}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </button>
      </div>

      {/* Judge One-Click Hero Presentation Trigger Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <span>SIH 2026 Hero Journey: Smt. Radha Sharma (58 F)</span>
              <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold px-2 py-0.5 rounded">
                Recommended for Judges
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              1-Click complete journey: ABHA demo linking → AYUSH Dashavidha intake → Voice/touch history → OCR documents → AI summary → Token queue → Doctor consultation.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadHeroPatient()}
          className="w-full sm:w-auto shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm px-5 py-2.5 rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          Launch Hero Demo
        </button>
      </div>
    </div>
  );
};
