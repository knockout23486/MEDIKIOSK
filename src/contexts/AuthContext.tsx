import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types/index.js';

interface AuthContextType {
  user: User;
  role: UserRole;
  setRole: (role: UserRole) => void;
  switchUser: (role: UserRole) => void;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  PATIENT: {
    id: 'USR-PAT-01',
    username: 'patient',
    passwordHash: 'demo123',
    role: 'PATIENT',
    name: 'Smt. Radha Sharma',
    email: 'radha.sharma@example.com',
    phone: '+91 98765 43210',
    createdAt: '2026-08-20T08:30:00Z'
  },
  DOCTOR: {
    id: 'USR-DOC-01',
    username: 'doctor',
    passwordHash: 'doctor123',
    role: 'DOCTOR',
    name: 'Prof. (Dr.) Ananya Sharma',
    email: 'dr.ananya@aiia.gov.in',
    phone: '+91 98111 22334',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
    createdAt: '2026-01-10T09:00:00Z'
  },
  TRIAGE: {
    id: 'USR-TRIAGE-01',
    username: 'triage',
    passwordHash: 'triage123',
    role: 'TRIAGE',
    name: 'Sister Suniti Rao (Triage Nurse)',
    email: 'triage.station1@aiia.gov.in',
    phone: '+91 98333 44556',
    createdAt: '2026-02-01T08:00:00Z'
  },
  ADMIN: {
    id: 'USR-ADMIN-01',
    username: 'admin',
    passwordHash: 'admin123',
    role: 'ADMIN',
    name: 'Dr. Harish Chandra (MS / Admin)',
    email: 'admin.ms@aiia.gov.in',
    phone: '+91 98444 55667',
    createdAt: '2026-01-01T08:00:00Z'
  },
  SYSTEM_ADMIN: {
    id: 'USR-SYSADMIN-01',
    username: 'sysadmin',
    passwordHash: 'sysadmin123',
    role: 'SYSTEM_ADMIN',
    name: 'DevOps / Integration Lead',
    email: 'tech.lead@aiia.gov.in',
    phone: '+91 98555 66778',
    createdAt: '2026-01-01T08:00:00Z'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('PATIENT');
  const [user, setUser] = useState<User>(DEFAULT_USERS.PATIENT);

  const switchUser = (newRole: UserRole) => {
    setRoleState(newRole);
    setUser(DEFAULT_USERS[newRole] || DEFAULT_USERS.PATIENT);
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole: switchUser, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
