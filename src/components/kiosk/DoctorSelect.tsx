import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { Practitioner } from '../../types/index.js';
import {
  Stethoscope, Award, Clock, Users,
  CheckCircle2, ArrowLeft, ArrowRight, MapPin, Sparkles
} from 'lucide-react';

interface DoctorSelectProps {
  onSelect: (doctor: Practitioner) => void;
  onBack: () => void;
}

export const DoctorSelect: React.FC<DoctorSelectProps> = ({ onSelect, onBack }) => {
  const { language, t } = useLanguage();
  const { selectedDepartmentId, selectedHospitalId, selectedPractitionerId, setSelectedPractitionerId } = useDemo();
  const [doctors, setDoctors] = useState<Practitioner[]>([]);

  useEffect(() => {
    api.getDoctors(selectedDepartmentId, selectedHospitalId).then(setDoctors);
  }, [selectedDepartmentId, selectedHospitalId]);

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1 rounded-full">
          Step 5 of 12: Doctor / OPD Selection
        </span>
      </div>

      <div className="text-center max-w-lg mx-auto mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {t.selectDoctor}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {language === 'hi'
            ? 'परामर्शदाता विशेषज्ञ चुनें। आपका केस सारांश सीधे उनके डैशबोर्ड में खुलेगा।'
            : 'Select consulting physician. Pre-intake structured summary will sync directly to their workstation.'}
        </p>
      </div>

      <div className="space-y-4">
        {doctors.map(doc => {
          const isSelected = selectedPractitionerId === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => {
                setSelectedPractitionerId(doc.id);
                onSelect(doc);
              }}
              className={`cursor-pointer rounded-2xl p-6 border-2 transition-all transform hover:-translate-y-0.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isSelected
                  ? 'border-ayush-600 bg-ayush-50/80 dark:bg-ayush-950/50 ring-4 ring-ayush-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-ayush-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ayush-600 to-ayush-800 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {doc.name}
                    </h3>
                    {doc.id === 'PRAC-01' && (
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                        <Sparkles className="w-3 h-3" /> Hero Doctor
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-ayush-700 dark:text-ayush-400">
                    {doc.title} • {doc.specialty}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> {doc.qualifications} ({doc.experienceYears} yrs exp)
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {doc.roomNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Queue Pill */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-700">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.opdTiming}</span>
                  </div>
                  <div className="text-xs text-ayush-700 dark:text-ayush-300 font-bold mt-0.5">
                    Current Queue: {doc.activeQueueCount} patients (~{doc.activeQueueCount * doc.avgConsultationMins}m wait)
                  </div>
                </div>

                <button
                  className={`mt-2 px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    isSelected ? 'bg-ayush-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isSelected ? 'Selected' : 'Select Doctor'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
