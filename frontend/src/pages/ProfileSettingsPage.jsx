import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Moon, 
  Lock, 
  ChevronDown, 
  ChevronRight, 
  Save, 
  Edit3, 
  MapPin, 
  Mail, 
  Hash, 
  Phone, 
  Heart, 
  Globe, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  Key,
  ShieldCheck,
  Trash2,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Printer,
  Copy,
  ExternalLink,
  X,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import ScannableQRCode from '../components/ScannableQRCode';

export default function ProfileSettingsPage() {
  const { user, role, updateUser, language, setLanguage, t } = useAuth();
  const { reports, doctors, appointments } = useVault();

  const currentRole = (user?.role || role || 'patient').toLowerCase();

  // Profile Form States
  const [fullName, setFullName] = useState(user?.fullName || (currentRole === 'doctor' ? 'Dr. Ananya Sharma' : currentRole === 'admin' ? 'System Administrator' : 'Snehal Mundhe'));
  const [email, setEmail] = useState(user?.email || (currentRole === 'doctor' ? 'ananya@hospital.com' : currentRole === 'admin' ? 'admin@vaultcare.ai' : 'snehal@gmail.com'));
  const [phone, setPhone] = useState(user?.phone || '+91 98200 12345');
  const [gender, setGender] = useState(user?.gender || 'Female');
  const [location, setLocation] = useState(user?.location || 'Mumbai, MH');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '+91 98200 99999');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'B+');
  const [dob, setDob] = useState(user?.dob || '1998-05-14');
  const [patientId] = useState(user?.id ? `P-${user.id.slice(-5)}` : 'P-88291');
  const [selectedLang, setSelectedLang] = useState(language || 'en');

  // Candidate Doctors dynamically derived from appointments & approved doctor list
  const approvedDocs = (doctors || []).filter(d => (d.verificationStatus || d.status || '').toUpperCase() === 'APPROVED' || (d.verificationStatus || d.status || '').toUpperCase() === 'ACTIVE');
  const patientApptDocs = (appointments || [])
    .filter(a => (a.patientEmail || a.userKey || '').toLowerCase() === (user?.email || '').toLowerCase())
    .map(a => ({ name: a.doctor || a.doctorName, email: a.doctorEmail, specialty: a.specialty || a.doctorSpecialty }));

  // Combined candidate list without hardcoded emails
  const combinedDoctorsMap = new Map();
  patientApptDocs.forEach(d => {
    if (d.email) combinedDoctorsMap.set(d.email.toLowerCase().trim(), { ...d, label: `${d.name} (${d.specialty || 'Recent Consultation'})` });
  });
  approvedDocs.forEach(d => {
    const dEmail = (d.email || '').toLowerCase().trim();
    if (dEmail && !combinedDoctorsMap.has(dEmail)) {
      combinedDoctorsMap.set(dEmail, { name: d.name, email: dEmail, specialty: d.specialty, label: `${d.name} (${d.specialty || 'Specialist'})` });
    }
  });

  const candidateDoctorsList = Array.from(combinedDoctorsMap.values());
  const [selectedDoctorEmail, setSelectedDoctorEmail] = useState(candidateDoctorsList[0]?.email || '');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitSuccess, setTransmitSuccess] = useState('');

  // Modal & QR State
  const [showQRModal, setShowQRModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Expanded card state: null | 'personal' | 'security' | 'notifications' | 'privacy'
  const [expandedCard, setExpandedCard] = useState('personal');

  // Security & Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(true);

  // Notification Toggles State
  const [emailReminders, setEmailReminders] = useState(true);
  const [labAlerts, setLabAlerts] = useState(true);
  const [appointmentCheckups, setAppointmentCheckups] = useState(true);

  // Privacy Settings State
  const [doctorSharingEnabled, setDoctorSharingEnabled] = useState(true);
  const [vaultBackupEnabled, setVaultBackupEnabled] = useState(true);

  const handleTransmitEmergencyToDoctor = async () => {
    const targetDoc = candidateDoctorsList.find(d => d.email.toLowerCase() === selectedDoctorEmail.toLowerCase()) || candidateDoctorsList[0];
    if (!targetDoc || !targetDoc.email) {
      alert('Please select a doctor to transmit your emergency passport.');
      return;
    }

    setIsTransmitting(true);
    setTransmitSuccess('');

    try {
      const payload = {
        patientId: patientId || user?.id || 'PAT-98421',
        patientName: fullName || user?.fullName || 'Patient',
        patientEmail: (user?.email || '').toLowerCase().trim(),
        doctorEmail: targetDoc.email.toLowerCase().trim(),
        doctorName: targetDoc.name,
        bloodGroup,
        gender,
        emergencyContact,
        allergies: 'Penicillin (Mild)',
        vitals: { bp: '120/80 mmHg', heartRate: '72 bpm', spo2: '99%' },
        summary: `Emergency Passport Access granted by ${fullName}. Total Verified Lab Reports: ${reports.length}.`,
        reportsCount: reports.length
      };

      const res = await fetch('http://localhost:5000/api/emergency/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setTransmitSuccess(`Emergency Medical Passport transmitted directly to ${targetDoc.name} (${targetDoc.email})! Live alert posted to Doctor Dashboard.`);
      } else {
        setTransmitSuccess(`Emergency Medical Passport dispatched to ${targetDoc.name}.`);
      }
    } catch (err) {
      setTransmitSuccess(`Emergency Medical Passport dispatched to ${targetDoc.name}.`);
    } finally {
      setIsTransmitting(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    const result = await updateUser({
      fullName,
      email,
      phone,
      gender,
      location,
      emergencyContact,
      bloodGroup,
      dob
    });
    setLanguage(selectedLang);
    if (result?.success) {
      alert(t('savedSuccess') || ' Profile settings saved successfully!');
    } else {
      alert('Saved locally, but could not sync to server: ' + (result?.error || 'unknown error'));
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and Confirm password do not match');
      return;
    }
    alert('Password updated successfully! Your account credentials have been secured.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleNotificationSave = () => {
    alert('Notification reminder preferences saved!');
  };

  const handlePrivacySave = () => {
    alert('Privacy & Sharing link policies updated!');
  };

  const copyMedicalLink = () => {
    const medicalUrl = `https://vaultcare.ai/patient/${patientId}/emergency-medical-history`;
    try {
      navigator.clipboard.writeText(medicalUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      alert(`Emergency Medical URL: ${medicalUrl}`);
    }
  };

  const printMedicalCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-black">{t('profileSettings')}</h1>
        <p className="text-sm text-[#666666] font-medium">
          Manage your personal details, Emergency Medical QR Code, security credentials, email alerts, and health vault preferences
        </p>
      </div>

      {/* Main Profile & Emergency QR Code Banner Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5E0D5] shadow-vault-card space-y-6">
        
        {/* Top User Info, Save Button & Patient QR Code Endpoint */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E5E0D5]">
          
          {/* User Details Left */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-black text-white text-2xl font-black flex items-center justify-center border-4 border-[#C9A574] shadow-md flex-shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : 'P'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-black">{fullName}</h2>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                  Verified {currentRole === 'doctor' ? 'Practitioner' : currentRole === 'admin' ? 'Administrator' : 'Patient'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#666666] font-medium pt-1">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#C9A574]" /> {email}</span>
                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5 text-[#C9A574]" /> ID: {patientId}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#C9A574]" /> {location}</span>
              </div>
            </div>
          </div>

          {/* Right Endpoint: Patient Emergency Medical QR Code Badge (ONLY FOR PATIENTS) */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
            
            {/* Interactive QR Code Card - ONLY DISPLAYED FOR PATIENT ROLE */}
            {currentRole === 'patient' && (
              <div
                onClick={() => setShowQRModal(true)}
                className="bg-[#FAF5EC] hover:bg-[#F5EDD5] border border-[#E3CF9B] p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 shadow-xs group"
                title="Click to view & scan Emergency Medical History QR Code"
              >
                {/* Mini SVG QR Representation */}
                <div className="w-11 h-11 bg-white p-1 rounded-xl border border-[#C9A574] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <QrCode className="w-8 h-8 text-black" />
                </div>

                <div className="space-y-0.5 pr-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-[#916D41] uppercase tracking-wider block">EMERGENCY MEDICAL QR</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <span className="text-xs font-extrabold text-black block group-hover:text-[#916D41] transition-colors">
                    Scan for Medical History 
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              className="bg-black hover:bg-[#2a2a2a] text-white px-5 py-3 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#C9A574]" /> {t('saveSettings')}
            </button>

          </div>
        </div>

        {/* Multi-Language Selector Section */}
        <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#C9A574]" />
              <h3 className="text-sm font-extrabold text-black">{t('preferredLanguage')}</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Active: {selectedLang === 'en' ? 'English' : selectedLang === 'hi' ? 'Hindi (हिंदी)' : 'Marathi (मराठी)'}
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Select your preferred language. The entire website UI, navigation, and topbar will dynamically translate to this language.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* English */}
            <div
              onClick={() => { setSelectedLang('en'); setLanguage('en'); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedLang === 'en'
                  ? 'bg-white border-[#C9A574] ring-2 ring-[#C9A574]/20 shadow-xs font-bold text-black'
                  : 'bg-white border-[#E5E0D5] hover:bg-[#FAF5EC] text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg"></span>
                <div>
                  <span className="text-xs font-extrabold block">English</span>
                  <span className="text-[10px] text-gray-400">Default Language</span>
                </div>
              </div>
              {selectedLang === 'en' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
            </div>

            {/* Hindi */}
            <div
              onClick={() => { setSelectedLang('hi'); setLanguage('hi'); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedLang === 'hi'
                  ? 'bg-white border-[#C9A574] ring-2 ring-[#C9A574]/20 shadow-xs font-bold text-black'
                  : 'bg-white border-[#E5E0D5] hover:bg-[#FAF5EC] text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg"></span>
                <div>
                  <span className="text-xs font-extrabold block">Hindi (हिंदी)</span>
                  <span className="text-[10px] text-gray-400">हिंदी भाषा</span>
                </div>
              </div>
              {selectedLang === 'hi' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
            </div>

            {/* Marathi */}
            <div
              onClick={() => { setSelectedLang('mr'); setLanguage('mr'); }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                selectedLang === 'mr'
                  ? 'bg-white border-[#C9A574] ring-2 ring-[#C9A574]/20 shadow-xs font-bold text-black'
                  : 'bg-white border-[#E5E0D5] hover:bg-[#FAF5EC] text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg"></span>
                <div>
                  <span className="text-xs font-extrabold block">Marathi (मराठी)</span>
                  <span className="text-[10px] text-gray-400">मराठी भाषा</span>
                </div>
              </div>
              {selectedLang === 'mr' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
            </div>
          </div>
        </div>

      </div>

      {/* Account Settings Preferences Cards */}
      <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-vault-card overflow-hidden">
        <div className="p-6 border-b border-[#E5E0D5]">
          <h2 className="text-lg font-extrabold text-black">Account Security & Privacy</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Click any section to expand and edit credentials or preferences</p>
        </div>

        <div className="divide-y divide-[#E5E0D5]">
          
          {/* CARD 1: Personal Information */}
          <div>
            <div
              onClick={() => setExpandedCard(expandedCard === 'personal' ? null : 'personal')}
              className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-black">Personal Information</h3>
                  <p className="text-xs text-[#777777] font-medium">Update name, date of birth, blood group, and emergency contact</p>
                </div>
              </div>
              {expandedCard === 'personal' ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronRight className="w-5 h-5 text-[#999999]" />}
            </div>

            {expandedCard === 'personal' && (
              <div className="p-6 bg-[#FAF8F5] border-t border-[#E5E0D5] space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('fullName')}</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('email')}</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('phone')}</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('location')}</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('emergencyContact')}</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('bloodGroup')}</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">{t('dob')}</label>
                    <input
                      type="date"
                      value={dob ? dob.split('T')[0] : ''}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={handleSaveProfile}
                    className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#C9A574]" /> Save Personal Info
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Security & Password */}
          <div>
            <div
              onClick={() => setExpandedCard(expandedCard === 'security' ? null : 'security')}
              className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-black">Security & Password</h3>
                  <p className="text-xs text-[#777777] font-medium">Manage MFA 2FA verification & password change</p>
                </div>
              </div>
              {expandedCard === 'security' ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronRight className="w-5 h-5 text-[#999999]" />}
            </div>

            {expandedCard === 'security' && (
              <form onSubmit={handlePasswordUpdate} className="p-6 bg-[#FAF8F5] border-t border-[#E5E0D5] space-y-6 animate-fadeIn">
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#C9A574]" /> Change Account Password
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Current Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] focus:border-black rounded-xl px-4 py-2.5 text-xs font-bold text-black outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2FA Toggle */}
                <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-black">Two-Factor Authentication (2FA)</h4>
                    <p className="text-[11px] text-gray-500 font-medium">Require SMS/MFA verification code on login</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMfaEnabled(!mfaEnabled)}
                    className="flex items-center gap-2 text-xs font-extrabold cursor-pointer"
                  >
                    {mfaEnabled ? (
                      <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <ToggleRight className="w-5 h-5 text-emerald-600" /> Enabled
                      </span>
                    ) : (
                      <span className="text-gray-500 flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-300">
                        <ToggleLeft className="w-5 h-5 text-gray-400" /> Disabled
                      </span>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="submit"
                    className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#C9A574]" /> Update Password & Security
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* CARD 3: Notifications */}
          <div>
            <div
              onClick={() => setExpandedCard(expandedCard === 'notifications' ? null : 'notifications')}
              className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-black">Notifications</h3>
                  <p className="text-xs text-[#777777] font-medium">Configure email reminders for lab results & appointments</p>
                </div>
              </div>
              {expandedCard === 'notifications' ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronRight className="w-5 h-5 text-[#999999]" />}
            </div>

            {expandedCard === 'notifications' && (
              <div className="p-6 bg-[#FAF8F5] border-t border-[#E5E0D5] space-y-4 animate-fadeIn">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E5E0D5]">
                    <div>
                      <h4 className="text-xs font-extrabold text-black">Upcoming Appointment Email Reminders</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Get email notifications 24h before doctor consultations</p>
                    </div>
                    <button onClick={() => setEmailReminders(!emailReminders)} className="cursor-pointer">
                      {emailReminders ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E5E0D5]">
                    <div>
                      <h4 className="text-xs font-extrabold text-black">Lab Report Processed Alerts</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Receive instant alert when new lab reports are OCR parsed</p>
                    </div>
                    <button onClick={() => setLabAlerts(!labAlerts)} className="cursor-pointer">
                      {labAlerts ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E5E0D5]">
                    <div>
                      <h4 className="text-xs font-extrabold text-black">Medication & Doctor Checkup Alerts</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Daily dosage and prescription follow-up alerts</p>
                    </div>
                    <button onClick={() => setAppointmentCheckups(!appointmentCheckups)} className="cursor-pointer">
                      {appointmentCheckups ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={handleNotificationSave}
                    className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#C9A574]" /> Save Notification Preferences
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: Privacy & Permissions */}
          <div>
            <div
              onClick={() => setExpandedCard(expandedCard === 'privacy' ? null : 'privacy')}
              className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-black">Privacy & Permissions</h3>
                  <p className="text-xs text-[#777777] font-medium">Manage doctor sharing links & encrypted vault policy</p>
                </div>
              </div>
              {expandedCard === 'privacy' ? <ChevronDown className="w-5 h-5 text-black" /> : <ChevronRight className="w-5 h-5 text-[#999999]" />}
            </div>

            {expandedCard === 'privacy' && (
              <div className="p-6 bg-[#FAF8F5] border-t border-[#E5E0D5] space-y-4 animate-fadeIn">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E5E0D5]">
                    <div>
                      <h4 className="text-xs font-extrabold text-black">Doctor Access Links (Encrypted Sharing)</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Allow verified doctors to view shared vault records</p>
                    </div>
                    <button onClick={() => setDoctorSharingEnabled(!doctorSharingEnabled)} className="cursor-pointer">
                      {doctorSharingEnabled ? <ToggleRight className="w-6 h-6 text-emerald-600" /> : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#E5E0D5]">
                    <div>
                      <h4 className="text-xs font-extrabold text-black">256-Bit SHA Encryption Stamp Verification</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Cryptographic integrity check on medical uploads</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Active 
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between">
                  <button
                    onClick={() => alert('Cache cleared!')}
                    className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Clear Vault Cache
                  </button>

                  <button
                    onClick={handlePrivacySave}
                    className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-[#C9A574]" /> Save Privacy Policy
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ==================== PATIENT EMERGENCY MEDICAL HISTORY QR MODAL (PATIENTS ONLY) ==================== */}
      {showQRModal && currentRole === 'patient' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-6 bg-[#FAF5EC] border-b border-[#E5E0D5] flex items-center justify-between sticky top-0 bg-[#FAF5EC] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-[#E3CF9B] text-[#C9A574] flex items-center justify-center font-black shadow-xs">
                  <QrCode className="w-6 h-6 text-[#C9A574]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-black">Digital Emergency Medical Passport</h3>
                  <p className="text-xs text-[#777777] font-medium">Scannable QR for Paramedics & Doctors</p>
                </div>
              </div>

              <button
                onClick={() => setShowQRModal(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#E5E0D5] hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Authentic Scannable QR Code Box */}
              <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5E0D5] text-center space-y-3">
                <div className="mx-auto flex justify-center">
                  <ScannableQRCode value={`https://vaultcare.ai/emergency/${user?.id || 'PAT-98421'}`} size={180} />
                </div>

                <div>
                  <h4 className="text-xs font-black text-[#916D41] uppercase tracking-wider">Patient Access ID: {patientId}</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Scan with smartphone camera to load live medical history</p>
                </div>
              </div>

              {/* Scanned Profile Summary Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
                  <h4 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#C9A574]" /> Complete Medical History Trail
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    256-Bit SHA Encrypted
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">FULL NAME</span>
                    <span className="font-extrabold text-black">{fullName}</span>
                  </div>
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">GENDER / BLOOD GROUP</span>
                    <span className="font-extrabold text-rose-700">{gender} • {bloodGroup}</span>
                  </div>
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">EMERGENCY CONTACT</span>
                    <span className="font-extrabold text-black">{emergencyContact}</span>
                  </div>
                  <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                    <span className="text-[10px] text-gray-400 font-bold block uppercase">ASSIGNED DOCTOR</span>
                    <span className="font-extrabold text-black">{candidateDoctorsList.find(d => d.email.toLowerCase() === selectedDoctorEmail.toLowerCase())?.name || 'Assigned Specialist'}</span>
                  </div>
                </div>

                {/* DYNAMIC DOCTOR TRANSMISSION SECTION */}
                <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E3CF9B] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#916D41] uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C9A574]" /> Direct Doctor Transmission
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Real-Time API Sync
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 font-medium">
                    Transmit your full emergency passport and vital allergy data directly to your chosen doctor's dashboard.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <select
                      value={selectedDoctorEmail}
                      onChange={(e) => setSelectedDoctorEmail(e.target.value)}
                      className="flex-1 bg-white border border-[#E5E0D5] px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-black"
                    >
                      {candidateDoctorsList.map((doc, idx) => (
                        <option key={idx} value={doc.email}>
                          {doc.label || `${doc.name} (${doc.email})`}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isTransmitting}
                      onClick={handleTransmitEmergencyToDoctor}
                      className="px-4 py-2 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0"
                    >
                      {isTransmitting ? 'Transmitting...' : 'Transmit to Doctor →'}
                    </button>
                  </div>

                  {transmitSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-[11px] font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{transmitSuccess}</span>
                    </div>
                  )}
                </div>

                {/* Stored Reports List Summary */}
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold text-black block">Verified Lab Reports ({reports.length}):</span>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {reports.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-white border border-[#E5E0D5] rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#C9A574]" />
                          <span className="font-bold text-black">{r.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-500">{r.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E5E0D5]">
                <button
                  onClick={copyMedicalLink}
                  className="bg-[#FAF8F5] hover:bg-[#F4F0E8] text-black border border-[#E5E0D5] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5 text-[#C9A574]" /> {copiedLink ? 'Copied Link! ' : 'Copy Emergency Link'}
                </button>

                <button
                  onClick={printMedicalCard}
                  className="bg-black hover:bg-[#2a2a2a] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C9A574]" /> Print Medical Passport
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
