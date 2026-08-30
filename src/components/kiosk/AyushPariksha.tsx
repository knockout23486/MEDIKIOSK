import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { Sparkles, ArrowLeft, ArrowRight, CheckCircle2, Flame, RefreshCw } from 'lucide-react';

interface AyushParikshaProps {
  onCompleted: (assessment: any) => void;
  onBack: () => void;
}

export const AyushPariksha: React.FC<AyushParikshaProps> = ({ onCompleted, onBack }) => {
  const { language, t, speak } = useLanguage();
  const { activeSessionId } = useDemo();

  const [prakritiAnswers, setPrakritiAnswers] = useState({
    bodyFrame: 'VATA_FRAME',
    skinHair: 'VATA_SKIN',
    appetiteAgni: 'VISHAMAGNI',
    bowelKoshtha: 'KRURA_KOSHTHA',
    sleepMind: 'VATA_MIND'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [livePrakriti, setLivePrakriti] = useState({
    vata: 55,
    pitta: 30,
    kapha: 15,
    dominant: 'VATA_PITTA'
  });

  const updateAnswer = (key: string, value: string) => {
    const updated = { ...prakritiAnswers, [key]: value };
    setPrakritiAnswers(updated);

    // Live calculate doshic percentages
    let v = 20; let p = 20; let k = 20;
    Object.values(updated).forEach(val => {
      if (val.includes('VATA') || val.includes('VISHAM') || val.includes('KRURA')) v += 25;
      if (val.includes('PITTA') || val.includes('TIKSHNA') || val.includes('MRIDU')) p += 25;
      if (val.includes('KAPHA') || val.includes('MANDA') || val.includes('MADHYA')) k += 25;
    });
    const total = v + p + k;
    const vPct = Math.round((v / total) * 100);
    const pPct = Math.round((p / total) * 100);
    const kPct = 100 - (vPct + pPct);

    let dom = 'VATA_PITTA';
    if (vPct > 45) dom = 'VATA';
    if (vPct >= 40 && pPct >= 30) dom = 'VATA_PITTA';
    if (pPct > 45) dom = 'PITTA';

    setLivePrakriti({ vata: vPct, pitta: pPct, kapha: kPct, dominant: dom });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const assessment = await api.saveAyushAssessment(activeSessionId, prakritiAnswers);
      onCompleted(assessment);
    } catch (e) {
      console.error(e);
      onCompleted(livePrakriti);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>
        <span className="text-xs bg-ayush-100 text-ayush-800 font-bold px-3 py-1 rounded-full border border-ayush-200">
          AYUSH Module: Dashavidha Pariksha
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-ayush-100 text-ayush-800 text-xs font-bold rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Ministry of Ayush / AIIA Clinical Protocol
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.ayushAssessment}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.dashavidhaPariksha}
          </p>
        </div>

        {/* Live Dosha Radar / Percentage Card */}
        <div className="bg-gradient-to-r from-ayush-900 via-slate-900 to-ayush-950 text-white rounded-2xl p-5 mb-8 shadow-inner border border-ayush-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ayush-300">
              Live Prakriti Synthesis
            </span>
            <span className="text-xs bg-ayush-700/80 px-2.5 py-0.5 rounded-full font-mono font-bold text-amber-300">
              Dominant: {livePrakriti.dominant}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-xl p-3">
              <span className="text-xs text-slate-300 font-semibold block">Vata (वायु)</span>
              <span className="text-2xl font-extrabold text-blue-300">{livePrakriti.vata}%</span>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <span className="text-xs text-slate-300 font-semibold block">Pitta (अग्नि)</span>
              <span className="text-2xl font-extrabold text-amber-300">{livePrakriti.pitta}%</span>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <span className="text-xs text-slate-300 font-semibold block">Kapha (जल/पृथ्वी)</span>
              <span className="text-2xl font-extrabold text-emerald-300">{livePrakriti.kapha}%</span>
            </div>
          </div>
        </div>

        {/* Questionnaire */}
        <div className="space-y-6">
          {/* 1. Agni (Digestive Fire) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              1. Agni Assessment (भूख एवं पाचन अग्नि)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'VISHAMAGNI', labelHi: 'विषमाग्नि (अनियमित भूख / Vata)', labelEn: 'Vishamagni (Irregular)' },
                { val: 'MANDAGNI', labelHi: 'मन्दाग्नि (सुस्त भूख, भारीपन / Kapha)', labelEn: 'Mandagni (Sluggish)' },
                { val: 'TIKSHNAGNI', labelHi: 'तीक्ष्णाग्नि (तीव्र भूख, जलन / Pitta)', labelEn: 'Tikshnagni (Sharp/Hyperactive)' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => updateAnswer('appetiteAgni', opt.val)}
                  className={`p-3 rounded-xl text-left text-xs font-bold border transition ${
                    prakritiAnswers.appetiteAgni === opt.val
                      ? 'border-ayush-600 bg-ayush-100 text-ayush-900 dark:bg-ayush-950 dark:text-ayush-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {language === 'hi' ? opt.labelHi : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Koshtha (Bowel pattern) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-ayush-600" />
              2. Koshtha Assessment (कोष्ठ / पेट साफ होने का स्वभाव)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'KRURA_KOSHTHA', labelHi: 'क्रूर कोष्ठ (कब्ज, सूखा मल / Vata)', labelEn: 'Krura (Constipated/Hard)' },
                { val: 'MADHYAMA_KOSHTHA', labelHi: 'मध्यम कोष्ठ (दैनिक सामान्य साफ)', labelEn: 'Madhyama (Regular)' },
                { val: 'MRIDU_KOSHTHA', labelHi: 'मृदु कोष्ठ (जल्दी दस्त / Pitta)', labelEn: 'Mridu (Soft/Loose)' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => updateAnswer('bowelKoshtha', opt.val)}
                  className={`p-3 rounded-xl text-left text-xs font-bold border transition ${
                    prakritiAnswers.bowelKoshtha === opt.val
                      ? 'border-ayush-600 bg-ayush-100 text-ayush-900 dark:bg-ayush-950 dark:text-ayush-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {language === 'hi' ? opt.labelHi : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Physical Frame */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
            <label className="block text-sm font-extrabold text-slate-900 dark:text-white mb-2">
              3. Physical Frame & Joints (शारीरिक बनावट एवं संधि स्थिति)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { val: 'VATA_FRAME', labelHi: 'पतला शरीर, जोड़ों में आवाज (Vata)', labelEn: 'Lean, prominent joints' },
                { val: 'PITTA_FRAME', labelHi: 'मध्यम गठीला, त्वचा गर्म (Pitta)', labelEn: 'Medium muscular build' },
                { val: 'KAPHA_FRAME', labelHi: 'चौड़ा, भारी, मजबूत शरीर (Kapha)', labelEn: 'Broad, sturdy frame' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => updateAnswer('bodyFrame', opt.val)}
                  className={`p-3 rounded-xl text-left text-xs font-bold border transition ${
                    prakritiAnswers.bodyFrame === opt.val
                      ? 'border-ayush-600 bg-ayush-100 text-ayush-900 dark:bg-ayush-950 dark:text-ayush-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {language === 'hi' ? opt.labelHi : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={isSubmitting}
          className="mt-8 w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Synthesizing Dashavidha Pariksha...</span>
          ) : (
            <>
              <span>{language === 'hi' ? 'दशविध परीक्षा सुरक्षित करें और दस्तावेज अपलोड करें' : 'Save AYUSH Assessment & Upload Records'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
