import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import {
  QrCode, Smartphone, CreditCard, ShieldCheck,
  CheckCircle2, ArrowRight, ArrowLeft, Sparkles, User
} from 'lucide-react';

interface AbhaVerificationProps {
  onVerified: (patientData: any) => void;
  onBack: () => void;
}

export const AbhaVerification: React.FC<AbhaVerificationProps> = ({ onVerified, onBack }) => {
  const { language, t } = useLanguage();
  const { loadHeroPatient } = useDemo();

  const [tab, setTab] = useState<'number' | 'qr' | 'mobile'>('number');
  const [abhaNumber, setAbhaNumber] = useState<string>('91-4829-1029-4821');
  const [otp, setOtp] = useState<string>('884219');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedPatient, setVerifiedPatient] = useState<any>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAbha(abhaNumber, otp);
      // Fetch full patient data
      const heroPatient = await api.getPatient('PAT-HERO-01');
      setVerifiedPatient(heroPatient);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectDemoHero = async () => {
    setIsVerifying(true);
    setAbhaNumber('91-4829-1029-4821');
    const heroPatient = await api.getPatient('PAT-HERO-01');
    setVerifiedPatient(heroPatient);
    setIsVerifying(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back to Home'}
        </button>
        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          ABDM Sandbox M1 Ready
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="w-14 h-14 bg-ayush-100 dark:bg-ayush-950 text-ayush-700 dark:text-ayush-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CreditCard className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t.abhaVerificationTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'hi'
              ? 'कृपया अपना आभा नंबर, क्यूआर कोड या ओटीपी से पहचान सत्यापित करें।'
              : 'Authenticate identity via ABHA number, scanned QR, or simulated mobile OTP.'}
          </p>
        </div>

        {/* 1-Click Hero Demo Shortcut Card */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {language === 'hi' ? 'त्वरित डेमो मरीज चुनें' : 'SIH Demo Quick Select'}
              </div>
              <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Smt. Radha Sharma (58 F, Knee Pain / Sandhivata) • ABHA: 91-4829-1029-4821
              </div>
            </div>
          </div>
          <button
            onClick={handleSelectDemoHero}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition shadow"
          >
            {t.useDemoPatient}
          </button>
        </div>

        {!verifiedPatient ? (
          <div>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
              <button
                onClick={() => setTab('number')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition ${
                  tab === 'number'
                    ? 'border-ayush-600 text-ayush-700 dark:text-ayush-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {language === 'hi' ? 'आभा नंबर' : 'ABHA Number'}
              </button>
              <button
                onClick={() => setTab('qr')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition ${
                  tab === 'qr'
                    ? 'border-ayush-600 text-ayush-700 dark:text-ayush-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                {language === 'hi' ? 'क्यूआर स्कैन' : 'Scan QR'}
              </button>
              <button
                onClick={() => setTab('mobile')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition ${
                  tab === 'mobile'
                    ? 'border-ayush-600 text-ayush-700 dark:text-ayush-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                {language === 'hi' ? 'मोबाइल ओटीपी' : 'Mobile OTP'}
              </button>
            </div>

            {/* Tab 1: Number */}
            {tab === 'number' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    14-Digit ABHA ID / Address
                  </label>
                  <input
                    type="text"
                    value={abhaNumber}
                    onChange={e => setAbhaNumber(e.target.value)}
                    placeholder="91-XXXX-XXXX-XXXX or name@abdm"
                    className="w-full text-lg font-mono p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-ayush-500 focus:border-ayush-500 outline-none"
                  />
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center justify-between">
                  <span>Demo ABHA Sandbox:</span>
                  <span className="font-mono text-emerald-600 font-bold">91-4829-1029-4821</span>
                </div>
              </div>
            )}

            {/* Tab 2: QR Scanner Simulation */}
            {tab === 'qr' && (
              <div className="text-center py-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <QrCode className="w-24 h-24 mx-auto text-ayush-700 dark:text-ayush-400 mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {language === 'hi' ? 'कियोस्क स्कैनर के सामने क्यूआर कोड रखें' : 'Hold Ayushman Bharat QR card to kiosk camera'}
                </p>
                <button
                  onClick={handleSelectDemoHero}
                  className="mt-4 px-4 py-2 bg-ayush-700 hover:bg-ayush-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Simulate QR Scan Complete
                </button>
              </div>
            )}

            {/* Tab 3: Mobile OTP */}
            {tab === 'mobile' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Registered Mobile Number
                  </label>
                  <input
                    type="text"
                    defaultValue="+91 98765 43210"
                    className="w-full text-base font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    6-Digit Verification OTP (Demo pre-filled)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    className="w-full text-xl font-mono text-center tracking-widest p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="mt-6 w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span>Verifying with ABDM Gateway...</span>
              ) : (
                <>
                  <span>{language === 'hi' ? 'सत्यापित करें और आगे बढ़ें' : 'Verify & Retrieve Health Record'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Verified Citizen Card */
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-600 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {verifiedPatient.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      <span>Age: {verifiedPatient.age} yrs</span>
                      <span>•</span>
                      <span>Gender: {verifiedPatient.gender}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        ABHA: {verifiedPatient.abhaNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  KYC Verified
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">MediKiosk Patient ID:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {verifiedPatient.mkPatientId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">ABHA Address:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {verifiedPatient.abhaAddress}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Emergency Contact:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {verifiedPatient.emergencyContact?.name}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onVerified(verifiedPatient)}
              className="w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>{language === 'hi' ? 'सहमति स्क्रीन पर आगे बढ़ें' : 'Proceed to DPDP Consent'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
