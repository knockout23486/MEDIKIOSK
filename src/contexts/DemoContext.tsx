import React, { createContext, useContext, useState } from 'react';

interface DemoContextType {
  activePatientId: string;
  activeSessionId: string;
  activeAppointmentId: string;
  activeTokenNumber: string;
  currentStep: number;
  isAyushMode: boolean;
  selectedHospitalId: string;
  selectedDepartmentId: string;
  selectedPractitionerId: string;
  setActivePatientId: (id: string) => void;
  setActiveSessionId: (id: string) => void;
  setActiveAppointmentId: (id: string) => void;
  setActiveTokenNumber: (tok: string) => void;
  setCurrentStep: (step: number) => void;
  setIsAyushMode: (ayush: boolean) => void;
  setSelectedHospitalId: (id: string) => void;
  setSelectedDepartmentId: (id: string) => void;
  setSelectedPractitionerId: (id: string) => void;
  resetDemoData: () => Promise<void>;
  loadHeroPatient: () => Promise<void>;
  loadEmergencyScenario: () => Promise<void>;
  loadMultiDocScenario: () => Promise<void>;
  loadTouchOnlyScenario: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePatientId, setActivePatientId] = useState<string>('PAT-HERO-01');
  const [activeSessionId, setActiveSessionId] = useState<string>('SES-HERO-01');
  const [activeAppointmentId, setActiveAppointmentId] = useState<string>('APT-001');
  const [activeTokenNumber, setActiveTokenNumber] = useState<string>('A-027');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isAyushMode, setIsAyushMode] = useState<boolean>(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('HOSP-01');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('DEP-01');
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>('PRAC-01');

  const resetDemoData = async () => {
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      setActivePatientId('PAT-HERO-01');
      setActiveSessionId('SES-HERO-01');
      setActiveAppointmentId('APT-001');
      setActiveTokenNumber('A-027');
      setCurrentStep(0);
      setIsAyushMode(true);
    } catch (e) {
      console.error('Failed to reset demo:', e);
    }
  };

  const loadHeroPatient = async () => {
    setActivePatientId('PAT-HERO-01');
    setActiveSessionId('SES-HERO-01');
    setActiveAppointmentId('APT-001');
    setActiveTokenNumber('A-027');
    setIsAyushMode(true);
    setSelectedDepartmentId('DEP-01');
    setSelectedPractitionerId('PRAC-01');
    setCurrentStep(1); // ABHA step
  };

  const loadEmergencyScenario = async () => {
    setActivePatientId('PAT-EMERG-02');
    setActiveSessionId('SES-EMERG-02');
    setActiveAppointmentId('APT-002');
    setActiveTokenNumber('EMERG-001');
    setIsAyushMode(false);
    setSelectedDepartmentId('DEP-08');
    setSelectedPractitionerId('PRAC-03');
    setCurrentStep(8); // Clinical History step
  };

  const loadMultiDocScenario = async () => {
    setActivePatientId('PAT-DOCS-03');
    setActiveSessionId('SES-DOCS-03');
    setActiveAppointmentId('APT-003');
    setActiveTokenNumber('A-025');
    setIsAyushMode(true);
    setSelectedDepartmentId('DEP-01');
    setSelectedPractitionerId('PRAC-01');
    setCurrentStep(10); // Document upload step
  };

  const loadTouchOnlyScenario = async () => {
    setActivePatientId('PAT-TOUCH-04');
    setActiveSessionId('SES-TOUCH-04');
    setActiveAppointmentId('APT-004');
    setActiveTokenNumber('A-026');
    setIsAyushMode(true);
    setSelectedDepartmentId('DEP-01');
    setSelectedPractitionerId('PRAC-01');
    setCurrentStep(8); // Clinical history
  };

  return (
    <DemoContext.Provider
      value={{
        activePatientId,
        activeSessionId,
        activeAppointmentId,
        activeTokenNumber,
        currentStep,
        isAyushMode,
        selectedHospitalId,
        selectedDepartmentId,
        selectedPractitionerId,
        setActivePatientId,
        setActiveSessionId,
        setActiveAppointmentId,
        setActiveTokenNumber,
        setCurrentStep,
        setIsAyushMode,
        setSelectedHospitalId,
        setSelectedDepartmentId,
        setSelectedPractitionerId,
        resetDemoData,
        loadHeroPatient,
        loadEmergencyScenario,
        loadMultiDocScenario,
        loadTouchOnlyScenario
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used within a DemoProvider');
  return context;
};
