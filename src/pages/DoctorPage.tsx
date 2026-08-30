import React, { useState } from 'react';
import { useDemo } from '../contexts/DemoContext.js';
import { PatientConsultationView } from '../components/doctor/PatientConsultationView.js';
import { PrescriptionBuilder } from '../components/doctor/PrescriptionBuilder.js';
import { FinalMedicalRecord } from '../components/doctor/FinalMedicalRecord.js';
import { Stethoscope, Users, Clock, ShieldCheck, Sparkles, ArrowRight, User } from 'lucide-react';

export const DoctorPage: React.FC = () => {
  const { activePatientId, loadHeroPatient } = useDemo();
  const [viewState, setViewState] = useState<'consultation' | 'prescription' | 'finalRecord'>('consultation');
  const [consultationResult, setConsultationResult] = useState<any>(null);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {viewState === 'consultation' && (
        <PatientConsultationView
          onProceedToPrescription={() => setViewState('prescription')}
        />
      )}

      {viewState === 'prescription' && (
        <PrescriptionBuilder
          onFinalized={(data) => {
            setConsultationResult(data);
            setViewState('finalRecord');
          }}
          onBack={() => setViewState('consultation')}
        />
      )}

      {viewState === 'finalRecord' && (
        <FinalMedicalRecord
          consultationData={consultationResult}
          onBackToDashboard={() => setViewState('consultation')}
        />
      )}
    </div>
  );
};
