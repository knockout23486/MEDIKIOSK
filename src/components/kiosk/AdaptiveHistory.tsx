import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import { VoiceRecorder } from '../common/VoiceRecorder.js';
import { DisclaimerBanner } from '../common/DisclaimerBanner.js';
import {
  Mic, Sparkles, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle2, Volume2, ShieldAlert, Activity, User
} from 'lucide-react';

interface AdaptiveHistoryProps {
  onHistoryCompleted: (answers: any) => void;
  onEmergencyTriggered: (alert: any) => void;
  onBack: () => void;
}

export const AdaptiveHistory: React.FC<AdaptiveHistoryProps> = ({
  onHistoryCompleted,
  onEmergencyTriggered,
  onBack
}) => {
  const { language, speak } = useLanguage();
  const { activePatientId, activeSessionId, isAyushMode } = useDemo();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeInputMode, setActiveInputMode] = useState<'VOICE' | 'TOUCH'>('VOICE');
  const [redFlagAlert, setRedFlagAlert] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize questions
  useEffect(() => {
    api.getQuestions('bilateral knee pain and joint stiffness', isAyushMode).then(qs => {
      setQuestions(qs);
      if (qs.length > 0) {
        const q = qs[0];
        speak(language === 'hi' ? q.questionHi : q.questionEn);
      }
    });
  }, [isAyushMode]);

  const currentQ = questions[currentQuestionIndex];

  const handleAnswerSubmit = async (answerText: string, mode: 'VOICE' | 'TOUCH', transcript?: string) => {
    if (!currentQ) return;
    setIsSaving(true);

    try {
      const res = await api.saveClinicalAnswer({
        sessionId: activeSessionId,
        questionId: currentQ.id,
        questionText: language === 'hi' ? currentQ.questionHi : currentQ.questionEn,
        answerText,
        inputMode: mode,
        voiceTranscript: transcript,
        patientId: activePatientId
      });

      const updatedAnswers = { ...answers, [currentQ.id]: answerText };
      setAnswers(updatedAnswers);

      // Check if Emergency Red-Flag triggered
      if (res.redFlagAlert) {
        setRedFlagAlert(res.redFlagAlert);
        onEmergencyTriggered(res.redFlagAlert);
        setIsSaving(false);
        return;
      }

      // Advance to next question
      if (currentQuestionIndex < questions.length - 1) {
        const nextIdx = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIdx);
        const nextQ = questions[nextIdx];
        speak(language === 'hi' ? nextQ.questionHi : nextQ.questionEn);
      } else {
        // Completed all questions in tree
        onHistoryCompleted(updatedAnswers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (redFlagAlert) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4 animate-shake">
        <div className="bg-red-600 text-white rounded-3xl p-8 shadow-2xl border-4 border-red-400 text-center">
          <div className="w-20 h-20 bg-white text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
            {language === 'hi' ? 'आपातकालीन लक्षण अलर्ट (Emergency Triggered)' : 'Emergency Safety Alert Triggered'}
          </h2>
          <p className="text-base text-red-100 max-w-xl mx-auto mb-6 leading-relaxed">
            {language === 'hi'
              ? 'आपके बताए गए लक्षण (छाती में तेज दर्द / सांस फूलना) संभावित आपातकालीन स्थिति दर्शाते हैं। सामान्य कियोस्क प्रक्रिया रोक दी गई है। कृपया तुरंत अस्पताल स्टाफ से मिलें।'
              : 'Potential acute emergency symptoms detected. Normal kiosk questionnaire paused. Triage team has been dispatched.'}
          </p>

          <div className="bg-red-800/80 rounded-2xl p-4 text-left max-w-md mx-auto mb-6 border border-red-400/40 text-xs space-y-1">
            <div><span className="font-bold">Token Number:</span> {redFlagAlert.tokenNumber}</div>
            <div><span className="font-bold">Rule Trigger:</span> {redFlagAlert.triggerRule}</div>
            <div><span className="font-bold">Triage Priority:</span> <span className="bg-white text-red-700 font-bold px-2 py-0.5 rounded">URGENT</span></div>
          </div>

          <button
            onClick={() => window.location.href = '/triage'}
            className="px-6 py-3 bg-white text-red-700 font-extrabold rounded-xl shadow-lg hover:bg-slate-100 transition text-sm inline-flex items-center gap-2"
          >
            <span>View in Triage Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="w-12 h-12 border-4 border-ayush-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Initializing Adaptive Clinical Questioning...</p>
      </div>
    );
  }

  const progressPct = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'hi' ? 'पीछे जाएं' : 'Back'}
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">
            Question {currentQuestionIndex + 1} of {questions.length} ({progressPct}%)
          </span>
          <div className="w-28 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div className="bg-ayush-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      <DisclaimerBanner />

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 mt-4">
        {/* Active AI Question Box */}
        <div className="bg-gradient-to-br from-ayush-50 to-emerald-50/50 dark:from-slate-900 dark:to-ayush-950/40 rounded-2xl p-6 border border-ayush-200 dark:border-ayush-800 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-ayush-800 dark:text-ayush-300 bg-ayush-100 dark:bg-ayush-900 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              AI Clinical Dialogue • {currentQ.category}
            </div>

            <button
              onClick={() => speak(language === 'hi' ? currentQ.questionHi : currentQ.questionEn)}
              className="flex items-center gap-1 text-xs font-bold text-ayush-700 dark:text-ayush-300 hover:underline"
            >
              <Volume2 className="w-4 h-4" />
              {language === 'hi' ? 'दोबारा सुनें' : 'Replay Question'}
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
            {language === 'hi' ? currentQ.questionHi : currentQ.questionEn}
          </h2>
        </div>

        {/* Input Mode Switcher (Voice vs Touch) */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setActiveInputMode('VOICE')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition ${
              activeInputMode === 'VOICE'
                ? 'border-ayush-600 text-ayush-700 dark:text-ayush-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            {language === 'hi' ? 'आवाज से उत्तर दें (Voice)' : 'Answer by Voice (ASR)'}
          </button>
          <button
            onClick={() => setActiveInputMode('TOUCH')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition ${
              activeInputMode === 'TOUCH'
                ? 'border-ayush-600 text-ayush-700 dark:text-ayush-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>👆</span>
            {language === 'hi' ? 'स्क्रीन छूकर चुनें (Touch Quick-Select)' : 'Touch Quick-Options'}
          </button>
        </div>

        {/* MODE 1: VOICE RECORDER */}
        {activeInputMode === 'VOICE' && (
          <VoiceRecorder
            onTranscription={(text) => handleAnswerSubmit(text, 'VOICE', text)}
            presetSimulatedText={
              currentQ.id === 'Q_KNEE_LOC'
                ? 'Mujhe dono ghutno me pichhle 6 mahine se dard aur subah jakdan rehti hai.'
                : 'Dard subah ke samay aur seedhiyan chadhne par bahut badh jata hai.'
            }
          />
        )}

        {/* MODE 2: TOUCH SELECTABLE OPTIONS */}
        {activeInputMode === 'TOUCH' && (
          <div className="space-y-3">
            {currentQ.options?.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => handleAnswerSubmit(language === 'hi' ? opt.labelHi : opt.labelEn, 'TOUCH')}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all transform hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center justify-between ${
                  opt.isRedFlag
                    ? 'border-red-300 hover:border-red-600 bg-red-50/40 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-ayush-500 bg-white dark:bg-slate-800'
                }`}
              >
                <div>
                  <div className="font-bold text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? opt.labelHi : opt.labelEn}
                  </div>
                  {opt.labelEn && language === 'hi' && (
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">{opt.labelEn}</div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {opt.ayushDosha && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-ayush-100 text-ayush-800">
                      {opt.ayushDosha}
                    </span>
                  )}
                  {opt.isRedFlag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Critical
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
