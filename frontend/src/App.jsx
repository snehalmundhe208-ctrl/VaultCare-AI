import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider } from './context/VaultContext';

// Pre-login pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import MFAPage from './pages/MFAPage';

// App shell
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Patient pages (each is its own tab)
import PatientDashboard from './pages/PatientDashboard';
import MyReportsPage from './pages/MyReportsPage';
import UploadReportPage from './pages/UploadReportPage';
import AISummaryPage from './pages/AISummaryPage';
import HealthTimelinePage from './pages/HealthTimelinePage';
import AppointmentsPage from './pages/AppointmentsPage';
import FamilyVaultPage from './pages/FamilyVaultPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import ChatWindow from './components/ChatWindow';

// Doctor / Admin — these are self-contained multi-tab dashboards
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';


// Human-readable titles shown in the Topbar for each patient tab
const PATIENT_TAB_TITLES = {
  dashboard: 'Dashboard',
  reports: 'My Reports',
  chat: 'Chat with Doctor',
  'family-vault': 'Family Vault',
  upload: 'Upload Report',
  summary: 'AI Health Summary',
  timeline: 'Timeline & Analytics',
  appointments: 'Appointments',
  help: 'Help & Guide',
  settings: 'Profile Settings'
};

function AppContent() {
  // Pre-login navigation: 'landing' | 'login' | 'signup' | 'role-select' | 'forgot-mfa'
  const [page, setPage] = useState('landing');
  // Post-login active sidebar tab
  const [activeTab, setActiveTab] = useState('dashboard');

  const { user, mfaVerified } = useAuth();

  const handleNavigate = (target) => setPage(target);

  // ===================== LOGGED-IN APP SHELL =====================
  if (user && mfaVerified) {
    const currentRole = (user.role || 'patient').toLowerCase();

    const renderContent = () => {
      if (currentRole === 'doctor') {
        // DoctorDashboard handles all of its own tabs internally
        return <DoctorDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }

      if (currentRole === 'admin') {
        // AdminDashboard handles all of its own tabs internally
        return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }

      // Patient — each sidebar tab maps to its own standalone page
      switch (activeTab) {
        case 'dashboard':
          return <PatientDashboard onNavigateTab={setActiveTab} />;
        case 'reports':
          return <MyReportsPage />;
        case 'chat':
          return <ChatWindow />;
        case 'family-vault':
          return <FamilyVaultPage />;
        case 'upload':
          return <UploadReportPage onNavigateTab={setActiveTab} />;
        case 'summary':
          return <AISummaryPage />;
        case 'timeline':
          return <HealthTimelinePage />;
        case 'appointments':
          return <AppointmentsPage />;
        case 'settings':
          return <ProfileSettingsPage />;
        case 'help':
          // No dedicated Help & Guide page exists yet in this repo.
          return (
            <div className="p-8 text-sm text-gray-500 font-medium">
              Help & Guide content coming soon.
            </div>
          );
        default:
          return <PatientDashboard onNavigateTab={setActiveTab} />;
      }
    };

    const topbarTitle =
      currentRole === 'patient'
        ? PATIENT_TAB_TITLES[activeTab] || 'VaultCare AI'
        : 'VaultCare AI';

    return (
      <div className="flex min-h-screen bg-[#FAF8F5]">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title={topbarTitle} />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
    );
  }

  // ===================== PRE-LOGIN FLOW =====================
  switch (page) {
    case 'login':
      return <LoginPage onNavigate={handleNavigate} />;
    case 'signup':
      return <SignupPage onNavigate={handleNavigate} />;
    case 'role-select':
      return <RoleSelectionPage onNavigate={handleNavigate} />;
    case 'forgot-mfa':
      return <MFAPage onNavigate={handleNavigate} isForgotPasswordMode={true} />;
    case 'landing':
    default:
      return <LandingPage onNavigate={handleNavigate} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </AuthProvider>
  );
}