import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { LanguageProvider } from './contexts/LanguageContext.js';
import { HighContrastProvider } from './contexts/HighContrastContext.js';
import { DemoProvider } from './contexts/DemoContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { KioskPage } from './pages/KioskPage.js';
import { DoctorPage } from './pages/DoctorPage.js';
import { TriagePage } from './pages/TriagePage.js';
import { AdminPage } from './pages/AdminPage.js';
import { DemoPage } from './pages/DemoPage.js';
import { PrivacyPage } from './pages/PrivacyPage.js';
import { ArchitecturePage } from './pages/ArchitecturePage.js';

const withRouteBoundary = (name: string, page: React.ReactNode) => (
  <ErrorBoundary scope={`route:${name}`}>{page}</ErrorBoundary>
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary scope="root">
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <HighContrastProvider>
              <DemoProvider>
                <NotificationProvider>
                  <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
                    <Navbar />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={withRouteBoundary('kiosk', <KioskPage />)} />
                        <Route path="/login" element={withRouteBoundary('login', <KioskPage />)} />
                        <Route path="/kiosk" element={withRouteBoundary('kiosk', <KioskPage />)} />
                        <Route path="/doctor" element={withRouteBoundary('doctor', <DoctorPage />)} />
                        <Route path="/triage" element={withRouteBoundary('triage', <TriagePage />)} />
                        <Route path="/admin" element={withRouteBoundary('admin', <AdminPage />)} />
                        <Route path="/demo" element={withRouteBoundary('demo', <DemoPage />)} />
                        <Route path="/privacy" element={withRouteBoundary('privacy', <PrivacyPage />)} />
                        <Route path="/architecture" element={withRouteBoundary('architecture', <ArchitecturePage />)} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </NotificationProvider>
              </DemoProvider>
            </HighContrastProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
