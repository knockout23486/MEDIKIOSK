import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { Hospital } from '../../types/index.js';
import { Building2, MapPin, Phone, Users, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface HospitalSelectProps {
  onSelect: (hospital: Hospital) => void;
  onBack: () => void;
}

export const HospitalSelect: React.FC<HospitalSelectProps> = ({ onSelect, onBack }) => {
  const { language, t } = useLanguage();
  const { selectedHospitalId, setSelectedHospitalId } = useDemo();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    api.getHospitals().then(setHospitals);
  }, []);

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
          Step 3 of 12: Hospital Selection
        </span>
      </div>

      <div className="text-center max-w-lg mx-auto mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {t.selectHospital}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {language === 'hi' ? 'कृपया अपना नजदीकी या पसंदीदा संस्थान चुनें।' : 'Select institution for OPD consultation and case-taking.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hospitals.map(hosp => {
          const isSelected = selectedHospitalId === hosp.id;
          return (
            <div
              key={hosp.id}
              onClick={() => {
                setSelectedHospitalId(hosp.id);
                onSelect(hosp);
              }}
              className={`cursor-pointer rounded-3xl p-6 border-2 transition-all transform hover:-translate-y-1 shadow-md hover:shadow-xl flex flex-col justify-between ${
                isSelected
                  ? 'border-ayush-600 bg-ayush-50/70 dark:bg-ayush-950/40 ring-4 ring-ayush-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-ayush-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isSelected ? 'bg-ayush-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  {isSelected && (
                    <span className="bg-ayush-600 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug mb-2">
                  {hosp.name}
                </h3>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{hosp.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{hosp.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>OPDs: {hosp.activeOpdCount}</span>
                </div>
                <span className="font-semibold text-ayush-700 dark:text-ayush-400">
                  Queue: {hosp.currentQueueLength} waiting
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
