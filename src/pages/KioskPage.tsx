import React from 'react';
import { useDemo } from '../contexts/DemoContext.js';
import { LandingScreen } from '../components/kiosk/LandingScreen.js';
import { AbhaVerification } from '../components/kiosk/AbhaVerification.js';
import { ConsentEngine } from '../components/kiosk/ConsentEngine.js';
import { HospitalSelect } from '../components/kiosk/HospitalSelect.js';
import { DepartmentSelect } from '../components/kiosk/DepartmentSelect.js';
import { DoctorSelect } from '../components/kiosk/DoctorSelect.js';
import { SlotBooking } from '../components/kiosk/SlotBooking.js';
import { AdaptiveHistory } from '../components/kiosk/AdaptiveHistory.js';
import { AyushPariksha } from '../components/kiosk/AyushPariksha.js';
import { DocumentUpload } from '../components/kiosk/DocumentUpload.js';
import { OcrPipelineView } from '../components/kiosk/OcrPipelineView.js';
import { SummaryReview } from '../components/kiosk/SummaryReview.js';
import { AppointmentConfirmation } from '../components/kiosk/AppointmentConfirmation.js';
import { useNavigate } from 'react-router-dom';

export const KioskPage: React.FC = () => {
  const {
    currentStep, setCurrentStep, activePatientId,
    loadHeroPatient, loadEmergencyScenario, isAyushMode
  } = useDemo();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-140px)] py-4">
      {currentStep === 0 && (
        <LandingScreen
          onSelectExisting={() => setCurrentStep(1)}
          onSelectNew={() => setCurrentStep(1)}
          onSelectEmergency={() => {
            loadEmergencyScenario();
            setCurrentStep(7);
          }}
        />
      )}

      {currentStep === 1 && (
        <AbhaVerification
          onVerified={() => setCurrentStep(2)}
          onBack={() => setCurrentStep(0)}
        />
      )}

      {currentStep === 2 && (
        <ConsentEngine
          patientId={activePatientId}
          onConsentAccepted={() => setCurrentStep(3)}
          onConsentDeclined={() => setCurrentStep(0)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <HospitalSelect
          onSelect={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <DepartmentSelect
          onSelect={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <DoctorSelect
          onSelect={() => setCurrentStep(6)}
          onBack={() => setCurrentStep(4)}
        />
      )}

      {currentStep === 6 && (
        <SlotBooking
          onSlotBooked={() => setCurrentStep(7)}
          onBack={() => setCurrentStep(5)}
        />
      )}

      {currentStep === 7 && (
        <AdaptiveHistory
          onHistoryCompleted={() => {
            if (isAyushMode) {
              setCurrentStep(8);
            } else {
              setCurrentStep(9);
            }
          }}
          onEmergencyTriggered={() => {
            navigate('/triage');
          }}
          onBack={() => setCurrentStep(6)}
        />
      )}

      {currentStep === 8 && (
        <AyushPariksha
          onCompleted={() => setCurrentStep(9)}
          onBack={() => setCurrentStep(7)}
        />
      )}

      {currentStep === 9 && (
        <DocumentUpload
          onDocumentProcessed={() => setCurrentStep(10)}
          onBack={() => setCurrentStep(isAyushMode ? 8 : 7)}
        />
      )}

      {currentStep === 10 && (
        <OcrPipelineView
          onContinue={() => setCurrentStep(11)}
          onBack={() => setCurrentStep(9)}
        />
      )}

      {currentStep === 11 && (
        <SummaryReview
          onConfirmed={() => setCurrentStep(12)}
          onBack={() => setCurrentStep(10)}
        />
      )}

      {currentStep === 12 && (
        <AppointmentConfirmation
          onGoToDoctor={() => navigate('/doctor')}
        />
      )}
    </div>
  );
};
