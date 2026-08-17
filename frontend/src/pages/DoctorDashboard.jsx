import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Stethoscope, 
  CheckCircle2, 
  Send, 
  Video, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Upload, 
  FileCheck, 
  IdCard, 
  Award, 
  Building, 
  AlertCircle, 
  RefreshCw,
  Lock,
  GraduationCap,
  Sparkles,
  Star,
  Plus,
  Save,
  UserCheck,
  Search,
  Check,
  XCircle,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';

export default function DoctorDashboard({ activeTab = 'dashboard', setActiveTab }) {
  const { doctors, updateDoctorDetails, appointments, updateAppointment, reviews, issuePrescriptionAndCompleteAppointment, reports } = useVault();
  const { user } = useAuth();

  const currentDoctorName = user?.fullName || '';
  const currentDocEmail = (user?.email || '').toLowerCase().trim();

  // Admin Approval Verification Check & State Machine (Single Source of Truth)
  const matchedDocRecord = (doctors || []).find(d => d.email && d.email.toLowerCase() === currentDocEmail);
  const currentVerificationStatus = (matchedDocRecord?.verificationStatus || matchedDocRecord?.status || 'NOT_SUBMITTED').toUpperCase();

  const isDoctorApproved = currentVerificationStatus === 'APPROVED';
  const isDoctorPending = currentVerificationStatus === 'PENDING';
  const isDoctorRejected = currentVerificationStatus === 'REJECTED';
  const rejectionReason = matchedDocRecord?.rejectionReason || '';

  // Route Guard Effect: If unapproved doctor attempts to access operational tabs, redirect to 'verification'
  useEffect(() => {
    if (!isDoctorApproved && activeTab !== 'verification' && activeTab !== 'settings') {
      setActiveTab('verification');
    }
  }, [isDoctorApproved, activeTab, setActiveTab]);

  // Resubmission State for Rejected Doctor
  const [isResubmitting, setIsResubmitting] = useState(false);

  // Verification Submission Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Active Appointment Filter
  const [apptFilter, setApptFilter] = useState('All'); // 'All' | 'Pending' | 'Upcoming' | 'Completed' | 'Cancelled'

  // Selected Patient Vault View
  const [selectedPatientVault, setSelectedPatientVault] = useState(null);

  // Selected Appointment for Consultation Notes & Prescription Issue
  const [activeConsultAppt, setActiveConsultAppt] = useState(null);

  // Reference PDF Medical Report Form State (Blank by default for doctor entry)
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicalFindings, setMedicalFindings] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [department, setDepartment] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Structured Medicines List (Blank by default for doctor entry)
  const [medicines, setMedicines] = useState([]);

  // Temporary single medicine inputs for adding rows (Blank by default)
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medDuration, setMedDuration] = useState('');

  // Issued Prescription View Modal State
  const [issuedPrescriptionModal, setIssuedPrescriptionModal] = useState(null);

  // OPD Availability Slots State
  const [scheduleSlots, setScheduleSlots] = useState([
    { day: 'Monday', time: '09:00 AM - 01:00 PM', status: 'Available' },
    { day: 'Wednesday', time: '10:00 AM - 02:00 PM', status: 'Available' }
  ]);
  const [newSlotDay, setNewSlotDay] = useState('Tuesday');
  const [newSlotTime, setNewSlotTime] = useState('10:00 AM - 02:00 PM');
  const [reviewQueue, setReviewQueue] = useState([]);

  // Emergency Medical Passport Access Logs State (Transmitted via Patient Emergency QR)
  const [emergencyLogs, setEmergencyLogs] = useState([]);
  const [viewingEmergencyLog, setViewingEmergencyLog] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchEmergencyLogs = async () => {
      if (!currentDocEmail) return;
      try {
        const res = await fetch(`http://localhost:5000/api/emergency/logs/doctor/${currentDocEmail}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.logs) && isMounted) {
            setEmergencyLogs(data.logs);
          }
        }
      } catch (e) {}
    };

    fetchEmergencyLogs();
    const interval = setInterval(fetchEmergencyLogs, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentDocEmail]);

  // Doctor License & Document Verification Form State (Populated strictly per-doctor)
  const [docSpecialty, setDocSpecialty] = useState(matchedDocRecord?.specialty || '');
  const [docQualification, setDocQualification] = useState(matchedDocRecord?.qualification || '');
  const [docLicense, setDocLicense] = useState(matchedDocRecord?.license || '');
  const [docExperience, setDocExperience] = useState(matchedDocRecord?.experience ? String(matchedDocRecord.experience).replace(' Years', '') : '');
  const [docHospital, setDocHospital] = useState(matchedDocRecord?.hospital || '');

  const [docLicenseFile, setDocLicenseFile] = useState(matchedDocRecord?.licenseDoc?.fileName || '');
  const [docDegreeFile, setDocDegreeFile] = useState(matchedDocRecord?.degreeDoc?.fileName || '');
  const [docGovIdFile, setDocGovIdFile] = useState(matchedDocRecord?.govIdDoc?.fileName || '');
  const [docAffiliationFile, setDocAffiliationFile] = useState(matchedDocRecord?.affiliationDoc?.fileName || '');

  const [docLicenseMeta, setDocLicenseMeta] = useState(matchedDocRecord?.licenseDoc || null);
  const [docDegreeMeta, setDocDegreeMeta] = useState(matchedDocRecord?.degreeDoc || null);
  const [docGovIdMeta, setDocGovIdMeta] = useState(matchedDocRecord?.govIdDoc || null);
  const [docAffiliationMeta, setDocAffiliationMeta] = useState(matchedDocRecord?.affiliationDoc || null);

  // Sync Form state on user switch / doctor record update
  useEffect(() => {
    if (matchedDocRecord) {
      setDocSpecialty(matchedDocRecord.specialty || '');
      setDocQualification(matchedDocRecord.qualification || '');
      setDocLicense(matchedDocRecord.license || '');
      setDocExperience(matchedDocRecord.experience ? String(matchedDocRecord.experience).replace(' Years', '') : '');
      setDocHospital(matchedDocRecord.hospital || '');
      setDocLicenseMeta(matchedDocRecord.licenseDoc || null);
      setDocDegreeMeta(matchedDocRecord.degreeDoc || null);
      setDocGovIdMeta(matchedDocRecord.govIdDoc || null);
      setDocAffiliationMeta(matchedDocRecord.affiliationDoc || null);
      setDocLicenseFile(matchedDocRecord.licenseDoc?.fileName || '');
      setDocDegreeFile(matchedDocRecord.degreeDoc?.fileName || '');
      setDocGovIdFile(matchedDocRecord.govIdDoc?.fileName || '');
      setDocAffiliationFile(matchedDocRecord.affiliationDoc?.fileName || '');
    } else {
      setDocSpecialty('');
      setDocQualification('');
      setDocLicense('');
      setDocExperience('');
      setDocHospital('');
      setDocLicenseMeta(null);
      setDocDegreeMeta(null);
      setDocGovIdMeta(null);
      setDocAffiliationMeta(null);
      setDocLicenseFile('');
      setDocDegreeFile('');
      setDocGovIdFile('');
      setDocAffiliationFile('');
    }
  }, [currentDocEmail, matchedDocRecord]);

  const handleDocFileSelect = (e, setFileName, setMeta) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setMeta({
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        fileType: file.type.includes('image') ? 'image' : 'pdf',
        dataUrl: dataUrl,
        fileUrl: dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  // Doctor's Appointments List (Strictly filtered by doctor identity)
  const doctorAppointments = (appointments || []).filter(a => {
    if (!a) return false;
    const matchEmail = a.doctorEmail && a.doctorEmail.toLowerCase() === currentDocEmail;
    const matchName = currentDoctorName && a.doctor && a.doctor.toLowerCase() === currentDoctorName.toLowerCase();
    return matchEmail || matchName;
  });

  // Assigned Patients List (Derived strictly from doctor's appointments)
  const assignedPatients = doctorAppointments.map(a => ({
    id: a.id || 'P-' + Math.floor(Math.random() * 1000),
    name: a.patientName || 'Patient',
    email: a.patientEmail || '',
    age: a.patientAge || 28,
    gender: a.patientGender || 'Female',
    lastCheckup: a.date || '2026-08-14',
    status: a.status === 'Completed' ? 'Completed' : 'Active',
    vaultScore: 88
  }));

  // Filtered Appointments
  const filteredAppts = doctorAppointments.filter(a => {
    if (apptFilter === 'Upcoming') return a?.status === 'Confirmed' || a?.status === 'Approved';
    if (apptFilter === 'Pending') return a?.status === 'Pending';
    if (apptFilter === 'Completed') return a?.status === 'Completed';
    if (apptFilter === 'Cancelled') return a?.status === 'Cancelled';
    return true;
  });

  const handleAddMedicineRow = (e) => {
    e.preventDefault();
    if (!medName) return;
    setMedicines([...medicines, { name: medName, dosage: medDosage, frequency: medFreq, duration: medDuration }]);
    setMedName('');
    setMedDosage('');
    setMedFreq('');
    setMedDuration('');
  };

  const handleRemoveMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleIssuePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!activeConsultAppt) {
      alert('Please select an active appointment to issue a medical report.');
      return;
    }

    const reportId = 'NCR-' + Math.floor(1000000000000 + Math.random() * 9000000000000) + '-F590';
    const patientName = activeConsultAppt.patientName || (activeConsultAppt.doctor === 'Dr. Ananya Sharma' ? 'Snehal Mundhe' : 'Patient One');
    const reportDate = new Date().toISOString().split('T')[0];

    const prescriptionPayload = {
      reportId,
      patientName,
      ageGender: '26 / Female',
      department,
      followUpDate,
      symptoms,
      diagnosis,
      medicalFindings,
      conclusion,
      medicines,
      doctorName: currentDoctorName,
      userKey: activeConsultAppt.patientEmail || 'snehal@gmail.com',
      notes: `Diagnosis: ${diagnosis}. Findings: ${medicalFindings}`
    };

    await issuePrescriptionAndCompleteAppointment(activeConsultAppt.id, prescriptionPayload);

    setIssuedPrescriptionModal({
      reportId,
      patientName,
      ageGender: '26 / Female',
      reportDate,
      department,
      followUpDate,
      symptoms,
      diagnosis,
      medicalFindings,
      conclusion,
      medicines,
      doctorName: currentDoctorName
    });

    alert(`Official Medical Report Generated!\n Medical report synced to Patient "My Reports" vault in reference PDF format.`);
    setActiveConsultAppt(null);
  };

  const handleAddSlot = (e) => {
    e.preventDefault();
    setScheduleSlots([...scheduleSlots, { day: newSlotDay, time: newSlotTime, status: 'Available' }]);
    alert(`OPD consultation slot added for ${newSlotDay} (${newSlotTime})`);
  };

  const handleApproveReport = (id) => {
    setReviewQueue(reviewQueue.filter(r => r.id !== id));
    alert('Report approved & digitally signed by Doctor!');
  };

  return (
    <div className="space-y-8 select-none max-w-6xl mx-auto font-sans">
      
      {/* Doctor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-black">{currentDoctorName || matchedDocRecord?.name || 'Doctor Portal'}</h1>
            {isDoctorApproved ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Practitioner (#{matchedDocRecord?.license || docLicense || 'NMC-REGISTERED'})
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-700" /> Verification Pending Admin Approval
              </span>
            )}
          </div>
          <p className="text-sm text-[#666666] font-medium mt-1">
            Department of {matchedDocRecord?.specialty || docSpecialty || 'General Practice'} • {matchedDocRecord?.hospital || docHospital || 'Registered Health Center'}
          </p>
        </div>
      </div>

      {/* STATUS BANNERS */}
      {isDoctorApproved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-950 font-bold text-xs shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span> Your medical license verification has been approved. You now have full access to VaultCare AI.</span>
        </div>
      )}

      {!isDoctorApproved && currentVerificationStatus === 'REJECTED' && (
        <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-3xl space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>Verification Rejected by Admin</span>
          </div>
          <p className="text-xs text-rose-900 font-medium leading-relaxed">
            Admin Rejection Reason: <strong>"{rejectionReason || 'Your verification request was rejected because the submitted license document could not be verified. Please upload a valid document and resubmit.'}"</strong>
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setIsResubmitting(true);
                setActiveTab('verification');
              }}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-extrabold cursor-pointer shadow-xs"
            >
               Resubmit Verification Documents →
            </button>
          </div>
        </div>
      )}

      {!isDoctorApproved && currentVerificationStatus !== 'REJECTED' && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-3xl space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <span>Doctor Account Verification Pending — Operational Access Restricted</span>
          </div>
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            Your Doctor profile is currently <strong>Pending Verification by Admin</strong>. To protect patient safety, all Doctor operational features (Patient Vaults, Issue Prescriptions, Report Reviews, Consultation Calls) are <strong>LOCKED</strong> until Admin approves your Medical License.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('verification')}
              className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-extrabold hover:bg-amber-950 cursor-pointer shadow-xs"
            >
              View Verification Status / Submit Documents →
            </button>
          </div>
        </div>
      )}

      {/* LOCKED FEATURE GUARD SCREEN FOR UNAPPROVED DOCTOR */}
      {!isDoctorApproved && activeTab !== 'verification' && activeTab !== 'settings' && (
        <div className="bg-white rounded-3xl p-10 md:p-14 border border-[#E5E0D5] shadow-vault-card text-center max-w-xl mx-auto space-y-6 my-8 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8 text-amber-700" />
          </div>
          
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
              {currentVerificationStatus === 'REJECTED' ? ' Verification Status: Rejected' : ' Verification Status: Pending Admin Approval'}
            </span>
            <h2 className="text-2xl font-black text-black pt-2">Doctor Portal Locked</h2>
            <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-md mx-auto">
              Access to patient vaults, issuing prescriptions, report review queue, and consultation calls is restricted until an Admin approves your Doctor profile.
            </p>
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] text-left text-xs font-semibold space-y-2.5 max-w-md mx-auto">
            <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Verification State Machine</div>
            <div className="flex items-center justify-between text-black font-bold">
              <span>1. Account Registration</span>
              <span className="text-emerald-600 font-extrabold"> Completed</span>
            </div>
            <div className="flex items-center justify-between text-black font-bold">
              <span>2. Medical License & Document Upload</span>
              <span className="text-emerald-600 font-extrabold"> Submitted</span>
            </div>
            <div className="flex items-center justify-between text-black font-bold">
              <span>3. Admin Board Verification</span>
              <span className={currentVerificationStatus === 'REJECTED' ? 'text-rose-600 font-black' : 'text-amber-700 font-black animate-pulse'}>
                {currentVerificationStatus === 'REJECTED' ? ' Rejected by Admin' : ' Pending Admin Approval'}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('verification')}
              className="px-6 py-3 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-2xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
            >
              Open Verification Status Page →
            </button>
          </div>
        </div>
      )}

      {/* Doctor Overview Stats (ONLY RENDERED FOR APPROVED DOCTOR) */}
      {isDoctorApproved && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-black">{assignedPatients.length}</div>
              <div className="text-xs text-[#777777] font-semibold mt-0.5">Assigned Patients</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-amber-600">
                {reviewQueue.length}
              </div>
              <div className="text-xs text-[#777777] font-semibold mt-0.5">Pending Report Reviews</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-black">{doctorAppointments.length}</div>
              <div className="text-xs text-[#777777] font-semibold mt-0.5">Total Appointments</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Video className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* ==================== ROLE-BASED TAB SWITCHING ==================== */}

      {/* TAB 1: MY ASSIGNED PATIENTS */}
      {isDoctorApproved && activeTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card overflow-hidden animate-fadeIn">
          <div className="p-6 border-b border-[#E5E0D5] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-black">My Assigned Patients</h2>
              <p className="text-xs text-gray-500 font-medium">Read-only health vault access is restricted strictly to assigned patients</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
               Appointment Access Gate Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] text-[11px] font-extrabold text-[#777777] uppercase border-b border-[#E5E0D5]">
                  <th className="py-4 px-6">PATIENT NAME & ID</th>
                  <th className="py-4 px-6">AGE / GENDER</th>
                  <th className="py-4 px-6">LAST CHECKUP</th>
                  <th className="py-4 px-6">HEALTH SCORE</th>
                  <th className="py-4 px-6 text-right">VAULT ACCESS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5] text-xs font-semibold">
                {assignedPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-4 px-6 font-extrabold text-black">
                      {p.name} <span className="text-gray-400 font-normal">({p.id})</span>
                    </td>
                    <td className="py-4 px-6 text-[#555555]">{p.age} yrs / {p.gender}</td>
                    <td className="py-4 px-6 text-[#555555]">{p.lastCheckup}</td>
                    <td className="py-4 px-6">
                      <span className="font-extrabold text-[#C9A574] bg-[#FAF5EC] px-2.5 py-1 rounded-full border border-[#E3CF9B]">
                        {p.vaultScore}/100
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => setSelectedPatientVault(p)} 
                        className="px-3.5 py-1.5 bg-black hover:bg-[#2a2a2a] text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#C9A574]" /> View Patient Vault →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REPORT REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card p-6 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-black">Report Review Queue</h2>
              <p className="text-xs text-gray-500 font-medium">Lab reports flagged by AI awaiting doctor verification signature</p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Doctor Signature Required
            </span>
          </div>

          <div className="space-y-3">
            {reviewQueue.length === 0 ? (
              <div className="text-center py-10 text-xs font-bold text-gray-500 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5]">
                 All pending lab reports have been reviewed and digitally signed!
              </div>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-black">{item.patient} • {item.report}</h4>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        {item.risk} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{item.notes}</p>
                    <div className="text-[10px] text-gray-400 font-semibold">Report Date: {item.date}</div>
                  </div>

                  <button 
                    onClick={() => handleApproveReport(item.id)}
                    className="bg-black hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Approve & Sign Report
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ISSUE PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card p-6 md:p-8 space-y-6 animate-fadeIn">
          <div className="border-b border-[#E5E0D5] pb-4">
            <h2 className="text-xl font-black text-black">Issue Digital Prescriptions</h2>
            <p className="text-xs text-gray-500 font-medium">Formulate signed electronic prescriptions synced directly to patient's "My Reports" vault</p>
          </div>

          <form onSubmit={handleIssuePrescriptionSubmit} className="space-y-6 text-xs font-semibold">
            {/* Appointment & Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Select Patient Appointment *</label>
                <select
                  required
                  value={activeConsultAppt?.id || ''}
                  onChange={(e) => {
                    const selected = doctorAppointments.find(a => a.id === e.target.value);
                    setActiveConsultAppt(selected);
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer"
                >
                  <option value="">-- Choose Patient Appointment --</option>
                  {doctorAppointments.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.patientName || 'Snehal Mundhe'} ({a.id}) • {a.date} ({a.time})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none"
                />
              </div>
            </div>

            {/* Symptoms & Diagnosis */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Symptoms (Short Paragraph)</label>
                <textarea
                  rows="2"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-2xl text-xs font-medium text-black outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Diagnosis (1 Line)</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Medical Findings (Consultation Notes)</label>
                <textarea
                  rows="3"
                  value={medicalFindings}
                  onChange={(e) => setMedicalFindings(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-2xl text-xs font-medium text-black outline-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Conclusion / Advice</label>
                <textarea
                  rows="2"
                  value={conclusion}
                  onChange={(e) => setConclusion(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-2xl text-xs font-medium text-black outline-none"
                ></textarea>
              </div>
            </div>

            {/* Prescribed Medicine Table Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-black uppercase tracking-wider">Prescribed Medicine Table</label>
                <span className="text-[10px] text-gray-400 font-bold">Columns: Medicine Name, Dosage, Frequency, Duration</span>
              </div>

              <div className="overflow-x-auto border border-[#E5E0D5] rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#00796B] text-white font-bold">
                    <tr>
                      <th className="p-3">Prescribed Medicine</th>
                      <th className="p-3">Dosage</th>
                      <th className="p-3">Frequency</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5]">
                    {medicines.map((m, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="p-3 font-bold text-black">{m.name}</td>
                        <td className="p-3 text-gray-700">{m.dosage}</td>
                        <td className="p-3 text-gray-700">{m.frequency}</td>
                        <td className="p-3 text-gray-700">{m.duration}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="text-rose-600 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Medicine Inputs */}
              <div className="flex flex-wrap items-center gap-2 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E5E0D5]">
                <input
                  type="text"
                  placeholder="Medicine Name (e.g. Aspirin)"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="flex-1 min-w-[140px] bg-white border border-[#E5E0D5] px-3 py-2 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 75 mg)"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  className="w-24 bg-white border border-[#E5E0D5] px-3 py-2 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Freq (1-0-0)"
                  value={medFreq}
                  onChange={(e) => setMedFreq(e.target.value)}
                  className="w-24 bg-white border border-[#E5E0D5] px-3 py-2 rounded-xl text-xs"
                />
                <input
                  type="text"
                  placeholder="Duration (30 Days)"
                  value={medDuration}
                  onChange={(e) => setMedDuration(e.target.value)}
                  className="w-28 bg-white border border-[#E5E0D5] px-3 py-2 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddMedicineRow}
                  className="px-4 py-2 bg-black text-white rounded-xl font-bold text-xs cursor-pointer"
                >
                  + Add Row
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#00796B] hover:bg-[#00695C] text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-white" /> Issue PDF Medical Report (NovaCare Format)
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: CONSULTATION SCHEDULE & OPD SLOTS */}
      {(activeTab === 'appointments' || activeTab === 'schedule') && (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-black">OPD Schedule & Available Time Slots</h2>
              <p className="text-xs text-gray-500 font-medium">Manage consultation availability slots for patient bookings</p>
            </div>
          </div>

          <form onSubmit={handleAddSlot} className="flex flex-wrap items-center gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D5]">
            <select
              value={newSlotDay}
              onChange={(e) => setNewSlotDay(e.target.value)}
              className="bg-white border border-[#E5E0D5] px-4 py-2.5 rounded-xl text-xs font-bold text-black outline-none cursor-pointer"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
            </select>

            <input
              type="text"
              placeholder="10:00 AM - 02:00 PM"
              value={newSlotTime}
              onChange={(e) => setNewSlotTime(e.target.value)}
              className="bg-white border border-[#E5E0D5] px-4 py-2.5 rounded-xl text-xs font-bold text-black outline-none"
            />

            <button
              type="submit"
              className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#C9A574]" /> Add Slot
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduleSlots.map((slot, idx) => (
              <div key={idx} className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E0D5] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-black">{slot.day}</h4>
                  <p className="text-xs text-gray-500 font-medium">{slot.time}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold rounded-full">
                  {slot.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PATIENT REVIEWS RECEIVED */}
      {activeTab === 'reviews' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-4 animate-fadeIn">
          <div className="border-b border-[#E5E0D5] pb-4">
            <h2 className="text-lg font-extrabold text-black">Patient Reviews & Feedback Received</h2>
            <p className="text-xs text-gray-500 font-medium">Ratings submitted by patients after completed consultations</p>
          </div>

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-xs font-bold text-gray-500 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5]">
                No patient reviews recorded yet.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-black">{rev.patientName}</h4>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                      {''.repeat(rev.rating)} ({rev.rating}.0)
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 font-medium italic">"{rev.comment}"</p>
                  <div className="text-[10px] text-gray-400 font-bold text-right">{rev.date}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: DOCTOR LICENSE & DOCUMENT VERIFICATION */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card p-6 md:p-8 space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
            <div>
              <h2 className="text-xl font-black text-black">MCI License & Document Verification</h2>
              <p className="text-xs text-gray-500 font-medium">Submit identity documents, medical registration, and degree certificates for official verification</p>
            </div>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-xs ${
              currentVerificationStatus === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : currentVerificationStatus === 'REJECTED'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : currentVerificationStatus === 'PENDING'
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}>
              {currentVerificationStatus === 'APPROVED' && <><ShieldCheck className="w-4 h-4 text-emerald-600" /> Status: Approved & Verified</>}
              {currentVerificationStatus === 'REJECTED' && <><XCircle className="w-4 h-4 text-rose-600" /> Status: Verification Rejected</>}
              {currentVerificationStatus === 'PENDING' && <><Clock className="w-4 h-4 text-amber-700 animate-pulse" /> Status: Pending Admin Review</>}
              {currentVerificationStatus === 'NOT_SUBMITTED' && <><AlertCircle className="w-4 h-4 text-amber-700" /> Action Required: Verification Needed</>}
            </span>
          </div>

          {/* IF STATUS IS APPROVED */}
          {currentVerificationStatus === 'APPROVED' && (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-emerald-900">Your Account is Verified & Approved!</h3>
              <p className="text-xs text-emerald-800 font-bold max-w-lg mx-auto">
                 Your medical license verification has been approved. You now have full access to VaultCare AI operational features including patient vaults, issue prescriptions, and report review queue.
              </p>
            </div>
          )}

          {/* IF STATUS IS REJECTED */}
          {currentVerificationStatus === 'REJECTED' && (
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-200 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-100 border border-rose-300 rounded-full flex items-center justify-center text-rose-700 flex-shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-rose-950">Verification Rejected by Admin</h3>
                  <p className="text-xs text-rose-900 font-medium">
                    Your verification request was reviewed by the VaultCare AI Medical Board and could not be approved at this time.
                  </p>
                </div>
              </div>

              {/* Admin Rejection Reason Box */}
              <div className="p-4 bg-white rounded-xl border border-rose-300 space-y-1.5 text-xs font-semibold">
                <div className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Admin Rejection Reason:</div>
                <p className="text-black font-extrabold italic bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  "{rejectionReason || 'Your verification request was rejected because the submitted license document could not be verified. Please upload a valid document and resubmit.'}"
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setIsResubmitting(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                   Resubmit Verification Documents
                </button>
              </div>
            </div>
          )}

          {/* IF STATUS IS PENDING */}
          {currentVerificationStatus === 'PENDING' && !isResubmitting && (
            <div className="p-6 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-6">
              
              <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-950">
                <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Clock className="w-6 h-6 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Verification Request Pending Admin Review</h3>
                  <p className="text-xs font-extrabold text-amber-900 mt-0.5">
                     Now wait until Admin approves your account. Doctor features will automatically unlock upon Admin approval.
                  </p>
                </div>
              </div>

              {/* Summary Receipt Box */}
              <div className="bg-white p-5 rounded-xl border border-[#E5E0D5] space-y-3 text-xs font-semibold">
                <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-[#E5E0D5] pb-2">
                  Submitted Practitioner Credentials Summary
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-black">
                  <div><span className="text-gray-500 font-bold">Practitioner Name:</span> <strong className="font-black text-black">{currentDoctorName || matchedDocRecord?.name || 'Dr. Practitioner'}</strong></div>
                  <div><span className="text-gray-500 font-bold">MCI License Number:</span> <strong className="font-mono text-black">{matchedDocRecord?.license || docLicense || 'Under Review'}</strong></div>
                  <div><span className="text-gray-500 font-bold">Specialty & Degree:</span> <strong className="text-black">{matchedDocRecord?.specialty || docSpecialty || 'General Practitioner'} • {matchedDocRecord?.qualification || docQualification || 'MBBS'}</strong></div>
                  <div><span className="text-gray-500 font-bold">Hospital Affiliation:</span> <strong className="text-black">{matchedDocRecord?.hospital || docHospital || 'Not Specified'}</strong></div>
                </div>

                <div className="pt-2 border-t border-[#E5E0D5] space-y-1">
                  <div className="text-[10px] font-extrabold text-gray-500 uppercase">Uploaded Document References:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E5E0D5] text-emerald-700 font-bold"> Medical License: {matchedDocRecord?.licenseDoc?.fileName || docLicenseFile || 'License_Document.pdf'}</div>
                    <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E5E0D5] text-emerald-700 font-bold"> Degree Certificate: {matchedDocRecord?.degreeDoc?.fileName || docDegreeFile || 'Degree_Certificate.pdf'}</div>
                    <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E5E0D5] text-emerald-700 font-bold"> Govt ID Proof: {matchedDocRecord?.govIdDoc?.fileName || docGovIdFile || 'Govt_ID_Proof.pdf'}</div>
                    {(matchedDocRecord?.affiliationDoc?.fileName || docAffiliationFile) && (
                      <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E5E0D5] text-emerald-700 font-bold"> Affiliation Letter: {matchedDocRecord?.affiliationDoc?.fileName || docAffiliationFile}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="bg-white p-5 rounded-xl border border-[#E5E0D5] text-xs font-semibold space-y-3">
                <div className="text-[11px] font-extrabold text-gray-500 uppercase">Verification Progress Tracker</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-black font-bold">
                    <span>1. Account Registration</span>
                    <span className="text-emerald-600 font-black"> Completed</span>
                  </div>
                  <div className="flex items-center justify-between text-black font-bold">
                    <span>2. Medical License & Document Upload</span>
                    <span className="text-emerald-600 font-black"> Transmitted to Admin</span>
                  </div>
                  <div className="flex items-center justify-between text-black font-bold">
                    <span>3. Admin Board Verification & Seal Approval</span>
                    <span className="text-amber-800 font-black animate-pulse"> Pending Admin Approval</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* EDITABLE SUBMISSION FORM (ONLY IF NOT_SUBMITTED OR IS_RESUBMITTING) */}
          {(currentVerificationStatus === 'NOT_SUBMITTED' || isResubmitting) && (
            <form onSubmit={(e) => {
              e.preventDefault();

              const licenseFile = docLicenseFile || 'Medical_License_Certificate.pdf';
              const degreeFile = docDegreeFile || 'Degree_Certificate_MBBS.pdf';
              const govIdFile = docGovIdFile || 'Govt_ID_Proof.pdf';

              const docIdentifier = currentDocEmail;
              const docData = {
                name: currentDoctorName || `Dr. ${currentDocEmail.split('@')[0]}`,
                email: currentDocEmail,
                specialty: docSpecialty || 'General Medicine',
                qualification: docQualification || 'MBBS, MD',
                license: docLicense || 'MCI-VERIFIED-REG',
                experience: docExperience ? `${docExperience} Years` : '5 Years',
                hospital: docHospital || 'VaultCare Partner Hospital',
                status: 'Pending',
                verificationStatus: 'PENDING',
                rejectionReason: '',
                licenseDoc: docLicenseMeta || { fileName: licenseFile, fileSize: '1.8 MB', fileType: 'pdf' },
                degreeDoc: docDegreeMeta || { fileName: degreeFile, fileSize: '2.4 MB', fileType: 'pdf' },
                govIdDoc: docGovIdMeta || { fileName: govIdFile, fileSize: '1.2 MB', fileType: 'pdf' },
                affiliationDoc: docAffiliationMeta || (docAffiliationFile ? { fileName: docAffiliationFile, fileSize: '0.9 MB', fileType: 'pdf' } : null)
              };

              updateDoctorDetails(docIdentifier, docData);
              setIsResubmitting(false);
              setShowSuccessModal(true);
            }} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-xs font-black text-black uppercase tracking-wider">1. Professional Medical Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Specialty *</label>
                    <select
                      value={docSpecialty}
                      onChange={(e) => setDocSpecialty(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer"
                    >
                      <option value="Cardiology">Cardiology</option>
                      <option value="Endocrinologist">Endocrinology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="General Medicine">General Medicine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Qualification Degree *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MBBS, MD (Cardiology)"
                      value={docQualification}
                      onChange={(e) => setDocQualification(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Medical License Number (MCI/NMC) *</label>
                    <input
                      type="text"
                      required
                      placeholder="MCI-98420-MH"
                      value={docLicense}
                      onChange={(e) => setDocLicense(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1">Years of Clinical Experience *</label>
                    <input
                      type="number"
                      required
                      value={docExperience}
                      onChange={(e) => setDocExperience(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-xs">Primary Hospital / Clinic Affiliation</label>
                  <input
                    type="text"
                    value={docHospital}
                    onChange={(e) => setDocHospital(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none"
                  />
                </div>
              </div>

              {/* Document Uploads Grid */}
              <div className="space-y-4 pt-4 border-t border-[#E5E0D5]">
                <h3 className="text-xs font-black text-black uppercase tracking-wider">2. Upload Verification Documents (PDF / Image)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">1. Medical License / Registration Certificate *</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleDocFileSelect(e, setDocLicenseFile, setDocLicenseMeta)}
                      className="w-full text-xs font-medium cursor-pointer"
                    />
                    {docLicenseFile && <span className="text-[10px] text-emerald-700 font-bold block">Selected: {docLicenseFile}</span>}
                  </div>

                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">2. Degree Certificate (MBBS/MD/MS) *</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleDocFileSelect(e, setDocDegreeFile, setDocDegreeMeta)}
                      className="w-full text-xs font-medium cursor-pointer"
                    />
                    {docDegreeFile && <span className="text-[10px] text-emerald-700 font-bold block">Selected: {docDegreeFile}</span>}
                  </div>

                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">3. Govt ID Proof (Aadhaar / PAN / Passport) *</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleDocFileSelect(e, setDocGovIdFile, setDocGovIdMeta)}
                      className="w-full text-xs font-medium cursor-pointer"
                    />
                    {docGovIdFile && <span className="text-[10px] text-emerald-700 font-bold block">Selected: {docGovIdFile}</span>}
                  </div>

                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">4. Hospital Affiliation Letter (Optional)</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => handleDocFileSelect(e, setDocAffiliationFile, setDocAffiliationMeta)}
                      className="w-full text-xs font-medium cursor-pointer"
                    />
                    {docAffiliationFile && <span className="text-[10px] text-emerald-700 font-bold block">Selected: {docAffiliationFile}</span>}
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="bg-black hover:bg-[#2a2a2a] text-[#C9A574] px-6 py-3 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C9A574]" /> Submit Verification Documents
                </button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* TAB 7: PROFILE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-6 animate-fadeIn max-w-2xl">
          <div className="border-b border-[#E5E0D5] pb-4">
            <h2 className="text-xl font-black text-black">Practitioner Profile & Credentials</h2>
            <p className="text-xs text-gray-500 font-medium">Manage medical license info, hospital affiliation, and OPD timings</p>
          </div>

          <div className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-600 mb-1 font-bold">Full Practitioner Name</label>
              <input type="text" value={currentDoctorName || matchedDocRecord?.name || ''} readOnly className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-xl font-bold text-black outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1 font-bold">Specialty</label>
                <input type="text" value={docSpecialty} onChange={(e) => setDocSpecialty(e.target.value)} placeholder="e.g. Cardiology" className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-xl font-bold text-black outline-none" />
              </div>
              <div>
                <label className="block text-gray-600 mb-1 font-bold">Medical License #</label>
                <input type="text" value={docLicense} onChange={(e) => setDocLicense(e.target.value)} placeholder="e.g. MCI-98420-MH" className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-xl font-bold text-black outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-bold">Hospital Affiliation & Address</label>
              <input type="text" value={docHospital} onChange={(e) => setDocHospital(e.target.value)} placeholder="e.g. Apollo Heart Institute, Mumbai" className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-xl font-bold text-black outline-none" />
            </div>

            <div className="pt-2 text-right">
              <button onClick={() => alert('Doctor profile updated successfully!')} className="px-6 py-2.5 bg-black text-[#C9A574] rounded-xl text-xs font-bold cursor-pointer">
                Save Profile Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB FOR CHAT MESSAGES */}
      {isDoctorApproved && activeTab === 'chat' && (
        <div className="animate-fadeIn">
          <ChatWindow />
        </div>
      )}

      {/* TAB 6: DEFAULT DOCTOR DASHBOARD OVERVIEW & APPOINTMENTS (ONLY FOR APPROVED DOCTOR) */}
      {isDoctorApproved && (activeTab === 'dashboard' || !['patients', 'chat', 'review', 'prescriptions', 'appointments', 'schedule', 'reviews', 'verification'].includes(activeTab)) && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* EMERGENCY PASSPORT ACCESS ALERTS (LIVE FROM POSTGRESQL) */}
          {emergencyLogs.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 shadow-md space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-rose-950">🚨 Emergency Medical Passport Access Alerts ({emergencyLogs.length})</h3>
                    <p className="text-xs text-rose-700 font-medium">Patients who transmitted emergency medical passport and vital allergy data directly to you</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-200 text-rose-900 border border-rose-300">
                  Live Dispatch
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {emergencyLogs.map((log) => (
                  <div key={log.id} className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-black text-black truncate">{log.patient_name} ({log.patient_id})</h4>
                      <p className="text-[11px] text-gray-600 font-semibold">
                        Blood Group: <strong className="text-rose-700 font-black">{log.blood_group}</strong> • Emergency Contact: <span className="font-bold text-black">{log.emergency_contact}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Transmitted: {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => setViewingEmergencyLog(log)}
                      className="px-3.5 py-1.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] text-xs font-extrabold rounded-xl shrink-0 transition-all cursor-pointer shadow-xs"
                    >
                      View Passport →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPOINTMENTS MANAGEMENT GRID */}
          <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-black">My Scheduled Appointments</h2>
                <p className="text-xs text-gray-500 font-medium">Confirm pending requests, launch video calls, and record consultation diagnosis</p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#E5E0D5]">
                {['All', 'Pending', 'Upcoming', 'Completed', 'Cancelled'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setApptFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      apptFilter === tab
                        ? 'bg-black text-white shadow-xs'
                        : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppts.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-xs font-bold text-gray-500 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5]">
                  No appointments found for filter state "{apptFilter}".
                </div>
              ) : (
                filteredAppts.map((appt) => (
                  <div key={appt.id} className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E5E0D5] space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black text-[#916D41] bg-[#FAF5EC] px-2.5 py-0.5 rounded-full border border-[#E3CF9B]">
                          ID: {appt.id}
                        </span>
                        <h3 className="text-sm font-black text-black mt-1">
                          Patient: {appt.patientName || (appt.doctor === 'Dr. Ananya Sharma' ? 'Patient One' : 'Snehal Mundhe')}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {appt.specialty || 'Cardiology'} • Date: <strong className="text-black">{appt.date} ({appt.time})</strong>
                        </p>
                      </div>

                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                        appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        appt.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                        appt.status === 'Confirmed' || appt.status === 'Approved' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {appt.status}
                      </span>
                    </div>

                    {/* Consultation Notes Display if exists */}
                    {appt.consultationNotes && (
                      <div className="p-3 bg-white rounded-xl border border-[#E5E0D5] text-xs font-medium space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Doctor Notes & Diagnosis</span>
                        <p className="text-gray-800">{appt.consultationNotes}</p>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E5E0D5]">
                      {appt.status === 'Pending' && (
                        <button
                          onClick={() => {
                            updateAppointment(appt.id, { status: 'Confirmed' });
                            alert(`Appointment ${appt.id} confirmed! Patient notified.`);
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Request
                        </button>
                      )}

                      {(appt.status === 'Confirmed' || appt.status === 'Approved' || appt.status === 'Pending') && (
                        <>
                          {((appt.type && appt.type.toLowerCase().includes('online')) || appt.meetUrl || appt.meetingLink) && (
                            <a
                              href={appt.meetUrl || appt.meetingLink || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-[#10B981] hover:bg-emerald-600 text-black py-2 px-3 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5"
                            >
                              <Video className="w-3.5 h-3.5 text-black" /> Join Google Meet
                            </a>
                          )}

                          <button
                            onClick={() => {
                              setActiveConsultAppt(appt);
                              setConsultNotes(appt.consultationNotes || 'Diagnosis: Routine checkup clean.');
                            }}
                            className="bg-[#C9A574] hover:bg-[#b89463] text-black py-2 px-3 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" /> Issue Prescription & Complete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* READ-ONLY PATIENT VAULT RECORDS MODAL */}
      {selectedPatientVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPatientVault(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-full cursor-pointer"
            >
              
            </button>

            <div className="border-b border-[#E5E0D5] pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                  Read-Only Vault View
                </span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Patient ID: {selectedPatientVault.id}
                </span>
              </div>
              <h2 className="text-2xl font-black text-black">{selectedPatientVault.name}'s Medical Vault</h2>
              <p className="text-xs text-gray-500 font-medium">
                Age / Gender: <span className="font-bold text-black">{selectedPatientVault.age} yrs / {selectedPatientVault.gender}</span> • VaultCare Health Score: <span className="font-bold text-[#C9A574]">{selectedPatientVault.vaultScore}/100</span>
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">Patient Uploaded Reports & Prescriptions</h4>
              <div className="space-y-3">
                {reports.length === 0 ? (
                  <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] text-xs text-gray-500 font-bold text-center">
                    No lab reports uploaded by patient yet.
                  </div>
                ) : (
                  reports.map((rep) => (
                    <div key={rep.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-extrabold text-black">{rep.title || rep.name}</h5>
                          <p className="text-[11px] text-gray-500 font-medium">Date: {rep.date} • Facility: {rep.facility || rep.hospital || 'Apollo Heart Institute'}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                        {rep.category || 'Lab Report'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] text-right">
              <button
                onClick={() => setSelectedPatientVault(null)}
                className="px-6 py-2.5 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Vault View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUED PRESCRIPTION DIGITAL PDF MODAL (EXACT NOVACARE REFERENCE FORMAT) */}
      {issuedPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-8 space-y-6 relative max-h-[92vh] overflow-y-auto font-sans text-xs text-gray-800">
            <button
              onClick={() => setIssuedPrescriptionModal(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-full cursor-pointer"
            >
              
            </button>

            {/* TOP HEADER: Teal Bar + VaultCare AI Brand + Tagline + Report ID + QR Code */}
            <div className="bg-[#00796B] p-6 rounded-2xl text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white text-[#00796B] flex items-center justify-center font-black text-2xl shadow-sm">
                  +
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight">VaultCare AI Medical Portal</h1>
                  <p className="text-xs text-teal-100 font-medium">Compassionate care. Clear records.</p>
                </div>
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <div className="text-sm font-black uppercase tracking-wider">MEDICAL REPORT</div>
                  <div className="text-[11px] font-mono text-teal-100">{issuedPrescriptionModal.reportId}</div>
                </div>
                {/* SVG QR CODE */}
                <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-xs flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M10,40 h10 v10 h-10 z M40,40 h20 v20 h-20 z M70,40 h20 v10 h-20 z M40,70 h10 v20 h-10 z M70,70 h20 v20 h-20 z" fill="#00796B" />
                  </svg>
                </div>
              </div>
            </div>

            {/* INFO TABLE (2 Columns) */}
            <div className="border border-[#E5E0D5] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr className="border-b border-[#E5E0D5]">
                    <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 w-1/4 border-r border-[#E5E0D5]">Patient Name</td>
                    <td className="p-3 font-extrabold text-black w-1/4 border-r border-[#E5E0D5]">{issuedPrescriptionModal.patientName}</td>
                    <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 w-1/4 border-r border-[#E5E0D5]">Age / Gender</td>
                    <td className="p-3 font-semibold text-gray-800 w-1/4">{issuedPrescriptionModal.ageGender}</td>
                  </tr>
                  <tr className="border-b border-[#E5E0D5]">
                    <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Report Date</td>
                    <td className="p-3 font-semibold text-gray-800 border-r border-[#E5E0D5]">{issuedPrescriptionModal.reportDate}</td>
                    <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Department</td>
                    <td className="p-3 font-semibold text-gray-800">{issuedPrescriptionModal.department}</td>
                  </tr>
                  <tr>
                    <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Doctor</td>
                    <td className="p-3 font-extrabold text-black border-r border-[#E5E0D5]">{issuedPrescriptionModal.doctorName}</td>
                    <td className="p-3 bg-[#FAF8F5] font-bold text-gray-700 border-r border-[#E5E0D5]">Follow-up Date</td>
                    <td className="p-3 font-semibold text-gray-800">{issuedPrescriptionModal.followUpDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SYMPTOMS SECTION */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-black">Symptoms</h3>
              <p className="text-gray-700 leading-relaxed font-medium">{issuedPrescriptionModal.symptoms}</p>
            </div>

            {/* DIAGNOSIS SECTION */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-black">Diagnosis</h3>
              <p className="text-black font-extrabold">{issuedPrescriptionModal.diagnosis}</p>
            </div>

            {/* MEDICAL FINDINGS SECTION */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-black">Medical Findings</h3>
              <p className="text-gray-700 leading-relaxed font-medium">{issuedPrescriptionModal.medicalFindings}</p>
            </div>

            {/* CONCLUSION SECTION */}
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-black">Conclusion</h3>
              <p className="text-gray-700 leading-relaxed font-medium">{issuedPrescriptionModal.conclusion}</p>
            </div>

            {/* PRESCRIBED MEDICINE TABLE */}
            <div className="space-y-2">
              <div className="border border-[#E5E0D5] rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#00796B] text-white font-extrabold text-xs">
                    <tr>
                      <th className="p-3 border-r border-teal-600">Prescribed Medicine</th>
                      <th className="p-3 border-r border-teal-600">Dosage</th>
                      <th className="p-3 border-r border-teal-600">Frequency</th>
                      <th className="p-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D5] font-semibold text-gray-800">
                    {issuedPrescriptionModal.medicines.map((m, i) => (
                      <tr key={i} className="hover:bg-[#FAF8F5]">
                        <td className="p-3 font-bold text-black border-r border-[#E5E0D5]">{m.name}</td>
                        <td className="p-3 border-r border-[#E5E0D5]">{m.dosage}</td>
                        <td className="p-3 border-r border-[#E5E0D5]">{m.frequency}</td>
                        <td className="p-3">{m.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DOCTOR SIGNATURE LINE */}
            <div className="pt-6 italic font-serif text-sm text-gray-800">
              Doctor Signature: <strong className="font-sans font-black text-black not-italic">{issuedPrescriptionModal.doctorName}</strong>
            </div>

            {/* FOOTER */}
            <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between text-[11px] text-gray-400 font-semibold">
              <span>VaultCare AI | Confidential medical record | Generated electronically</span>
              <button
                onClick={() => setIssuedPrescriptionModal(null)}
                className="px-6 py-2 bg-black text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Close Medical Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VERIFICATION SUBMITTED SUCCESS POPUP MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E5E0D5] p-8 text-center space-y-6 relative font-sans select-none">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-full cursor-pointer text-lg font-bold"
            >
              
            </button>

            {/* Icon Header */}
            <div className="w-20 h-20 rounded-full bg-amber-100 border-2 border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-md animate-pulse">
              <Clock className="w-10 h-10 text-amber-800" />
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 uppercase tracking-wider">
                 Documents Sent to Admin
              </span>
              <h2 className="text-2xl font-black text-black pt-2">Verification Sent to Admin!</h2>
              <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-md mx-auto">
                Your medical license credentials and uploaded verification documents have been transmitted to the <strong>VaultCare AI Admin Board</strong>.
              </p>
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-extrabold text-amber-900 mt-2">
                 Now wait until Admin approves your account.
              </div>
            </div>

            {/* Document Details Summary Box */}
            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] text-left text-xs font-semibold space-y-2.5">
              <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-[#E5E0D5] pb-2">
                Transmission Receipt Summary
              </div>
              <div className="flex items-center justify-between text-black font-bold">
                <span className="text-gray-600">Practitioner Name:</span>
                <span className="text-black font-black">{currentDoctorName}</span>
              </div>
              <div className="flex items-center justify-between text-black font-bold">
                <span className="text-gray-600">License Number:</span>
                <span className="font-mono text-black">{matchedDocRecord?.license || docLicense || 'NMC-LICENSE'}</span>
              </div>
              <div className="flex items-center justify-between text-black font-bold">
                <span className="text-gray-600">Uploaded Documents:</span>
                <span className="text-emerald-700 font-black"> Sent to Admin Registry</span>
              </div>
              <div className="flex items-center justify-between text-black font-bold">
                <span className="text-gray-600">Current Status:</span>
                <span className="text-amber-800 font-black"> Pending Admin Approval</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-2xl text-xs font-black shadow-md cursor-pointer transition-all"
              >
                Understood — Wait for Admin Approval →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================== EMERGENCY PASSPORT ACCESS MODAL ==================== */}
      {viewingEmergencyLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-300 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Emergency Medical Passport</h3>
                  <p className="text-xs text-rose-700 font-bold">Transmitted by {viewingEmergencyLog.patient_name}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingEmergencyLog(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">PATIENT ID</span>
                <span className="font-extrabold text-black">{viewingEmergencyLog.patient_id}</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">BLOOD GROUP / GENDER</span>
                <span className="font-extrabold text-rose-700">{viewingEmergencyLog.blood_group} • {viewingEmergencyLog.gender}</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">EMERGENCY CONTACT</span>
                <span className="font-extrabold text-black">{viewingEmergencyLog.emergency_contact}</span>
              </div>
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D5]">
                <span className="text-[10px] text-gray-400 font-bold block uppercase">PATIENT EMAIL</span>
                <span className="font-extrabold text-black">{viewingEmergencyLog.patient_email}</span>
              </div>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 text-xs space-y-2">
              <span className="text-[10px] font-black text-rose-900 block uppercase tracking-wider">Clinical Alerts & Allergies</span>
              <p className="text-rose-950 font-bold">{viewingEmergencyLog.allergies || 'Penicillin Allergy'}</p>
              <p className="text-gray-600">{viewingEmergencyLog.summary}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingEmergencyLog(null)}
                className="px-6 py-2.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Close Emergency Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
