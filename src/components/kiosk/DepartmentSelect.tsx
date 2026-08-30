import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { Department } from '../../types/index.js';
import {
  Activity, Sparkles, Scissors, Eye, HeartHandshake,
  Smile, Sun, Stethoscope, ArrowLeft, ArrowRight, CheckCircle2
} from 'lucide-react';

interface DepartmentSelectProps {
  onSelect: (department: Department) => void;
  onBack: () => void;
}

export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({ onSelect, onBack }) => {
  const { language, t } = useLanguage();
  const { selectedHospitalId, selectedDepartmentId, setSelectedDepartmentId, setIsAyushMode } = useDemo();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    api.getDepartments(selectedHospitalId).then(setDepartments);
  }, [selectedHospitalId]);

  const getIcon = (code: string) => {
    switch (code) {
      case 'KAYA': return <Activity className="w-6 h-6 text-ayush-600" />;
      case 'PANCHA': return <Sparkles className="w-6 h-6 text-emerald-600" />;
      case 'SHALYA': return <Scissors className="w-6 h-6 text-indigo-600" />;
      case 'SHALAKYA': return <Eye className="w-6 h-6 text-purple-600" />;
      case 'STRIROGA': return <HeartHandshake className="w-6 h-6 text-rose-600" />;
      case 'KAUMAR': return <Smile className="w-6 h-6 text-amber-600" />;
      case 'SWASTHA': return <Sun className="w-6 h-6 text-orange-600" />;
      default: return <Stethoscope className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1 rounded-full">
          Step 4 of 12: Department Selection
        </span>
      </div>

      <div className="text-center max-w-xl mx-auto mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {t.selectDepartment}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {language === 'hi'
            ? 'आयुष विभाग चुनने पर दशविध परीक्षा और प्रकृति विश्लेषण सक्रिय होगा।'
            : 'Selecting an AYUSH department activates Dashavidha Pariksha, Prakriti, Agni & Koshtha intake.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map(dept => {
          const isSelected = selectedDepartmentId === dept.id;
          return (
            <div
              key={dept.id}
              onClick={() => {
                setSelectedDepartmentId(dept.id);
                setIsAyushMode(dept.isAyush);
                onSelect(dept);
              }}
              className={`cursor-pointer rounded-2xl p-5 border-2 transition-all transform hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'border-ayush-600 bg-ayush-50/80 dark:bg-ayush-950/50 ring-4 ring-ayush-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-ayush-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                    {getIcon(dept.code)}
                  </div>
                  {dept.isAyush ? (
                    <span className="bg-ayush-100 text-ayush-800 dark:bg-ayush-900 dark:text-ayush-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-ayush-200">
                      AYUSH Intake
                    </span>
                  ) : (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Modern OPD
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-1">
                  {dept.name}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {dept.description}
                </p>
              </div>

              {isSelected && (
                <div className="mt-3 pt-2 border-t border-ayush-200 dark:border-ayush-800 flex items-center justify-between text-xs text-ayush-700 dark:text-ayush-400 font-bold">
                  <span>Selected</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
