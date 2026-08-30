import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api, setAuthToken, getAuthToken } from '../services/api.js';

// Documented demo credentials for this SIH showcase platform (SEC-006 note:
// the API strictly verifies each password against its bcrypt hash — removing
// this map only removes the demo convenience, not security. Production
// deployments provision real per-user accounts instead).
const DEMO_CREDENTIALS: Record<UserRole, { username: string; password: string }> = {
  PATIENT: { username: 'patient', password: 'demo123' },
  DOCTOR: { username: 'doctor', password: 'doctor123' },
  TRIAGE: { username: 'triage', password: 'triage123' },
  ADMIN: { username: 'admin', password: 'admin123' },
  SYSTEM_ADMIN: { username: 'sysadmin', password: 'sysadmin123' }
};

interface AuthContextType {
  user: User;
  role: UserRole;
  isAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  switchUser: (role: UserRole) => void;
  logout: () => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getAuthToken());

  /**
   * Authenticates against the API with the demo account credentials for the
   * selected role and caches the issued JWT (SEC-003/SEC-006): every
   * subsequent api.* call carries `Authorization: Bearer <token>`. Falls back
   * to the local demo profile when the API is unreachable (offline demo mode).
   */
  /**
   * Ends the current session server-side (SEC-017): the active JWT is added
   * to the API's revocation blocklist, so it cannot be reused on this shared
   * kiosk after the operator walks away.
   */
  const logout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setRoleState('PATIENT');
    setUser(DEFAULT_USERS.PATIENT);
  };

  const switchUser = async (newRole: UserRole) => {
    setRoleState(newRole);
    setUser(DEFAULT_USERS[newRole] || DEFAULT_USERS.PATIENT);
    try {
      // Revoke the outgoing session before issuing the next one (SEC-017).
      if (getAuthToken()) await api.logout();
      const creds = DEMO_CREDENTIALS[newRole];
      const res = await api.login(creds.username, creds.password);
      if (res?.success && res?.token) {
        setAuthToken(res.token);
        if (res.user) setUser(res.user as unknown as User);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.warn('[Auth] API login failed — continuing in offline demo mode.', e);
    }
  };

  // Establish the default kiosk session on first render.
  useEffect(() => {
    void switchUser('PATIENT');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, setRole: switchUser, switchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
