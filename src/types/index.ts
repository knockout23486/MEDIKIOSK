export * from '../../server/db/schema.js';

export interface UserContextType {
  currentUser: {
    id: string;
    username: string;
    role: 'PATIENT' | 'DOCTOR' | 'TRIAGE' | 'ADMIN' | 'SYSTEM_ADMIN';
    name: string;
    email: string;
    phone: string;
  };
  setRole: (role: 'PATIENT' | 'DOCTOR' | 'TRIAGE' | 'ADMIN' | 'SYSTEM_ADMIN') => void;
}

export interface DemoContextType {
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
}
