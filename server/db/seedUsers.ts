import bcrypt from 'bcryptjs';
import { User, Hospital, Department, Practitioner } from './schema.js';

// ============================================================================
// SEC-007: passwords are hashed with bcrypt (cost 10) BEFORE insertion —
// the users table never contains plaintext credentials.
//
// The demo passwords below are intentionally documented public demo
// credentials for this SIH showcase platform; production deployments must
// provision real per-user secrets instead.
// ============================================================================
export const DEMO_CREDENTIALS: Record<string, string> = {
  patient: 'demo123',
  doctor: 'doctor123',
  dr_vikram: 'doctor123',
  triage: 'triage123',
  admin: 'admin123',
  sysadmin: 'sysadmin123'
};

const BCRYPT_COST = 10;

interface RawSeedUser extends Omit<User, 'passwordHash'> {
  username: string; // narrowed: every seed user must have demo credentials
}

const rawSeededUsers: RawSeedUser[] = [
  {
    id: 'USR-PAT-01',
    username: 'patient',
    role: 'PATIENT',
    name: 'Smt. Radha Sharma',
    email: 'radha.sharma@example.com',
    phone: '+91 98765 43210',
    createdAt: '2026-08-20T08:30:00Z'
  },
  {
    id: 'USR-DOC-01',
    username: 'doctor',
    role: 'DOCTOR',
    name: 'Prof. (Dr.) Ananya Sharma',
    email: 'dr.ananya@aiia.gov.in',
    phone: '+91 98111 22334',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    createdAt: '2026-01-10T09:00:00Z'
  },
  {
    id: 'USR-DOC-02',
    username: 'dr_vikram',
    role: 'DOCTOR',
    name: 'Dr. Vikramaditya Sen',
    email: 'dr.sen@aiia.gov.in',
    phone: '+91 98222 33445',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80',
    createdAt: '2026-01-15T09:00:00Z'
  },
  {
    id: 'USR-TRIAGE-01',
    username: 'triage',
    role: 'TRIAGE',
    name: 'Sister Suniti Rao (Triage Nurse)',
    email: 'triage.station1@aiia.gov.in',
    phone: '+91 98333 44556',
    createdAt: '2026-02-01T08:00:00Z'
  },
  {
    id: 'USR-ADMIN-01',
    username: 'admin',
    role: 'ADMIN',
    name: 'Dr. Harish Chandra (MS / Admin)',
    email: 'admin.ms@aiia.gov.in',
    phone: '+91 98444 55667',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'USR-SYSADMIN-01',
    username: 'sysadmin',
    role: 'SYSTEM_ADMIN',
    name: 'DevOps / Integration Lead',
    email: 'tech.lead@aiia.gov.in',
    phone: '+91 98555 66778',
    createdAt: '2026-01-01T08:00:00Z'
  }
];

export const seededHospitals: Hospital[] = [
  {
    id: 'HOSP-01',
    name: 'All India Institute of Ayurveda (AIIA) — Demo',
    code: 'AIIA-ND-01',
    type: 'AYUSH_CENTRAL',
    address: 'Gautampuri, Sarita Vihar, Mathura Road, New Delhi, Delhi 110076',
    phone: '011-26950401',
    activeOpdCount: 14,
    currentQueueLength: 28
  },
  {
    id: 'HOSP-02',
    name: 'National Institute of Ayurveda (NIA) — Demo',
    code: 'NIA-JP-02',
    type: 'AYUSH_CENTRAL',
    address: 'Jorawar Singh Gate, Amer Road, Jaipur, Rajasthan 302002',
    phone: '0141-2635816',
    activeOpdCount: 9,
    currentQueueLength: 16
  },
  {
    id: 'HOSP-03',
    name: 'Government Integrated AYUSH District Hospital — Demo',
    code: 'GAYUSH-VAR-03',
    type: 'DISTRICT_INTEGRATED',
    address: 'Pandeypur, Varanasi, Uttar Pradesh 221002',
    phone: '0542-2501234',
    activeOpdCount: 6,
    currentQueueLength: 12
  }
];

export const seededDepartments: Department[] = [
  {
    id: 'DEP-01',
    hospitalId: 'HOSP-01',
    name: 'Kayachikitsa (General Ayurvedic Medicine)',
    code: 'KAYA',
    isAyush: true,
    ayushBranch: 'KAYACHIKITSA',
    description: 'Internal medicine dealing with metabolic, rheumatological, digestive, and lifestyle disorders.',
    iconName: 'Activity'
  },
  {
    id: 'DEP-02',
    hospitalId: 'HOSP-01',
    name: 'Panchakarma (Biocleansing & Detox)',
    code: 'PANCHA',
    isAyush: true,
    ayushBranch: 'PANCHAKARMA',
    description: 'Specialized 5-fold detoxification, Vamana, Virechana, Basti, Nasya, and Raktamokshana.',
    iconName: 'Sparkles'
  },
  {
    id: 'DEP-03',
    hospitalId: 'HOSP-01',
    name: 'Shalya Tantra (Ayurvedic Surgery & Ksharasutra)',
    code: 'SHALYA',
    isAyush: true,
    ayushBranch: 'SHALYA',
    description: 'Surgical management, ano-rectal clinic, wound healing (Vrana), and Ksharasutra therapy.',
    iconName: 'Scissors'
  },
  {
    id: 'DEP-04',
    hospitalId: 'HOSP-01',
    name: 'Shalakya Tantra (ENT & Ophthalmology)',
    code: 'SHALAKYA',
    isAyush: true,
    ayushBranch: 'SHALAKYA',
    description: 'Diseases of eye (Netra), ear-nose-throat, and oral cavity.',
    iconName: 'Eye'
  },
  {
    id: 'DEP-05',
    hospitalId: 'HOSP-01',
    name: 'Striroga & Prasuti Tantra (Gynaecology & Obstetrics)',
    code: 'STRIROGA',
    isAyush: true,
    ayushBranch: 'STRIROGA',
    description: 'Maternal health, garbha sanskara, PCOS, and gynaecological disorders.',
    iconName: 'HeartHandshake'
  },
  {
    id: 'DEP-06',
    hospitalId: 'HOSP-01',
    name: 'Kaumarbhritya (Ayurvedic Paediatrics)',
    code: 'KAUMAR',
    isAyush: true,
    ayushBranch: 'KAUMARBHRITYA',
    description: 'Child healthcare, growth assessment, Swarnaprashana, and immunity enhancement.',
    iconName: 'Smile'
  },
  {
    id: 'DEP-07',
    hospitalId: 'HOSP-01',
    name: 'Swasthavritta & Yoga (Preventive Medicine)',
    code: 'SWASTHA',
    isAyush: true,
    ayushBranch: 'SWASTHAVRITTA',
    description: 'Dinacharya, Ritucharya, therapeutic yoga, and public health counseling.',
    iconName: 'Sun'
  },
  {
    id: 'DEP-08',
    hospitalId: 'HOSP-01',
    name: 'General Medicine & Modern OPD',
    code: 'GENMED',
    isAyush: false,
    description: 'Integrated allopathic evaluation, emergency triage, and modern diagnostic coordination.',
    iconName: 'Stethoscope'
  }
];

export const seededPractitioners: Practitioner[] = [
  {
    id: 'PRAC-01',
    userId: 'USR-DOC-01',
    hospitalId: 'HOSP-01',
    departmentId: 'DEP-01',
    name: 'Prof. (Dr.) Ananya Sharma',
    title: 'Vaidya / Senior Consultant',
    specialty: 'Kayachikitsa & Rheumatology (Sandhivata)',
    qualifications: 'BAMS (Gold Medalist), MD (AIIA), PhD',
    roomNumber: 'OPD Room 104 (Ground Floor)',
    experienceYears: 18,
    opdTiming: '09:00 AM - 01:30 PM',
    isAvailable: true,
    avgConsultationMins: 12,
    activeQueueCount: 4
  },
  {
    id: 'PRAC-02',
    userId: 'USR-DOC-01',
    hospitalId: 'HOSP-01',
    departmentId: 'DEP-02',
    name: 'Vaidya Raghavendra Joshi',
    title: 'Associate Professor',
    specialty: 'Panchakarma & Neurological Rehabilitation',
    qualifications: 'BAMS, MD (Panchakarma, NIA Jaipur)',
    roomNumber: 'OPD Room 108 (Ground Floor)',
    experienceYears: 14,
    opdTiming: '09:30 AM - 02:00 PM',
    isAvailable: true,
    avgConsultationMins: 15,
    activeQueueCount: 3
  },
  {
    id: 'PRAC-03',
    userId: 'USR-DOC-02',
    hospitalId: 'HOSP-01',
    departmentId: 'DEP-08',
    name: 'Dr. Vikramaditya Sen',
    title: 'Chief Medical Officer',
    specialty: 'Internal Medicine & Critical Care Triage',
    qualifications: 'MBBS, MD (General Medicine, AIIMS New Delhi)',
    roomNumber: 'OPD Room 201 (First Floor)',
    experienceYears: 16,
    opdTiming: '08:30 AM - 02:00 PM',
    isAvailable: true,
    avgConsultationMins: 10,
    activeQueueCount: 6
  },
  {
    id: 'PRAC-04',
    userId: 'USR-DOC-01',
    hospitalId: 'HOSP-01',
    departmentId: 'DEP-03',
    name: 'Dr. Meenakshi Sundaram',
    title: 'Senior Surgeon (Ayush)',
    specialty: 'Shalya Tantra & Ksharasutra',
    qualifications: 'BAMS, MS (Ayurvedic Surgery, IPGTRA Jamnagar)',
    roomNumber: 'OPD Room 112 (Ground Floor)',
    experienceYears: 12,
    opdTiming: '10:00 AM - 02:30 PM',
    isAvailable: true,
    avgConsultationMins: 14,
    activeQueueCount: 2
  },
  {
    id: 'PRAC-05',
    userId: 'USR-DOC-01',
    hospitalId: 'HOSP-01',
    departmentId: 'DEP-05',
    name: 'Dr. Priya Nambiar',
    title: 'Assistant Professor',
    specialty: 'Striroga, Prasuti & Infertility',
    qualifications: 'BAMS, MD (Prasuti Tantra, Kerala Ayurveda)',
    roomNumber: 'OPD Room 106 (Ground Floor)',
    experienceYears: 10,
    opdTiming: '09:00 AM - 01:00 PM',
    isAvailable: true,
    avgConsultationMins: 12,
    activeQueueCount: 3
  }
];

/**
 * Builds the seeded users with bcrypt-hashed passwords (called at seed time
 * only, so normal server boots pay no hashing cost).
 */
export function buildSeededUsers(): User[] {
  return rawSeededUsers.map((u) => ({
    ...u,
    passwordHash: bcrypt.hashSync(DEMO_CREDENTIALS[u.username], BCRYPT_COST)
  }));
}
