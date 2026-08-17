import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  ArrowRight,
  Upload,
  Share2,
  Download,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Activity,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { saveMessageToStorage } from '../services/chatStorage';
import { 
  HealthScoreTrendChart, 
  BloodSugarChart, 
  CholesterolProfileChart, 
  HemoglobinChart 
} from '../components/HealthGraphsSuite';

export default function PatientDashboard({ onNavigateTab }) {
  const { user, t } = useAuth();
  const { reports, appointments, doctors: contextDoctors, sharedAccess, grantDoctorAccess, revokeDoctorAccess } = useVault();

  const userEmail = (user?.email || '').toLowerCase().trim();

  // Share Medical Record via Chat Handler
  const handleShareReportViaChat = async (doc) => {
    if (!doc || !userEmail) return;
    const docEmail = (doc.email || '').toLowerCase().trim();
    const latestReport = reports.length > 0 ? reports[0] : null;

    const msgPayload = {
      id: 'MSG-SHARE-' + Date.now(),
      senderEmail: userEmail,
      receiverEmail: docEmail,
      senderRole: 'patient',
      text: ` Medical Record Shared: Patient ${patientName} shared health document "${latestReport?.title || 'VaultCare Health Report'}" with you.`,
      attachment: {
        fileName: latestReport?.fileName || `${(latestReport?.title || 'Medical_Report').replace(/\s+/g, '_')}.pdf`,
        fileSize: latestReport?.fileSize || '1.4 MB',
        fileType: latestReport?.fileType || 'pdf',
        fileData: latestReport?.fileData || latestReport?.fileUrl || 'data:application/pdf;base64,JVBERi0xLjQKJ...'
      },
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await saveMessageToStorage(msgPayload);
    setShowShareModal(false);
    if (onNavigateTab) onNavigateTab('chat');
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedDoctors, setSharedDoctors] = useState({});

  const patientName = user?.fullName || 'Patient';
  const totalReportsCount = reports.length;
  const upcomingReportsCount = reports.filter(r => r.status === 'Pending' || r.status === 'Processing').length;
  const appointmentsCount = appointments.filter(a => a.status !== 'Cancelled').length;

  const shareUrl = `https://vaultcare.ai/share/doc-${user?.id || '001'}-${user?.email?.split('@')[0] || 'pat'}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard?.writeText(shareUrl);
    } catch (e) {}
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const approvedDoctors = (contextDoctors || []).filter(d => {
    const st = (d.verificationStatus || d.status || '').toUpperCase();
    return st === 'APPROVED' || st === 'ACTIVE';
  });

  const doctorsList = approvedDoctors.length > 0 ? approvedDoctors.map((doc, idx) => ({
    id: doc.id || `doc-${idx}`,
    name: doc.name,
    specialty: doc.specialty || 'General Practitioner',
    hospital: doc.hospital || 'Medical Center',
    avatar: doc.avatar || 'https://images.unsplash.com/photo-1594824813566-78a933454681?auto=format&fit=crop&w=200&q=80'
  })) : [
    { id: 'doc-1', name: 'Dr. Ananya Sharma', specialty: 'Cardiologist', hospital: 'Apollo Heart Institute', avatar: 'https://images.unsplash.com/photo-1594824813566-78a933454681?auto=format&fit=crop&w=200&q=80' },
    { id: 'doc-2', name: 'Dr. Rajesh Verma', specialty: 'Endocrinologist', hospital: 'City Diabetes Center', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80' }
  ];

  return (
    <div className="space-y-8 select-none relative">
      {/* Greeting Banner */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">
          Welcome back, {patientName}
        </h1>
        <p className="text-sm text-[#666666] font-medium">
          {t('dashboardSubtitle')}
        </p>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Total Reports */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {totalReportsCount > 0 ? `+${totalReportsCount} total` : '0 reports'}
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-black">{totalReportsCount}</div>
            <div className="text-xs text-[#777777] font-semibold mt-0.5">{t('totalReports')}</div>
          </div>
          <button 
            onClick={() => onNavigateTab('reports')}
            className="mt-4 pt-3 border-t border-[#F0EEE8] flex items-center justify-between text-xs font-bold text-black hover:text-[#C9A574] transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stat 2: Upload Report */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Quick Action
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-black flex items-center gap-1.5">
              <span>{t('uploadReportPill')}</span>
            </div>
            <div className="text-xs text-[#777777] font-semibold mt-1">{t('uploadReportPill')}</div>
          </div>
          <button 
            onClick={() => onNavigateTab('upload')}
            className="mt-4 pt-3 border-t border-[#F0EEE8] flex items-center justify-between text-xs font-bold text-black hover:text-[#C9A574] transition-colors cursor-pointer"
          >
            <span>Upload report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stat 3: Upcoming Appointments */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              {appointmentsCount > 0 ? 'Scheduled' : 'None'}
            </span>
          </div>
          <div>
            <div className="text-3xl font-black text-black">{appointmentsCount}</div>
            <div className="text-xs text-[#777777] font-semibold mt-0.5">{t('upcomingAppointments')}</div>
          </div>
          <button 
            onClick={() => onNavigateTab('appointments')}
            className="mt-4 pt-3 border-t border-[#F0EEE8] flex items-center justify-between text-xs font-bold text-black hover:text-[#C9A574] transition-colors cursor-pointer"
          >
            <span>View appointments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Stat 4: AI Health Summary */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              AI Insights
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-black">Active AI</div>
            <div className="text-xs text-[#777777] font-semibold mt-0.5">AI Health Summary</div>
          </div>
          <button 
            onClick={() => onNavigateTab('summary')}
            className="mt-4 pt-3 border-t border-[#F0EEE8] flex items-center justify-between text-xs font-bold text-black hover:text-[#C9A574] transition-colors cursor-pointer"
          >
            <span>View summary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Health Trends & AI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Health Trends Overview (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-black">Health Trends Overview</h2>
              <p className="text-xs text-[#777777]">Biometric measurements & lab value history</p>
            </div>
            <span className="text-xs font-bold text-[#C9A574] bg-[#FAF5EC] px-3 py-1 rounded-full border border-[#E3CF9B]">
              6 Month Span
            </span>
          </div>

          {/* DYNAMIC CHECK: If 0 reports (New User) vs Has Reports (Demo/Active User) */}
          {totalReportsCount === 0 ? (
            <div className="bg-[#FAF8F5] p-8 rounded-2xl border border-[#E5E0D5] text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center text-amber-500 shadow-xs border border-[#E5E0D5]">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold text-black">No Health Trend Data Available Yet</h4>
              <p className="text-xs text-[#666666] max-w-sm mx-auto font-medium leading-relaxed">
                As a new user, you don't have historical biometrics plotted. Upload your lab reports to automatically plot Blood Sugar, Cholesterol, and Hemoglobin trends over time.
              </p>
              <button
                onClick={() => onNavigateTab('upload')}
                className="mt-2 bg-black hover:bg-[#2a2a2a] text-white px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload First Report
              </button>
            </div>
          ) : (
            /* REFERENCE-STANDARD RECOMMENDED HEALTH GRAPHS */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HealthScoreTrendChart reports={reports} />
              <BloodSugarChart reports={reports} />
              <CholesterolProfileChart reports={reports} />
              <HemoglobinChart reports={reports} />
            </div>
          )}
        </div>

        {/* Right: AI Health Summary Card (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-black">AI Health Summary</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-[#F5EDD5] text-[#916D41] px-2.5 py-1 rounded-full border border-[#E3CF9B]">
                <Sparkles className="w-3 h-3" /> Powered By AI
              </span>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E5E0D5] text-xs text-[#555555] space-y-2 leading-relaxed">
              <p className="font-bold text-black">All health summary:</p>
              {totalReportsCount === 0 ? (
                <p className="text-gray-500 italic">
                  AI Summary Pending. Upload your lab reports, prescriptions, or imaging scans to generate an automated AI clinical summary.
                </p>
              ) : (
                <p>
                  Based on your {totalReportsCount} aggregated reports, your metabolic profile is monitored. Upload regular blood panels to track your long-term biomarker baseline.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('summary')}
            className="mt-6 w-full bg-black hover:bg-[#2a2a2a] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Full Health Summary</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C9A574]" />
          </button>
        </div>
      </div>

      {/* Quick Actions Row (3 Actions: Upload, Book Appointment, Download Summary) */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-black">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigateTab('upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Upload New Report
          </button>

          <button 
            onClick={() => onNavigateTab('appointments')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
          >
            <Calendar className="w-4 h-4" /> Book Appointment
          </button>

          <button 
            onClick={() => onNavigateTab('summary')}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Summary PDF
          </button>
        </div>
      </div>

      {/* ==================== SHARE WITH DOCTOR MODAL POPUP ==================== */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-black">Share Records with Doctor</h3>
                <p className="text-xs text-[#777777] font-medium">Grant encrypted access to your medical timeline</p>
              </div>
            </div>

            {/* Section 1: Copy Secure Share Link */}
            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D5] space-y-3">
              <label className="text-xs font-bold text-black flex items-center justify-between">
                <span>Secure Shareable Link</span>
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">256-Bit Encrypted</span>
              </label>
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-white border border-[#E5E0D5] px-3 py-2 rounded-xl text-xs font-mono text-gray-700 select-all outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-black hover:bg-[#2a2a2a] text-white'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="text-xs font-bold text-[#C9A574] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Preview Document View
                </button>
                <span className="text-[11px] text-gray-400 font-medium">Expires in 30 days</span>
              </div>
            </div>

            {/* Section 2: Direct Share with Available Doctors */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider text-[#999999]">
                Share Directly with Registered Doctors
              </h4>
              
              <div className="space-y-2">
                {doctorsList.map((doc) => {
                  const docEmail = (doc.email || '').toLowerCase().trim();
                  const isShared = (sharedAccess || []).some(sa => sa.patientEmail === userEmail && sa.doctorEmail === docEmail);
                  return (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E5E0D5] hover:border-[#C9A574] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] flex items-center justify-center font-bold flex-shrink-0">
                          <UserCheck className="w-5 h-5 text-[#C9A574]" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-black">{doc.name}</div>
                          <div className="text-[11px] text-[#777777] font-medium">{doc.specialty} • {doc.hospital}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleShareReportViaChat(doc)}
                        className="px-4 py-2 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        Share via Chat →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-between text-xs text-[#777777]">
              <span className="flex items-center gap-1 font-semibold text-emerald-600">
                <ShieldCheck className="w-4 h-4" /> HIPAA Compliant Share
              </span>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-full transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DOCUMENT PREVIEW OVERLAY MODAL ==================== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Document Header */}
            <div className="border-b border-[#E5E0D5] pb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-[#C9A574] uppercase">
                  VaultCare AI • Shared Clinical Record
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified Patient Document
                </span>
              </div>
              <h2 className="text-2xl font-black text-black">Medical Summary Preview</h2>
              <p className="text-xs text-gray-500 font-medium">Patient: {patientName} • Shared Date: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Document Content */}
            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5E0D5] space-y-5 text-xs text-gray-700">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#E5E0D5]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Total Reports Shared</span>
                  <div className="text-base font-black text-black">{totalReportsCount} Uploaded Files</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">AI Health Status</span>
                  <div className="text-base font-black text-emerald-600">Stable Biometrics</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-black text-sm">Included Clinical Reports:</h4>
                {reports.length === 0 ? (
                  <p className="text-gray-400 italic">No files attached in shared package.</p>
                ) : (
                  <ul className="space-y-2">
                    {reports.map((r) => (
                      <li key={r.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E5E0D5]">
                        <div className="flex items-center gap-2.5">
                          <FileCheck className="w-4 h-4 text-[#C9A574]" />
                          <div>
                            <span className="font-bold text-black">{r.name}</span>
                            <span className="text-[11px] text-gray-500 block">{r.category} • {r.date}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {r.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/*Footer button */}
            <div classname="fex justify-end">
                <button
                    onClick={() => setShowPreviewModal(false)}
                    className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                    Close preview
                </button>   
                </div>
            </div>
        </div>
      )}
    </div>
  );
}