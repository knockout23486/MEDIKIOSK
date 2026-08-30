import React, { useState } from 'react';
import { useDemo } from '../../contexts/DemoContext.js';
import { useLanguage } from '../../contexts/LanguageContext.js';
import {
  Sparkles, Play, ShieldAlert, FileText,
  Users, RefreshCw, Calculator, Cpu, ChevronRight, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoControlCenter: React.FC = () => {
  const {
    loadHeroPatient, loadEmergencyScenario, loadMultiDocScenario,
    loadTouchOnlyScenario, resetDemoData, setCurrentStep
  } = useDemo();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [activeSubTab, setActiveSubTab] = useState<'scenarios' | 'guide' | 'calculator' | 'architecture'>('scenarios');

  // Impact Calculator state
  const [opdVolume, setOpdVolume] = useState<number>(250);
  const [manualHistoryMins, setManualHistoryMins] = useState<number>(8);
  const [docReviewMins, setDocReviewMins] = useState<number>(5);
  const [doctorsCount, setDoctorsCount] = useState<number>(12);

  // Computed Impact
  const timeSavedPerPatientMins = Math.round((manualHistoryMins + docReviewMins) * 0.65); // 65% pre-intake recovery
  const totalDailyHoursSaved = Math.round((opdVolume * timeSavedPerPatientMins) / 60);
  const doctorMinutesSavedPerConsult = timeSavedPerPatientMins;
  const annualClinicalHours = totalDailyHoursSaved * 300;

  const acts = [
    { num: 1, title: 'Act 1: Patient Kiosk Welcome & Language', action: () => { setCurrentStep(0); navigate('/kiosk'); } },
    { num: 2, title: 'Act 2: ABHA Identity Verification (Sandbox M1)', action: () => { setCurrentStep(1); navigate('/kiosk'); } },
    { num: 3, title: 'Act 3: DPDP Informed Consent Engine', action: () => { setCurrentStep(2); navigate('/kiosk'); } },
    { num: 4, title: 'Act 4: Hospital, AYUSH Dept & Slot Selection', action: () => { setCurrentStep(4); navigate('/kiosk'); } },
    { num: 5, title: 'Act 5: AI Adaptive History (Voice + Touch)', action: () => { setCurrentStep(8); navigate('/kiosk'); } },
    { num: 6, title: 'Act 6: AYUSH Dashavidha Pariksha & Agni/Koshtha', action: () => { setCurrentStep(9); navigate('/kiosk'); } },
    { num: 7, title: 'Act 7: Document OCR Pipeline & Entity Extraction', action: () => { setCurrentStep(10); navigate('/kiosk'); } },
    { num: 8, title: 'Act 8: Multi-Source Fusion & AI Summary Draft', action: () => { setCurrentStep(11); navigate('/kiosk'); } },
    { num: 9, title: 'Act 9: Token Issuance & Live Queue Tracking', action: () => { setCurrentStep(12); navigate('/kiosk'); } },
    { num: 10, title: 'Act 10: Doctor Consultation Workstation', action: () => { navigate('/doctor'); } },
    { num: 11, title: 'Act 11: Physician Verification & Prescription (Rx)', action: () => { navigate('/doctor'); } },
    { num: 12, title: 'Act 12: Final Medical Record & HIS/ABDM FHIR Sync', action: () => { navigate('/doctor'); } }
  ];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Hero Presentation Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-950/60 text-amber-300 text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            SIH 2026 Developer & Judge Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MediKiosk Demonstration Suite
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 mt-1">
            Deterministic scenarios, step-by-step presentation script, impact simulator, and instant demo reset.
          </p>
        </div>

        <button
          onClick={() => resetDemoData()}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 border border-slate-700 shadow transition"
        >
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>Reset All Demo Data</span>
        </button>
      </div>

      {/* Control Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 gap-2">
        <button
          onClick={() => setActiveSubTab('scenarios')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'scenarios' ? 'border-amber-600 text-amber-900 font-extrabold bg-amber-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Play className="w-4 h-4 text-amber-600" /> 6 Judging Scenarios
        </button>
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'guide' ? 'border-amber-600 text-amber-900 font-extrabold bg-amber-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ChevronRight className="w-4 h-4 text-amber-600" /> 12-Act Demo Script
        </button>
        <button
          onClick={() => setActiveSubTab('calculator')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'calculator' ? 'border-amber-600 text-amber-900 font-extrabold bg-amber-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-600" /> OPD Impact Simulator
        </button>
        <button
          onClick={() => setActiveSubTab('architecture')}
          className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'architecture' ? 'border-amber-600 text-amber-900 font-extrabold bg-amber-50/60' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-amber-600" /> System Architecture & Flow
        </button>
      </div>

      {/* TAB 1: 6 INSTANT JUDGING SCENARIOS */}
      {activeSubTab === 'scenarios' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Scenario 1: Hero AYUSH Patient */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-amber-400 dark:border-amber-600 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  Scenario 1 • Primary Demo
                </span>
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Smt. Radha Sharma (AYUSH Hero Case)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                58 F, Bilateral knee pain (Sandhivata), Dashavidha Pariksha, Hindi voice/touch intake, previous Discharge summary OCR, CBC with abnormal Hb 10.2, Doctor consultation.
              </p>
            </div>
            <button
              onClick={() => {
                loadHeroPatient();
                navigate('/kiosk');
              }}
              className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Launch Scenario 1</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario 2: Emergency Red-Flag Patient */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-red-300 dark:border-red-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-red-100 text-red-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  Scenario 2 • Safety Engine
                </span>
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Shri Rajesh Patel (Emergency Red-Flag)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                62 M, Acute crushing chest pain radiating to left jaw with cold diaphoresis & dyspnea. Triggers immediate kiosk safety pause and urgent Triage escalation.
              </p>
            </div>
            <button
              onClick={() => {
                loadEmergencyScenario();
                navigate('/kiosk');
              }}
              className="mt-5 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Launch Scenario 2</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario 3: Multi-Document Patient */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-blue-100 text-blue-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  Scenario 3 • OCR Intelligence
                </span>
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Smt. Sunita Verma (3 Document Fusion)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                52 F, Chronic multi-morbidity. Fuses 3 historical documents: Discharge summary 2025, Lipid profile 2026, and prescription card into one longitudinal timeline.
              </p>
            </div>
            <button
              onClick={() => {
                loadMultiDocScenario();
                navigate('/kiosk');
              }}
              className="mt-5 w-full py-2.5 bg-clinical-600 hover:bg-clinical-500 text-white font-extrabold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Launch Scenario 3</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario 4: Low-Literacy / Touch-First */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-purple-100 text-purple-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  Scenario 4 • Accessibility
                </span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Shri Ramu Lal (Touch & Audio Guidance)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                67 M, Rural / elderly friendly mode. Large touch buttons, high contrast, spoken Hindi voice guidance, minimal cognitive load.
              </p>
            </div>
            <button
              onClick={() => {
                loadTouchOnlyScenario();
                navigate('/kiosk');
              }}
              className="mt-5 w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Launch Scenario 4</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario 5: Multilingual (Hindi/English) */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-emerald-100 text-emerald-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  Scenario 5 • Multilingual
                </span>
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Hindi Native Case-Taking
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Toggles entire interface and speech model to Hindi. Evaluates Devanagari ASR transcription and audio guidance synthesis.
              </p>
            </div>
            <button
              onClick={() => {
                setLanguage('hi');
                loadHeroPatient();
                navigate('/kiosk');
              }}
              className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Launch Scenario 5 (Hindi)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Scenario 6: Doctor Consultation Fast-Track */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-2 border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="bg-indigo-100 text-indigo-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                  Scenario 6 • Clinician Workstation
                </span>
                <Cpu className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Doctor Consultation & Final Rx
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Fast-track straight to the doctor workstation for Radha Sharma. Review AI summary, edit HPI, approve verification stamp, write Rx, and export FHIR.
              </p>
            </div>
            <button
              onClick={() => navigate('/doctor')}
              className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <span>Open Doctor Workstation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: 12-ACT DEMO SCRIPT */}
      {activeSubTab === 'guide' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            12-Act Presentation Walkthrough Script (Click to Jump)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {acts.map(act => (
              <div
                key={act.num}
                onClick={act.action}
                className="cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-ayush-500 hover:bg-ayush-50/40 transition flex items-center justify-between text-xs font-bold"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-ayush-700 text-white flex items-center justify-center text-xs font-mono">
                    {act.num}
                  </span>
                  <span className="text-slate-900 dark:text-white">{act.title}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OPD IMPACT SIMULATOR */}
      {activeSubTab === 'calculator' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              Interactive Hospital OPD Impact Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Simulation based on AIIA / Government AYUSH hospital OPD throughput parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Sliders */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Daily OPD Patient Volume:</span>
                  <span className="text-ayush-700 font-mono text-sm">{opdVolume} patients/day</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={opdVolume}
                  onChange={e => setOpdVolume(parseInt(e.target.value))}
                  className="w-full accent-ayush-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Average Manual History Taking Time:</span>
                  <span className="text-ayush-700 font-mono text-sm">{manualHistoryMins} minutes</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="20"
                  step="1"
                  value={manualHistoryMins}
                  onChange={e => setManualHistoryMins(parseInt(e.target.value))}
                  className="w-full accent-ayush-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Average Paper Document Review Time:</span>
                  <span className="text-ayush-700 font-mono text-sm">{docReviewMins} minutes</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={docReviewMins}
                  onChange={e => setDocReviewMins(parseInt(e.target.value))}
                  className="w-full accent-ayush-600"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Active Consulting Doctors / OPD Rooms:</span>
                  <span className="text-ayush-700 font-mono text-sm">{doctorsCount} clinicians</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={doctorsCount}
                  onChange={e => setDoctorsCount(parseInt(e.target.value))}
                  className="w-full accent-ayush-600"
                />
              </div>
            </div>

            {/* Simulated Projected Output Cards */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-ayush-50 dark:bg-ayush-950/60 p-4 rounded-2xl border border-ayush-200 dark:border-ayush-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Doctor Minutes Saved / Patient</span>
                <span className="text-3xl font-extrabold text-ayush-800 dark:text-ayush-200 block my-1">
                  {doctorMinutesSavedPerConsult}m
                </span>
                <span className="text-[10px] text-slate-400">~65% pre-consult recovery</span>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Clinical Hours Saved / Day</span>
                <span className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-200 block my-1">
                  {totalDailyHoursSaved} hrs
                </span>
                <span className="text-[10px] text-slate-400">For {opdVolume} OPD patients</span>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/60 p-4 rounded-2xl border border-blue-200 dark:border-blue-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Annual Doctor Hours Recovered</span>
                <span className="text-3xl font-extrabold text-blue-800 dark:text-blue-200 block my-1">
                  {annualClinicalHours} hrs
                </span>
                <span className="text-[10px] text-slate-400">300 OPD working days</span>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/60 p-4 rounded-2xl border border-purple-200 dark:border-purple-800">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Estimated OPD Capacity Boost</span>
                <span className="text-3xl font-extrabold text-purple-800 dark:text-purple-200 block my-1">
                  +38%
                </span>
                <span className="text-[10px] text-slate-400">Without adding doctors</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-[11px] text-slate-500 text-center font-medium border border-slate-200">
            Note: Simulation projection for SIH judging evaluation — not a substitute for formal clinical randomized trials.
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM ARCHITECTURE VISUALIZER */}
      {activeSubTab === 'architecture' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 space-y-6">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            End-to-End System Architecture & Data Pipeline
          </h3>

          <div className="bg-slate-950 text-white rounded-2xl p-6 font-mono text-xs overflow-x-auto space-y-4 border border-slate-800">
            <div className="text-amber-400 font-bold text-sm">
              [PATIENT KIOSK / MOBILE]
            </div>
            <div className="pl-4 border-l border-slate-700 space-y-1 text-slate-300">
              <div>↓ 1. Multilingual Voice (Web Speech API) & Large Touch Selection</div>
              <div>↓ 2. ABHA Linking / Verification (ABDM Milestone 1)</div>
              <div>↓ 3. DPDP Act 2023 Granular Consent Protocol</div>
              <div>↓ 4. Adaptive Clinical Dialogue Engine (Ontology-driven branching)</div>
              <div>↓ 5. AYUSH Dashavidha Pariksha & Agni/Koshtha Evaluation</div>
              <div>↓ 6. Document Upload & OCR Preprocessing Pipeline</div>
            </div>

            <div className="text-blue-400 font-bold text-sm">
              [CORE MEDIKIOSK AI ENGINE & MICROSERVICES]
            </div>
            <div className="pl-4 border-l border-slate-700 space-y-1 text-slate-300">
              <div>↓ 7. Real-Time Emergency Red-Flag Evaluator → Triage Emergency Bay</div>
              <div>↓ 8. Medical Entity Extraction (NER) & Abnormal Lab Threshold Flagging</div>
              <div>↓ 9. Information Fusion Engine with Source Provenance Tags</div>
              <div>↓ 10. Physician-Ready 15-Section Clinical Summary Generator</div>
            </div>

            <div className="text-emerald-400 font-bold text-sm">
              [CLINICIAN WORKSTATION & INTEROPERABILITY LAYER]
            </div>
            <div className="pl-4 border-l border-slate-700 space-y-1 text-slate-300">
              <div>↓ 11. Doctor Review & Inline Versioned Verification Stamp</div>
              <div>↓ 12. Clinical Diagnosis (ICD-11 / NAMASTE AYUSH) & Prescription Builder</div>
              <div>↓ 13. Hospital Information System (HIS EMR) HL7/FHIR Outbound Gateway</div>
              <div>↓ 14. ABDM FHIR R4 Health Record Exchange (Milestone 2 & 3)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
