import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { LanguageProvider } from './contexts/LanguageContext.js';
import { HighContrastProvider } from './contexts/HighContrastContext.js';
import { DemoProvider } from './contexts/DemoContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { KioskPage } from './pages/KioskPage.js';
import { DoctorPage } from './pages/DoctorPage.js';
import { TriagePage } from './pages/TriagePage.js';
import { AdminPage } from './pages/AdminPage.js';
import { DemoPage } from './pages/DemoPage.js';
import { PrivacyPage } from './pages/PrivacyPage.js';
import { ArchitecturePage } from './pages/ArchitecturePage.js';

export const App: React.FC = () => {
  return (
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
                      <Route path="/" element={<KioskPage />} />
                      <Route path="/kiosk" element={<KioskPage />} />
                      <Route path="/doctor" element={<DoctorPage />} />
                      <Route path="/triage" element={<TriagePage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/demo" element={<DemoPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                      <Route path="/architecture" element={<ArchitecturePage />} />
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
  );
};
