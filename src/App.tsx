import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { DonorPortal } from './components/donor/DonorPortal';
import { HospitalPortal } from './components/hospital/HospitalPortal';
import { EmergencyRadar } from './components/emergency/EmergencyRadar';
import { CompatibilityMatrix } from './components/compatibility/CompatibilityMatrix';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { UserRole } from './types';

function MainApp() {
  const { role } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<UserRole>('DONOR');

  const openAuthModal = (targetRole: UserRole = 'DONOR') => {
    setAuthModalRole(targetRole);
    setIsAuthModalOpen(true);
  };

  return (
    <AppShell
      currentTab={currentTab}
      setCurrentTab={setCurrentTab}
      openAuthModal={openAuthModal}
    >
      <div className="flex-1">
        {currentTab === 'home' && (
          <LandingPage
            setCurrentTab={setCurrentTab}
            openAuthModal={openAuthModal}
          />
        )}

        {currentTab === 'hospital' && <HospitalPortal />}

        {currentTab === 'donor' && <DonorPortal />}

        {currentTab === 'emergencies' && <EmergencyRadar />}

        {currentTab === 'compatibility' && <CompatibilityMatrix />}

        {currentTab === 'admin' && <AdminPortal />}
      </div>

      <Footer setCurrentTab={setCurrentTab} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialRole={authModalRole}
        onSuccessNavigate={tab => setCurrentTab(tab)}
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
