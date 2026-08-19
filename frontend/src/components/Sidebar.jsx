import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut,
  Users,
  ShieldCheck,
  Stethoscope,
  HelpCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { useVault } from '../context/VaultContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, role, logout } = useAuth();
  const { doctors } = useVault();
  const currentRole = (user?.role || role || 'patient').toLowerCase();

  const currentDocEmail = (user?.email || '').toLowerCase().trim();
  const matchedDocRecord = (doctors || []).find(d => d.email && d.email.toLowerCase() === currentDocEmail);
  const isDoctorApproved = matchedDocRecord ? (matchedDocRecord.status === 'Approved' || matchedDocRecord.verificationStatus === 'APPROVED') : false;

  const getNavItems = () => {
    if (currentRole === 'doctor') {
      if (!isDoctorApproved) {
        return [
          { id: 'verification', label: 'License Verification', icon: ShieldCheck },
          { id: 'settings', label: 'Profile Settings', icon: Settings },
        ];
      }

      return [
        { id: 'dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
        { id: 'patients', label: 'My Assigned Patients', icon: Users },
        { id: 'chat', label: 'Patient Messages', icon: MessageSquare },
        { id: 'review', label: 'Report Review Queue', icon: FileText },
        { id: 'prescriptions', label: 'Issue Prescriptions', icon: Stethoscope },
        { id: 'appointments', label: 'Consultation Schedule', icon: Calendar },
        { id: 'verification', label: 'License Verification', icon: ShieldCheck },
        { id: 'reviews', label: 'Patient Reviews Received', icon: Star },
        { id: 'settings', label: 'Profile Settings', icon: Settings },
      ];
    }

    if (currentRole === 'admin') {
      return [
        { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'patients', label: 'Manage Patients', icon: Users },
        { id: 'doctors', label: 'Manage Doctors', icon: Stethoscope },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    // Default Patient ka Navigation wala section
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reports', label: 'My Reports', icon: FileText },
      { id: 'chat', label: 'Chat with Doctor', icon: MessageSquare },
      { id: 'family-vault', label: 'Family Vault', icon: Users },
      { id: 'upload', label: 'Upload Report', icon: Upload },
      { id: 'summary', label: 'AI Health Summary', icon: Sparkles },
      { id: 'timeline', label: 'Timeline & Analytics', icon: Clock },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'help', label: 'Help & Guide', icon: HelpCircle },
      { id: 'settings', label: 'Profile Settings', icon: Settings },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-[#E5E0D5] flex flex-col h-screen sticky top-0 z-30 select-none shadow-sm">
      {/* Brand Header */}
      <div className="px-6 py-6 border-b border-[#E5E0D5] shadow-[0_2px_10px_rgba(0,0,0,0.03)] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer min-h-[44px]">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm flex-shrink-0">
            +
          </div>
          <span className="font-extrabold text-xl tracking-tight text-black whitespace-nowrap">
            VaultCare <span className="text-[#C9A574]">AI</span>
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#C9A574] text-white shadow-sm font-semibold'
                  : 'text-[#4A4A4A] hover:bg-[#F4F0E8] hover:text-black'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#777777]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-[#E5E0D5] bg-[#FAF8F5]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white font-bold flex items-center justify-center text-sm shadow-sm border-2 border-[#C9A574]">
              {user?.fullName ? user.fullName.charAt(0) : 'P'}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-bold text-black truncate max-w-[110px]">
                {user?.fullName || 'Patient One'}
              </span>
              <span className="text-xs text-[#777777] capitalize">
                {currentRole}
              </span>
              </div>
            </div>
            <button
                onClick={logout}
                title="Logout"
                className="p-2 text-[#777777] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    </div>
    </aside>
  );
}
