import React from 'react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useLanguage } from '../../contexts/LanguageContext.js';
import { useAccessibility } from '../../contexts/HighContrastContext.js';
import { useNotifications } from '../../contexts/NotificationContext.js';
import { useDemo } from '../../contexts/DemoContext.js';
import {
  Activity, Globe, Eye, Bell, Sparkles, Stethoscope,
  ShieldAlert, Settings, User, Building2, HelpCircle
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { role, switchUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { highContrast, toggleHighContrast, largeFont, toggleLargeFont } = useAccessibility();
  const { unreadCount, setIsDrawerOpen, liveTriageAlerts } = useNotifications();
  const { loadHeroPatient, resetDemoData } = useDemo();
  const location = useLocation();

  const urgentAlertsCount = liveTriageAlerts.filter(a => a.status === 'PENDING').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Top Government & SIH Banner */}
      <div className="bg-ayush-900 text-white text-[11px] px-4 py-1 flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span className="bg-ayush-700 text-white px-1.5 py-0.5 rounded font-mono font-bold">SIH 2026 #26047</span>
          <span className="hidden sm:inline">Ministry of Ayush • All India Institute of Ayurveda (AIIA)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Demo Environment (Simulated ABDM & HIS)
          </span>
          <button
            onClick={() => resetDemoData()}
            className="hover:underline text-slate-300 text-[10px]"
            title="Reset database to initial demo state"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ayush-600 to-ayush-800 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">MediKiosk</span>
              <span className="text-xs bg-ayush-100 dark:bg-ayush-950 text-ayush-800 dark:text-ayush-300 font-bold px-1.5 py-0.5 rounded border border-ayush-200 dark:border-ayush-800">
                AI Clinical Intake
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
              Case-Taking Platform • AIIA New Delhi
            </span>
          </div>
        </Link>

        {/* Primary Role Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/kiosk"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
              location.pathname.startsWith('/kiosk') || location.pathname === '/'
                ? 'bg-ayush-50 text-ayush-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Patient Kiosk
          </Link>
          <Link
            to="/doctor"
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              location.pathname.startsWith('/doctor')
                ? 'bg-clinical-50 text-clinical-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-clinical-600" />
            Doctor Dashboard
          </Link>
          <Link
            to="/triage"
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              location.pathname.startsWith('/triage')
                ? 'bg-red-50 text-red-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Triage Staff
            {urgentAlertsCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                {urgentAlertsCount}
              </span>
            )}
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              location.pathname.startsWith('/admin')
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-600" />
            Hospital Admin
          </Link>
          <Link
            to="/demo"
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              location.pathname.startsWith('/demo')
                ? 'bg-amber-50 text-amber-900 font-semibold'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            SIH Demo Suite
          </Link>
        </nav>

        {/* Right Utility Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-ayush-700" />
            <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
          </button>

          {/* Accessibility Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`p-2 rounded-lg border transition ${
              highContrast ? 'bg-amber-500 text-black border-amber-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle High Contrast Mode"
            aria-label="High Contrast"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Live Notification Bell */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="View Live Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Quick Hero Journey Trigger */}
          <button
            onClick={() => {
              loadHeroPatient();
            }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-ayush-700 to-ayush-600 hover:from-ayush-800 hover:to-ayush-700 text-white text-xs font-bold rounded-lg shadow transition transform active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Start SIH Demo
          </button>
        </div>
      </div>
    </header>
  );
};
