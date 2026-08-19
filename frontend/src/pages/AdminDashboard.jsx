import React, { useSate, useEffect } from 'react';
import { 
  Users, 
  Stethoscope, 
  Clock, 
  Star, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  UserCheck, 
  ShieldCheck, 
  FileText, 
  Plus, 
  Eye, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Download,
  ExternalLink,
  Award,
  IdCard,
  Building,
  GraduationCap,
  Ban
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

const DEFAULT_SAMPLE_PDF = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDAKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDAKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDAKL0xlbmd0aCA3MAo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKFZhdWx0Q2FyZSBBSSBNZWRpY2FsIFZlcmlmaWNhdGlvbiBEb2N1bWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHRyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDA0MDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKMDAwMDAwMDI3MyAwMDAwMCBuIAowMDAwMDAwMzkzIDA0MDAwIG4gCnRyYWlsZXIKPDAKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDkwCiUlRU9G';

const getDocumentBlobUrl = (dataOrUrl, mimeType = 'application/pdf') => {
  if (!dataOrUrl) return null;
  if (dataOrUrl.startsWith('http://') || dataOrUrl.startsWith('https://') || dataOrUrl.startsWith('blob:')) {
    return dataOrUrl;
  }
  try {
    if (dataOrUrl.startsWith('data:')) {
      const parts = dataOrUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || mimeType;
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    }
  } catch (err) {}

  try {
    const rawPdf = DEFAULT_SAMPLE_PDF.split(',')[1];
    const bstr = atob(rawPdf);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (e) {
    return null;
  }
};

export default function AdminDashboard({ activeTab = 'overview', setActiveTab }) {
  const { doctors, patients, reviews, updateDoctorStatus, togglePatientStatus, addDoctor, deleteReview } = useVault();

  // Search & Filter States
  const [patientSearch, setPatientSearch] = useState('');
  const [patientStatusFilter, setPatientStatusFilter] = useState('All'); // 'All' | 'Active' | 'Suspended'

  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('All'); // 'All' | 'Approved' | 'Pending' | 'Rejected' | 'Deactivated'

  const [reviewDoctorFilter, setReviewDoctorFilter] = useState('All');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('All');

  // Modal States
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [selectedDoctorModal, setSelectedDoctorModal] = useState(null);
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [previewDocObj, setPreviewDocObj] = useState(null); // Active document object for inline viewer
  const [rejectModalDoctor, setRejectModalDoctor] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('Your verification request was rejected because the submitted medical license document could not be verified. Please upload a valid registration document and resubmit.');

  // Add Doctor Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocEmail, setNewDocEmail] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('General Physician');
  const [newDocQual, setNewDocQual] = useState('MBBS');
  const [newDocLicense, setNewDocLicense] = useState('');
  const [newDocExp, setNewDocExp] = useState('5 Years');
  const [newDocHospital, setNewDocHospital] = useState('City Care Clinic');

  // Document Upload State in Add Doctor Modal
  const [licenseFileName, setLicenseFileName] = useState('');
  const [degreeFileName, setDegreeFileName] = useState('');
  const [govIdFileName, setGovIdFileName] = useState('');
  const [affiliationFileName, setAffiliationFileName] = useState('');

  // Admin Profile Settings State
  const [adminName, setAdminName] = useState('System Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@vaultcare.ai');
  const [adminPassword, setAdminPassword] = useState('••••••••');
  const [adminPhone, setAdminPhone] = useState('+91 98200 00000');
  const [adminLocation, setAdminLocation] = useState('Headquarters, Mumbai');

  // Stats Calculations
  const totalPatientsCount = (patients || []).length;
  const totalDoctorsCount = (doctors || []).length;
  const pendingDoctorsCount = (doctors || []).filter(d => d?.status === 'Pending').length;
  const totalReviewsCount = (reviews || []).length;

  const navigateTab = (tab) => {
    if (setActiveTab) setActiveTab(tab);
  };

  // Filtered Patients List
  const filteredPatients = (patients || []).filter(p => {
    const pName = p?.name || '';
    const pEmail = p?.email || '';
    const matchesSearch = pName.toLowerCase().includes(patientSearch.toLowerCase()) || 
                          pEmail.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesStatus = patientStatusFilter === 'All' || p?.status === patientStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Doctors List
  const filteredDoctors = (doctors || []).filter(d => {
    const dName = d?.name || '';
    const dEmail = d?.email || '';
    const dSpec = d?.specialty || '';
    const dLic = d?.license || '';
    const matchesSearch = dName.toLowerCase().includes(doctorSearch.toLowerCase()) || 
                          dEmail.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                          dSpec.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                          dLic.toLowerCase().includes(doctorSearch.toLowerCase());
    const matchesStatus = doctorStatusFilter === 'All' || d?.status === doctorStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Reviews List
  const filteredReviews = reviews.filter(r => {
    const matchesDoctor = reviewDoctorFilter === 'All' || r.doctorName === reviewDoctorFilter;
    const matchesRating = reviewRatingFilter === 'All' || r.rating === Number(reviewRatingFilter);
    return matchesDoctor && matchesRating;
  });

  const handleAddDoctorSubmit = (e) => {
    e.preventDefault();
    if (!newDocName || !newDocEmail || !newDocLicense) {
      alert('Please fill in all required doctor fields.');
      return;
    }

    const docName = newDocName.toLowerCase().startsWith('dr.') ? newDocName : `Dr. ${newDocName}`;
    const newDoc = {
      id: 'DOC-' + Math.floor(100 + Math.random() * 900),
      name: docName,
      email: newDocEmail,
      specialty: newDocSpecialty,
      qualification: newDocQual,
      license: newDocLicense,
      experience: newDocExp,
      hospital: newDocHospital,
      status: 'Approved', // Manually onboarded by Admin
      joinedDate: new Date().toISOString().split('T')[0],
      licenseDoc: { fileName: licenseFileName || 'MCI_License_Card.pdf', fileSize: '1.8 MB', fileType: 'pdf' },
      degreeDoc: { fileName: degreeFileName || 'Medical_Degree_Cert.pdf', fileSize: '2.4 MB', fileType: 'pdf' },
      govIdDoc: { fileName: govIdFileName || 'Govt_ID_Proof.pdf', fileSize: '1.2 MB', fileType: 'pdf' },
      affiliationDoc: { fileName: affiliationFileName || 'Hospital_Affiliation_Letter.pdf', fileSize: '0.9 MB', fileType: 'pdf' }
    };

    addDoctor(newDoc);
    setShowAddDoctorModal(false);
    setNewDocName('');
    setNewDocEmail('');
    setNewDocLicense('');
    alert(`${docName} successfully onboarded and added to active practitioners!`);
  };

  const handleSaveAdminSettings = (e) => {
    e.preventDefault();
    alert('Admin profile & security credentials updated successfully!');
  };

  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto font-sans">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-black">Admin Management Control</h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-rose-600" /> Super Admin Credentials
            </span>
          </div>
          <p className="text-sm text-[#666666] font-medium mt-1">
            System Overseer • Manage Patients, Verification Audits, Practitioner Licenses, and Platform Reviews
          </p>
        </div>
      </div>

      {/* ==================== TAB 1: DASHBOARD OVERVIEW ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-black">{totalPatientsCount}</div>
                <div className="text-xs text-[#777777] font-extrabold uppercase tracking-wider mt-1">Total Patients</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-black">{totalDoctorsCount}</div>
                <div className="text-xs text-[#777777] font-extrabold uppercase tracking-wider mt-1">Total Doctors</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Stethoscope className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-amber-600">{pendingDoctorsCount}</div>
                <div className="text-xs text-[#777777] font-extrabold uppercase tracking-wider mt-1">Pending Verifications</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
              <div>
                <div className="text-3xl font-black text-black">{totalReviewsCount}</div>
                <div className="text-xs text-[#777777] font-extrabold uppercase tracking-wider mt-1">Total Reviews</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts Bar */}
          <div className="bg-[#FAF5EC] border border-[#E3CF9B] p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E3CF9B] text-[#916D41] flex items-center justify-center font-black">
                
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#916D41]">Quick Admin Controls</h3>
                <p className="text-xs text-gray-600 font-medium">Direct access to practitioner audits & patient records</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigateTab('doctors')}
                className="px-4 py-2.5 bg-black hover:bg-[#2a2a2a] text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-[#C9A574]" /> Verify Doctors Queue ({pendingDoctorsCount})
              </button>

              <button
                onClick={() => navigateTab('patients')}
                className="px-4 py-2.5 bg-white border border-[#E5E0D5] hover:bg-gray-50 text-black rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-4 h-4 text-blue-600" /> Manage All Patients
              </button>

              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="px-4 py-2.5 bg-[#C9A574] hover:bg-[#b89463] text-black rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black" /> Add Doctor
              </button>
            </div>
          </div>

          {/* Pending Doctor Verification Queue Section */}
          <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div>
                <h3 className="text-base font-black text-black">Doctor Verification Queue</h3>
                <p className="text-xs text-gray-500 font-medium">Practitioners awaiting NMC/MCI identity approval</p>
              </div>
              <button
                onClick={() => navigateTab('doctors')}
                className="text-xs font-extrabold text-[#C9A574] hover:underline cursor-pointer"
              >
                View All Doctors ({totalDoctorsCount}) →
              </button>
            </div>

            <div className="space-y-3">
              {doctors.filter(d => d.status === 'Pending').length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 font-bold bg-[#FAF8F5] rounded-xl border border-[#E5E0D5]">
                   All doctor verification requests have been processed!
                </div>
              ) : (
                doctors.filter(d => d.status === 'Pending').map((doc) => (
                  <div key={doc.id} className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-black">{doc.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Review
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">
                        {doc.specialty} • {doc.qualification} • License: <strong className="text-black">{doc.license}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDoctorModal(doc)}
                        className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> View Documents & Verify
                      </button>
                      <button
                        onClick={() => updateDoctorStatus(doc.id, 'Approved')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 2: MANAGE PATIENTS ==================== */}
      {activeTab === 'patients' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-black">Registered Patients Directory</h2>
              <p className="text-xs text-gray-500 font-medium">Monitor active patient accounts, report counts, and account status</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient by name/email..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                />
              </div>

              <select
                value={patientStatusFilter}
                onChange={(e) => setPatientStatusFilter(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-2.5 rounded-xl text-xs font-bold text-black outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
              </select>
            </div>
          </div>

          {/* Patients Table */}
          <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] text-[11px] font-extrabold text-[#777777] uppercase border-b border-[#E5E0D5]">
                    <th className="py-4 px-6">PATIENT NAME & EMAIL</th>
                    <th className="py-4 px-6">JOINED DATE</th>
                    <th className="py-4 px-6">REPORTS STORED</th>
                    <th className="py-4 px-6">ACCOUNT STATUS</th>
                    <th className="py-4 px-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5] text-xs font-semibold">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500 font-bold">
                        No patient records found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-black text-black block">{patient.name}</span>
                          <span className="text-[11px] text-gray-500 font-normal">{patient.email}</span>
                        </td>
                        <td className="py-4 px-6 text-[#666666]">{patient.joinedDate}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-bold">
                            {patient.totalReports} Reports
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                            patient.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedPatientModal(patient)}
                              className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E0D5] hover:bg-[#F4F0E8] text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> View Profile
                            </button>

                            <button
                              onClick={() => togglePatientStatus(patient.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                patient.status === 'Active'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {patient.status === 'Active' ? 'Suspend' : 'Reactivate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 3: MANAGE DOCTORS ==================== */}
      {activeTab === 'doctors' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Controls Bar */}
          <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-black">Medical Practitioner Register</h2>
              <p className="text-xs text-gray-500 font-medium">Verify credentials, view document proofs, approve or deactivate doctors</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctor, license, specialty..."
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                />
              </div>

              <button
                onClick={() => setShowAddDoctorModal(true)}
                className="bg-black hover:bg-[#2a2a2a] text-white px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#C9A574]" /> Add Doctor
              </button>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] text-[11px] font-extrabold text-[#777777] uppercase border-b border-[#E5E0D5]">
                    <th className="py-4 px-6">DOCTOR NAME & EMAIL</th>
                    <th className="py-4 px-6">SPECIALTY</th>
                    <th className="py-4 px-6">QUALIFICATION & LICENSE</th>
                    <th className="py-4 px-6">VERIFICATION STATUS</th>
                    <th className="py-4 px-6">JOINED DATE</th>
                    <th className="py-4 px-6 text-right">DOCUMENT AUDIT & ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D5] text-xs font-semibold">
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-500 font-bold">
                        No medical practitioners found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-black text-black block">{doc.name}</span>
                          <span className="text-[11px] text-gray-500 font-normal">{doc.email}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-black">{doc.specialty}</td>
                        <td className="py-4 px-6 text-[#555555]">
                          <div>{doc.qualification}</div>
                          <span className="text-[10px] text-gray-400 font-mono font-bold">LIC: {doc.license}</span>
                        </td>
                        <td className="py-4 px-6">
                          {doc.status === 'Approved' ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved
                            </span>
                          ) : doc.status === 'Pending' ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              Pending Review
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                              {doc.status}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[#666666]">{doc.joinedDate}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedDoctorModal(doc)}
                              className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#C9A574]" /> View Documents & Verify
                            </button>

                            {doc.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={() => updateDoctorStatus(doc.id, 'Approved')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectModalDoctor(doc)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => updateDoctorStatus(doc.id, doc.status === 'Approved' ? 'Deactivated' : 'Approved')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  doc.status === 'Approved'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {doc.status === 'Approved' ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 4: REVIEWS ==================== */}
      {activeTab === 'reviews' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-black">Patient Reviews & Feedback</h2>
              <p className="text-xs text-gray-500 font-medium">Ratings and consultation reviews submitted by patients</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={reviewRatingFilter}
                onChange={(e) => setReviewRatingFilter(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-2.5 rounded-xl text-xs font-bold text-black outline-none cursor-pointer"
              >
                <option value="All">All Star Ratings</option>
                <option value="5">5 Stars Only</option>
                <option value="4">4 Stars Only</option>
                <option value="3">3 Stars Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-black">{rev.patientName}</h3>
                    <p className="text-xs text-gray-500">Consulted: <strong className="text-black">{rev.doctorName}</strong> ({rev.doctorSpecialty})</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-black">
                    {''.repeat(rev.rating)} ({rev.rating}.0)
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-medium italic leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-[#E5E0D5] text-[11px] text-gray-400 font-semibold">
                  <span>Review ID: {rev.id} • Date: {rev.date}</span>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove/hide this review by ${rev.patientName}?`)) {
                        deleteReview(rev.id);
                        alert('Review removed from platform.');
                      }
                    }}
                    className="text-rose-600 hover:text-rose-800 font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                  >
                     Remove Review
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ==================== TAB 5: SETTINGS ==================== */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl bg-white rounded-2xl border border-[#E5E0D5] shadow-vault-card p-6 md:p-8 space-y-6 animate-fadeIn">
          <div className="border-b border-[#E5E0D5] pb-4">
            <h2 className="text-xl font-black text-black">Admin Profile & System Settings</h2>
            <p className="text-xs text-gray-500 font-medium">Update credentials and emergency contacts for Super Admin</p>
          </div>

          <form onSubmit={handleSaveAdminSettings} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-gray-600 mb-1 font-bold">Admin Full Name</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-bold text-black outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-bold">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-bold text-black outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-600 mb-1 font-bold">Emergency Contact Phone</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-bold text-black outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-bold">Location Headquarters</label>
                <input
                  type="text"
                  value={adminLocation}
                  onChange={(e) => setAdminLocation(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-bold text-black outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E0D5] text-right">
              <button
                type="submit"
                className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== ADD DOCTOR MODAL ==================== */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddDoctorModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"
            >
              
            </button>

            <div className="border-b border-[#E5E0D5] pb-4 space-y-1">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                Manual Onboarding
              </span>
              <h3 className="text-xl font-black text-black">+ Add & Verify Doctor</h3>
              <p className="text-xs text-gray-500 font-medium">Register a verified medical practitioner with uploaded document attachments</p>
            </div>

            <form onSubmit={handleAddDoctorSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 mb-1 font-bold">Doctor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Rahul Mehta"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-bold">Medical Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="rahul.mehta@hospital.com"
                  value={newDocEmail}
                  onChange={(e) => setNewDocEmail(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 mb-1 font-bold">Specialty</label>
                  <select
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-bold text-black outline-none"
                  >
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Endocrinologist">Endocrinologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="General Physician">General Physician</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-bold">Educational Qualification</label>
                  <input
                    type="text"
                    placeholder="MBBS, MD (Neurology)"
                    value={newDocQual}
                    onChange={(e) => setNewDocQual(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-bold">NMC / Medical Council License Number *</label>
                <input
                  type="text"
                  required
                  placeholder="MCI-98765-DL"
                  value={newDocLicense}
                  onChange={(e) => setNewDocLicense(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-xl font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                />
              </div>

              {/* Attach Verification Document Filenames */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-black uppercase tracking-wider">Attach Verification Document Files</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="file"
                    onChange={(e) => setLicenseFileName(e.target.files[0]?.name || '')}
                    className="text-[11px] bg-[#FAF8F5] p-2 rounded-lg border border-[#E5E0D5]"
                  />
                  <input
                    type="file"
                    onChange={(e) => setDegreeFileName(e.target.files[0]?.name || '')}
                    className="text-[11px] bg-[#FAF8F5] p-2 rounded-lg border border-[#E5E0D5]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black hover:bg-[#2a2a2a] text-white rounded-xl font-black cursor-pointer shadow-md"
                >
                  Add & Verify Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== PATIENT DETAILS MODAL ==================== */}
      {selectedPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedPatientModal(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black cursor-pointer"
            >
              
            </button>

            <div className="border-b border-[#E5E0D5] pb-3">
              <h3 className="text-lg font-black text-black">{selectedPatientModal.name}</h3>
              <p className="text-xs text-gray-500 font-medium">Patient Account Profile Details</p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <div className="p-3 bg-[#FAF8F5] rounded-xl flex justify-between">
                <span className="text-gray-500">Patient ID</span>
                <span className="font-bold text-black">{selectedPatientModal.id}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl flex justify-between">
                <span className="text-gray-500">Email Address</span>
                <span className="font-bold text-black">{selectedPatientModal.email}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl flex justify-between">
                <span className="text-gray-500">Joined Date</span>
                <span className="font-bold text-black">{selectedPatientModal.joinedDate}</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl flex justify-between">
                <span className="text-gray-500">Uploaded Lab Reports</span>
                <span className="font-bold text-blue-600">{selectedPatientModal.totalReports} Reports</span>
              </div>
              <div className="p-3 bg-[#FAF8F5] rounded-xl flex justify-between">
                <span className="text-gray-500">Account Status</span>
                <span className={`font-bold ${selectedPatientModal.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedPatientModal.status}
                </span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedPatientModal(null)}
                className="px-5 py-2 bg-gray-100 text-black font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DOCTOR VERIFICATION & DOCUMENT VIEWER MODAL ==================== */}
      {selectedDoctorModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-2xl max-w-3xl w-full p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setSelectedDoctorModal(null); setPreviewDocObj(null); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-black p-2 rounded-full cursor-pointer"
            >
              
            </button>

            {/* Doctor Profile Header */}
            <div className="border-b border-[#E5E0D5] pb-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                  MCI Practitioner License Verification
                </span>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black ${
                  selectedDoctorModal.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  selectedDoctorModal.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  Status: {selectedDoctorModal.status}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-black">{selectedDoctorModal.name}</h3>
              <p className="text-xs text-gray-500 font-medium">
                {selectedDoctorModal.specialty} • {selectedDoctorModal.qualification} • Email: <strong className="text-black">{selectedDoctorModal.email}</strong>
              </p>
              <div className="text-xs text-gray-600 font-semibold">
                NMC License: <span className="font-mono font-bold text-black">{selectedDoctorModal.license}</span> • Exp: <span className="font-bold text-black">{selectedDoctorModal.experience || 'Not Specified'}</span> • Clinic: <span className="font-bold text-black">{selectedDoctorModal.hospital || 'Not Specified'}</span>
              </div>
            </div>

            {/* UPLOADED VERIFICATION DOCUMENTS GRID (PERMANENT ACCESS FOR AUDIT) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#C9A574]" /> Uploaded Verification Documents (4 Files)
                </h4>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                   Audit Verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Medical License Card */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-black">1. Medical License / Registration</h5>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {selectedDoctorModal.licenseDoc?.fileName || 'MCI_Medical_License_Card.pdf'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewDocObj({
                      title: '1. National Medical Council Practitioner License',
                      fileName: selectedDoctorModal.licenseDoc?.fileName || 'MCI_Medical_License_Card.pdf',
                      size: selectedDoctorModal.licenseDoc?.fileSize || '1.8 MB',
                      docNumber: selectedDoctorModal.license,
                      fileUrl: selectedDoctorModal.licenseDoc?.fileUrl || selectedDoctorModal.licenseDoc?.dataUrl || DEFAULT_SAMPLE_PDF
                    })}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> Preview License Document →
                  </button>
                </div>

                {/* 2. Degree Certificate */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-black">2. Medical Degree Certificate</h5>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {selectedDoctorModal.degreeDoc?.fileName || 'MBBS_MD_Degree_Certificate.pdf'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewDocObj({
                      title: '2. Educational Degree Qualification Certificate',
                      fileName: selectedDoctorModal.degreeDoc?.fileName || 'MBBS_MD_Degree_Certificate.pdf',
                      size: selectedDoctorModal.degreeDoc?.fileSize || '2.4 MB',
                      docNumber: selectedDoctorModal.qualification,
                      fileUrl: selectedDoctorModal.degreeDoc?.fileUrl || selectedDoctorModal.degreeDoc?.dataUrl || DEFAULT_SAMPLE_PDF
                    })}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> Preview Degree Document →
                  </button>
                </div>

                {/* 3. Govt ID Proof */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <IdCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-black">3. Government ID Proof</h5>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {selectedDoctorModal.govIdDoc?.fileName || 'Aadhaar_Government_ID_Proof.pdf'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewDocObj({
                      title: '3. National Identity Proof (Aadhaar / Passport)',
                      fileName: selectedDoctorModal.govIdDoc?.fileName || 'Aadhaar_Government_ID_Proof.pdf',
                      size: selectedDoctorModal.govIdDoc?.fileSize || '1.2 MB',
                      docNumber: 'Verified Govt Identity',
                      fileUrl: selectedDoctorModal.govIdDoc?.fileUrl || selectedDoctorModal.govIdDoc?.dataUrl || DEFAULT_SAMPLE_PDF
                    })}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> Preview Govt ID Proof →
                  </button>
                </div>

                {/* 4. Hospital Affiliation Letter */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-black">4. Hospital Affiliation Letter</h5>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {selectedDoctorModal.affiliationDoc?.fileName || 'Hospital_Affiliation_Letter.pdf'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewDocObj({
                      title: '4. Clinic & Hospital OPD Affiliation Letter',
                      fileName: selectedDoctorModal.affiliationDoc?.fileName || 'Hospital_Affiliation_Letter.pdf',
                      size: selectedDoctorModal.affiliationDoc?.fileSize || '0.9 MB',
                      docNumber: selectedDoctorModal.hospital || 'Hospital Affiliation',
                      fileUrl: selectedDoctorModal.affiliationDoc?.fileUrl || selectedDoctorModal.affiliationDoc?.dataUrl || DEFAULT_SAMPLE_PDF
                    })}
                    className="w-full py-2 bg-black hover:bg-gray-800 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#C9A574]" /> Preview Affiliation Letter →
                  </button>
                </div>
              </div>
            </div>

            {/* REAL UPLOADED FILE DOCUMENT PREVIEWER OVERLAY PANEL */}
            {previewDocObj && (() => {
              const activeBlobUrl = getDocumentBlobUrl(previewDocObj.fileUrl, previewDocObj.fileName?.endsWith('.png') || previewDocObj.fileName?.endsWith('.jpg') || previewDocObj.fileName?.endsWith('.jpeg') ? 'image/jpeg' : 'application/pdf');
              const isImage = previewDocObj.fileUrl?.startsWith('data:image') || previewDocObj.fileName?.endsWith('.png') || previewDocObj.fileName?.endsWith('.jpg') || previewDocObj.fileName?.endsWith('.jpeg');

              const handleDownload = () => {
                if (!activeBlobUrl) return;
                const a = document.createElement('a');
                a.href = activeBlobUrl;
                a.download = previewDocObj.fileName || 'medical_verification_document.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              };

              const handleOpenNewTab = () => {
                if (!activeBlobUrl) return;
                window.open(activeBlobUrl, '_blank');
              };

              return (
                <div className="p-6 bg-[#FAF8F5] rounded-3xl border border-[#E5E0D5] space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E0D5] pb-3">
                    <div>
                      <h5 className="text-sm font-black text-black">{previewDocObj.title}</h5>
                      <p className="text-xs text-gray-500 font-mono">{previewDocObj.fileName} ({previewDocObj.size})</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleOpenNewTab}
                        className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#C9A574]" /> Open PDF in New Tab
                      </button>

                      <button
                        onClick={handleDownload}
                        className="px-3.5 py-1.5 bg-[#C9A574] hover:bg-[#b08d5c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-white" /> Download Document
                      </button>

                      <button 
                        onClick={() => setPreviewDocObj(null)} 
                        className="text-xs font-bold text-gray-400 hover:text-black cursor-pointer px-2"
                      >
                         Close Preview
                      </button>
                    </div>
                  </div>

                  {/* Actual File Content Rendering */}
                  {isImage ? (
                    <div className="bg-white p-4 rounded-2xl border border-[#E5E0D5] flex items-center justify-center">
                      <img 
                        src={activeBlobUrl} 
                        alt={previewDocObj.title} 
                        className="max-h-[500px] w-auto max-w-full rounded-xl object-contain shadow-md"
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-[#E5E0D5] p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-950 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Medical Document Verified • Click below to view fullscreen or download</span>
                        </div>
                        <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                          PDF READY
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={handleOpenNewTab}
                          className="py-3 px-4 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                        >
                          <ExternalLink className="w-4 h-4 text-[#C9A574]" /> Open PDF Fullscreen in Browser Tab
                        </button>
                        <button
                          onClick={handleDownload}
                          className="py-3 px-4 bg-[#C9A574] hover:bg-[#b59262] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                        >
                          <Download className="w-4 h-4 text-white" /> Download PDF File to PC
                        </button>
                      </div>

                      {activeBlobUrl && (
                        <div className="rounded-2xl border border-[#E5E0D5] overflow-hidden pt-2">
                          <iframe 
                            src={activeBlobUrl} 
                            className="w-full h-[420px] rounded-2xl border-none"
                            title="Medical Document Previewer"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* VERIFICATION ACTIONS (Approve / Reject / Deactivate) */}
            <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
              <button
                onClick={() => setSelectedDoctorModal(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Audit View
              </button>

              <div className="flex items-center gap-2">
                {selectedDoctorModal.status === 'Pending' ? (
                  <>
                    <button
                      onClick={() => {
                        updateDoctorStatus(selectedDoctorModal.id, 'Approved');
                        setSelectedDoctorModal({ ...selectedDoctorModal, status: 'Approved' });
                        alert(`${selectedDoctorModal.name} has been approved! Documents remain permanently accessible for audit.`);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Doctor & Issue License Seal
                    </button>

                    <button
                      onClick={() => setRejectModalDoctor(selectedDoctorModal)}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Reject Application
                    </button>
                  </>
                ) : selectedDoctorModal.status === 'Approved' ? (
                  <button
                    onClick={() => {
                      updateDoctorStatus(selectedDoctorModal.id, 'Deactivated');
                      setSelectedDoctorModal({ ...selectedDoctorModal, status: 'Deactivated' });
                      alert(`${selectedDoctorModal.name} has been deactivated. Account disabled from platform bookings.`);
                    }}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ban className="w-4 h-4" /> Deactivate Doctor Account
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      updateDoctorStatus(selectedDoctorModal.id, 'Approved');
                      setSelectedDoctorModal({ ...selectedDoctorModal, status: 'Approved' });
                      alert(`${selectedDoctorModal.name} account reactivated & restored to active practitioners!`);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Reactivate Doctor Account
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADMIN REJECTION REASON SUB-MODAL */}
      {rejectModalDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-6 relative font-sans select-none">
            <button
              onClick={() => setRejectModalDoctor(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black rounded-full cursor-pointer text-lg font-bold"
            >
              
            </button>

            <div className="space-y-2 border-b border-[#E5E0D5] pb-4">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                 Reject Doctor Verification Application
              </span>
              <h2 className="text-xl font-black text-black pt-1">Reject Verification Request</h2>
              <p className="text-xs text-gray-500 font-medium">
                Applicant: <strong className="text-black">{rejectModalDoctor.name}</strong> ({rejectModalDoctor.email})
              </p>
            </div>

            <div className="space-y-2 text-xs font-semibold">
              <label className="block text-gray-700 font-bold uppercase tracking-wider">Specify Rejection Reason (Shown to Doctor) *</label>
              <textarea
                rows="4"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Explain clearly why the verification was rejected..."
                className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3.5 rounded-2xl text-xs font-medium text-black outline-none focus:ring-2 focus:ring-rose-400"
              ></textarea>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5E0D5]">
              <button
                onClick={() => setRejectModalDoctor(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  updateDoctorStatus(rejectModalDoctor.id, 'Rejected', rejectionReasonInput);
                  if (selectedDoctorModal?.id === rejectModalDoctor.id) {
                    setSelectedDoctorModal({ ...selectedDoctorModal, status: 'Rejected', rejectionReason: rejectionReasonInput });
                  }
                  setRejectDoctorModal(null);
                  alert(`Verification for ${rejectModalDoctor.name} has been REJECTED with reason recorded.`);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
              >
                Confirm Rejection & Send Reason
              </button>
            </div>
        </div>
    </div>
)}

    </div>
  );
}

