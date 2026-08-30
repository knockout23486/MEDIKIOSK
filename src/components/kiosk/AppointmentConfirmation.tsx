import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import {
  CheckCircle2, QrCode, Clock, MapPin, Stethoscope,
  Building2, MessageSquare, Smartphone, ArrowRight, Sparkles, Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppointmentConfirmationProps {
  onGoToDoctor: () => void;
}

export const AppointmentConfirmation: React.FC<AppointmentConfirmationProps> = ({ onGoToDoctor }) => {
  const { language, t } = useLanguage();
  const { activeTokenNumber } = useDemo();

  return (
    <div className="max-w-3xl mx-auto py-4 px-4">
      {/* Success Badge */}
      <div className="bg-gradient-to-br from-emerald-600 to-ayush-800 text-white rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden mb-6">
        <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wider">
          Pre-Consultation Intake Completed
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          {t.tokenAssigned}
        </h1>

        <p className="text-emerald-100 text-sm mt-2 max-w-md mx-auto">
          {language === 'hi'
            ? 'आपका क्लिनिकल इतिहास एवं दस्तावेज डॉक्टर के वर्कस्टेशन पर पहुंच गए हैं।'
            : 'Your structured clinical history & documents have been transmitted to the doctor\'s OPD queue.'}
        </p>

        {/* Big Token Number Display */}
        <div className="mt-6 bg-white text-slate-900 rounded-2xl p-6 max-w-xs mx-auto shadow-2xl border-4 border-emerald-300">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 block">
            Your Token Number
          </span>
          <span className="text-5xl font-extrabold text-ayush-800 font-mono tracking-tight block my-1">
            {activeTokenNumber || 'A-027'}
          </span>
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-bold mt-2 pt-2 border-t border-slate-100">
            <Clock className="w-4 h-4" />
            <span>Est. Wait: 18 minutes (2 patients ahead)</span>
          </div>
        </div>
      </div>

      {/* Appointment & Room Details Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-ayush-600" />
              Consulting Vaidya / Doctor
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              Prof. (Dr.) Ananya Sharma
            </div>
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              Kayachikitsa (General Medicine & Rheumatology)
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-ayush-600" />
              Consultation Room
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              OPD Room 104 (Ground Floor)
            </div>
            <div className="text-slate-600 dark:text-slate-400 font-medium">
              All India Institute of Ayurveda, New Delhi
            </div>
          </div>
        </div>

        {/* Live Simulated Notifications Drawer Trigger */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 block">
                Simulated SMS & WhatsApp Alerts Sent
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Token confirmation & queue updates dispatched to +91 98765 43210
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-300">
            Delivered
          </span>
        </div>

        {/* Action Button: Jump to Doctor Consultation View */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGoToDoctor}
            className="flex-1 py-4 px-6 bg-clinical-600 hover:bg-clinical-700 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-5 h-5" />
            <span>Open Doctor Workstation (Next Step)</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => window.print()}
            className="py-4 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Token Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
