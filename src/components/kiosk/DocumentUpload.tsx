import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import { api } from '../../services/api.js';
import {
  UploadCloud, FileText, CheckCircle2, ArrowRight, ArrowLeft,
  Sparkles, FileSpreadsheet, Activity, Image as ImageIcon
} from 'lucide-react';

interface DocumentUploadProps {
  onDocumentProcessed: (result: any) => void;
  onBack: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentProcessed, onBack }) => {
  const { language, t } = useLanguage();
  const { activePatientId } = useDemo();

  const [selectedDemoDoc, setSelectedDemoDoc] = useState<string>('DOC-002');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');

  const demoDocs = [
    {
      id: 'DOC-001',
      title: 'AIIA Discharge Summary (Nov 2025)',
      category: 'DISCHARGE_SUMMARY',
      fileName: 'AIIA_Discharge_Summary_2025-11-12.pdf',
      snippet: 'IPD Discharge: Hypertension (controlled), Early Janu Sandhivata, Janu Basti treatment.',
      icon: <FileText className="w-6 h-6 text-blue-600" />
    },
    {
      id: 'DOC-002',
      title: 'Complete Blood Count (CBC) Lab Report (Jul 2026)',
      category: 'LAB_REPORT',
      fileName: 'City_PathLab_CBC_Report_2026-07-03.pdf',
      snippet: 'Hb: 10.2 g/dL (Abnormal Low), ESR: 34 mm/hr (Abnormal High), FBS: 98 mg/dL.',
      icon: <Activity className="w-6 h-6 text-rose-600" />,
      isRecommended: true
    },
    {
      id: 'DOC-003',
      title: 'Ayush Wellness OPD Prescription Card (Jun 2026)',
      category: 'PRESCRIPTION',
      fileName: 'OPD_Prescription_Card_2026-06-15.pdf',
      snippet: 'Rx: Amlodipine 5mg OD, Yogaraj Guggulu 2 tab BD, Shallaki 500mg.',
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
    }
  ];

  const handleProcessOcr = async () => {
    setIsProcessing(true);
    const chosen = demoDocs.find(d => d.id === selectedDemoDoc) || demoDocs[1];

    setProcessingStage('1/5: Preprocessing document canvas & noise reduction...');
    await new Promise(r => setTimeout(r, 600));

    setProcessingStage('2/5: Optical Character Recognition (OCR) text extraction...');
    await new Promise(r => setTimeout(r, 700));

    setProcessingStage('3/5: Medical Named Entity Recognition (NER) & Lab value parsing...');
    await new Promise(r => setTimeout(r, 600));

    setProcessingStage('4/5: Abnormal reference range evaluation (Hb 10.2 g/dL ↓)...');
    await new Promise(r => setTimeout(r, 500));

    setProcessingStage('5/5: Human verification review prepared...');
    try {
      const res = await api.processDemoDocument({
        documentId: chosen.id,
        patientId: activePatientId,
        fileName: chosen.fileName
      });
      onDocumentProcessed(res);
    } catch (e) {
      console.error(e);
      onDocumentProcessed({});
    } finally {
      setIsProcessing(false);
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
        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1 rounded-full">
          Step 10 of 12: Document Intelligence
        </span>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {t.uploadDocuments}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {language === 'hi'
              ? 'पुराने पर्चे या जांच रिपोर्ट अपलोड करें। एआई दवाएं और असामान्य जांच मान स्वतः निकाल लेगा।'
              : 'Upload previous prescriptions or CBC reports. AI extracts clinical entities and highlights abnormal lab parameters with human verification.'}
          </p>
        </div>

        {/* Demo Documents Selection Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Available Demo Medical Records for Presentation
            </span>
          </div>

          <div className="space-y-3">
            {demoDocs.map(doc => {
              const isSelected = selectedDemoDoc === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDemoDoc(doc.id)}
                  className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'border-ayush-600 bg-ayush-50/80 dark:bg-ayush-950/60 ring-4 ring-ayush-500/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-ayush-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl shrink-0">
                      {doc.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {doc.title}
                        </h4>
                        {doc.isRecommended && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.2 rounded-full border border-rose-300">
                            Contains Abnormal Hb Flag
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                        {doc.snippet}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isSelected ? (
                      <span className="w-6 h-6 rounded-full bg-ayush-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Processing State Animation */}
        {isProcessing && (
          <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div>
                <span className="text-xs text-amber-400 font-mono font-bold uppercase tracking-wider block">
                  MediKiosk AI Document Pipeline
                </span>
                <span className="text-sm font-semibold">{processingStage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleProcessOcr}
          disabled={isProcessing}
          className="w-full py-4 bg-ayush-700 hover:bg-ayush-800 text-white font-extrabold rounded-2xl text-base shadow-lg transition flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <span>Extracting Medical Entities...</span>
          ) : (
            <>
              <span>{language === 'hi' ? 'दस्तावेज का विश्लेषण करें (Run OCR Pipeline)' : 'Analyze Document & Extract Clinical Entities'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
