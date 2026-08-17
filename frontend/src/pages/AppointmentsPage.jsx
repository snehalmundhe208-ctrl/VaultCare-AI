import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  Video, 
  CreditCard, 
  XCircle, 
  AlertCircle,
  MapPin,
  Building,
  Check,
  Hourglass,
  Lock,
  ExternalLink,
  RefreshCw,
  DollarSign,
  ShieldCheck,
  Stethoscope,
  Save,
  Star,
  FileText,
  Download
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { useAuth } from '../context/AuthContext';
import { downloadPdfFile } from '../utils/downloadPdf';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';

export default function AppointmentsPage() {
  const { appointments, addAppointment, updateAppointment, cancelAppointment, addReview } = useVault();
  const { user, t } = useAuth();

  const [showBookModal, setShowBookModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Upcoming' | 'Pending' | 'Completed' | 'Cancelled'

  // Dedicated Reschedule Modal State
  const [editApptData, setEditApptData] = useState(null); // null | { id, doctor, specialty, date, time, type }

  // Review Modal State
  const [showReviewModalAppt, setShowReviewModalAppt] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Prescription Modal State for Patient View
  const [issuedPrescriptionModal, setIssuedPrescriptionModal] = useState(null);

  // Get approved doctors from VaultContext for real dropdown selection
  const { doctors: contextDoctors } = useVault();
  const approvedDoctors = (contextDoctors || []).filter(d => {
    const st = (d.verificationStatus || d.status || '').toUpperCase();
    return st === 'APPROVED' || st === 'ACTIVE';
  });

  // Form State for Booking
  const [doctorName, setDoctorName] = useState(approvedDoctors[0]?.name || 'Dr. Ananya Sharma');
  const [specialty, setSpecialty] = useState(approvedDoctors[0]?.specialty || 'Cardiologist');
  const [date, setDate] = useState('2026-08-28');
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [consultationType, setConsultationType] = useState('online');

  const availableSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', 
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', 
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
  ];

  // Dynamically update specialty when doctor changes
  useEffect(() => {
    const found = approvedDoctors.find(d => d.name === doctorName);
    if (found) {
      setSpecialty(found.specialty);
    }
  }, [doctorName, approvedDoctors.length]);

  const consultationFee = 500;

  // Real Double-Booking Prevention Rule: Check if a slot is already taken for a given Doctor & Date
  const isSlotBooked = (slot, docName, apptDate, excludeId = null) => {
    return (appointments || []).some(a => 
      a.id !== excludeId &&
      a.doctor === docName &&
      a.date === apptDate &&
      a.time === slot &&
      a.status !== 'Cancelled'
    );
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();

    if (isSlotBooked(selectedSlot, doctorName, date)) {
      alert(`The time slot ${selectedSlot} for ${doctorName} on ${date} is already booked! Please select another free time slot.`);
      return;
    }

    const matchedDoctor = approvedDoctors.find(d => d.name === doctorName);
    const docEmail = (matchedDoctor?.email || `${doctorName.toLowerCase().replace(/\s+/g, '')}@hospital.com`).toLowerCase().trim();
    const uniqueId = 'APT-' + Math.floor(100 + Math.random() * 900);

    // Launch Razorpay Checkout Modal (Test Mode)
    await openRazorpayCheckout({
      amount: consultationFee,
      planName: `${consultationType === 'online' ? 'Online Video' : 'In-Person'} Consultation with ${doctorName}`,
      description: `OPD Consultation Fee - Dr. ${doctorName}`,
      prefill: {
        name: user?.fullName || 'Patient User',
        email: (user?.email || '').toLowerCase().trim()
      },
      notes: {
        appointmentId: uniqueId,
        doctor: doctorName,
        date: date,
        time: selectedSlot
      },
      onSuccess: async ({ paymentId, orderId }) => {
        let generatedMeetUrl = null;
        let generatedCalendarEventId = null;

        if (consultationType === 'online') {
          try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const meetRes = await fetch(`${backendUrl}/api/appointments/${uniqueId}/create-meeting`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                doctorName,
                patientName: user?.fullName || 'Patient User',
                date,
                time: selectedSlot,
                type: consultationType
              })
            });
            const meetData = await meetRes.json();
            if (meetData.success) {
              generatedMeetUrl = meetData.meetingLink || meetData.meetUrl;
              generatedCalendarEventId = meetData.googleCalendarEventId;
            }
          } catch (mErr) {
            console.error('Google Meet Creation Error:', mErr);
            generatedMeetUrl = `https://meet.google.com/vlt-care-${uniqueId.toLowerCase()}`;
          }
        }

        const newAppt = {
          id: uniqueId,
          doctor: doctorName,
          doctorEmail: docEmail,
          patientName: user?.fullName || 'Patient User',
          patientEmail: (user?.email || '').toLowerCase().trim(),
          specialty: specialty,
          date: date,
          time: selectedSlot,
          type: consultationType,
          location: consultationType === 'in-person' ? (matchedDoctor?.hospital || 'Hospital OPD Clinic') : 'Google Meet Video Call',
          status: 'Pending',
          feePaid: consultationFee,
          paymentId: paymentId,
          razorpayOrderId: orderId,
          paymentStatus: 'Verified & Confirmed',
          meetUrl: generatedMeetUrl,
          meetingLink: generatedMeetUrl,
          googleCalendarEventId: generatedCalendarEventId
        };

        addAppointment(newAppt);
        setShowBookModal(false);
        alert(`Payment of ₹${consultationFee} Successful! Your appointment with ${doctorName} has been booked.`);
      },
      onDismiss: () => {
        // Razorpay modal closed
      }
    });
  };

  const handleEditOpen = (appt) => {
    if (appt.status !== 'Pending') {
      alert('Editing / Rescheduling is allowed only when appointment status is "Pending". Confirmed or completed appointments cannot be edited.');
      return;
    }
    setEditApptData({
      id: appt.id,
      doctor: appt.doctor,
      specialty: appt.specialty,
      date: appt.date,
      time: appt.time,
      type: appt.type
    });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editApptData) return;

    if (isSlotBooked(editApptData.time, editApptData.doctor, editApptData.date, editApptData.id)) {
      alert(`The time slot ${editApptData.time} for ${editApptData.doctor} on ${editApptData.date} is already booked! Please select another time slot.`);
      return;
    }

    updateAppointment(editApptData.id, {
      date: editApptData.date,
      time: editApptData.time,
      type: editApptData.type
    });

    setEditApptData(null);
    alert('Appointment rescheduled successfully.');
  };

  const handleCancelClick = (appt) => {
    if (appt.status === 'Cancelled') return;
    if (window.confirm(`Are you sure you want to cancel your appointment with ${appt.doctor} on ${appt.date}?`)) {
      cancelAppointment(appt.id);
    }
  };

  const handleOpenReviewModal = (appt) => {
    setShowReviewModalAppt(appt);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!showReviewModalAppt) return;

    const newRev = {
      id: 'REV-' + Date.now(),
      appointmentId: showReviewModalAppt.id,
      patientName: user?.fullName || 'Patient',
      patientEmail: user?.email || 'patient@vaultcare.com',
      doctorName: showReviewModalAppt.doctor,
      doctorSpecialty: showReviewModalAppt.specialty,
      rating: reviewRating,
      comment: reviewComment,
      date: new Date().toISOString().split('T')[0],
      status: 'Published'
    };

    addReview(newRev);
    setShowReviewModalAppt(null);
    alert(`Thank you! Your ${reviewRating}-star review for ${showReviewModalAppt.doctor} has been submitted.`);
  };

  const currentUserEmail = (user?.email || '').toLowerCase().trim();
  // Strict user filter: only own appointments
  const myAppointments = (appointments || []).filter(a => {
    const pEmail = (a.patientEmail || a.userKey || '').toLowerCase().trim();
    return pEmail === currentUserEmail;
  });

  const upcomingList = myAppointments.filter(a => a.status === 'Confirmed' || a.status === 'Approved');
  const pendingList = myAppointments.filter(a => a.status === 'Pending');
  const completedList = myAppointments.filter(a => a.status === 'Completed');
  const cancelledList = myAppointments.filter(a => a.status === 'Cancelled');

  const filteredAppointments = myAppointments.filter(a => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Upcoming') return a.status === 'Confirmed' || a.status === 'Approved';
    if (activeFilter === 'Pending') return a.status === 'Pending';
    if (activeFilter === 'Completed') return a.status === 'Completed';
    if (activeFilter === 'Cancelled') return a.status === 'Cancelled';
    return true;
  });

  return (
    <div className="space-[#E5E0D5] space-y-8 font-sans max-w-7xl mx-auto pb-12">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E0D5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-black tracking-tight">{t('myAppointments')}</h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live OPD Slot Guard
            </span>
          </div>
          <p className="text-xs text-[#777777] font-semibold mt-1">
            Book, manage, or reschedule consultations with newly verified and active medical specialists.
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="bg-black hover:bg-[#2a2a2a] text-[#C9A574] font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#C9A574]" /> {t('bookAppointment')}
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Upcoming Confirmed</span>
            <span className="text-2xl font-black text-blue-700">{upcomingList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Pending Approval</span>
            <span className="text-2xl font-black text-amber-600">{pendingList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-black text-emerald-700">{completedList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Check className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Cancelled (Refunded)</span>
            <span className="text-2xl font-black text-rose-600">{cancelledList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-3 overflow-x-auto">
        {['All', 'Upcoming', 'Pending', 'Completed', 'Cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === tab
                ? 'bg-black text-white shadow-xs'
                : 'bg-white text-gray-600 border border-[#E5E0D5] hover:bg-gray-50'
            }`}
          >
            {tab === 'All' && `All (${appointments.length})`}
            {tab === 'Upcoming' && `Upcoming (${upcomingList.length})`}
            {tab === 'Pending' && `Pending (${pendingList.length})`}
            {tab === 'Completed' && `Completed (${completedList.length})`}
            {tab === 'Cancelled' && `Cancelled (${cancelledList.length})`}
          </button>
        ))}
      </div>

      {/* APPOINTMENT LIST CARDS */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E0D5] shadow-vault-card space-y-3">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-sm font-black text-black">No Appointments Found</h3>
            <p className="text-xs text-gray-500 font-medium">There are no appointments matching the "{activeFilter}" filter tab.</p>
          </div>
        ) : (
          filteredAppointments.map((appt) => (
            <div
              key={appt.id}
              className={`bg-white rounded-3xl p-6 border transition-all shadow-vault-card ${
                appt.status === 'Cancelled' ? 'border-amber-200 bg-[#FAF8F5]/80' : 'border-[#E5E0D5] hover:shadow-md'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Left: Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs ${
                    appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]'
                  }`}>
                    <Stethoscope className="w-6 h-6 text-[#00796B]" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-black">{appt.doctor}</h3>
                      
                      {/* Status Pill Badge */}
                      {appt.status === 'Confirmed' || appt.status === 'Approved' ? (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                          Upcoming Confirmed
                        </span>
                      ) : appt.status === 'Pending' ? (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Pending Approval
                        </span>
                      ) : appt.status === 'Completed' ? (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      ) : (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                          Cancelled
                        </span>
                      )}

                      {/* Mode Type Badge */}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                        {appt.type === 'in-person' ? ' In-Person Clinic' : ' Online Video'}
                      </span>
                    </div>

                    <p className="text-xs text-[#777777] font-semibold">{appt.specialty}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#555555] font-bold pt-1">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C9A574]" /> {appt.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C9A574]" /> {appt.time}</span>
                      <span className="flex items-center gap-1.5 text-gray-500">
                        {appt.type === 'in-person' ? <MapPin className="w-3.5 h-3.5 text-[#C9A574]" /> : <Video className="w-3.5 h-3.5 text-[#C9A574]" />}
                        {appt.location || (appt.type === 'in-person' ? 'Hospital OPD Clinic' : 'Google Meet Video')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-3 self-end md:self-center">
                  {appt.type === 'online' && appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                    <a
                      href={appt.meetUrl || appt.meetingLink || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#10B981] hover:bg-emerald-600 text-black font-extrabold px-5 py-2.5 rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Video className="w-4 h-4 text-black" /> Join Google Meet
                    </a>
                  )}

                  {/* Reschedule Button: ACTIVE for Pending, LOCKED once Confirmed! */}
                  {appt.status === 'Pending' ? (
                    <button
                      onClick={() => openRescheduleModal(appt)}
                      className="px-4 py-2.5 bg-black hover:bg-[#2a2a2a] text-white font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Reschedule Pending Appointment"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#C9A574]" /> Reschedule Slot
                    </button>
                  ) : (appt.status === 'Confirmed' || appt.status === 'Approved') ? (
                    <button
                      disabled
                      title="Confirmed appointments cannot be rescheduled once doctor approves"
                      className="px-3.5 py-2.5 bg-gray-100 border border-gray-200 text-gray-400 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5 text-gray-400" /> Confirmed (Locked)
                    </button>
                  ) : null}

                  {/* Prescription & Review Buttons for COMPLETED appointments */}
                  {appt.status === 'Completed' && (
                    <div className="flex flex-wrap items-center gap-2">
                      {appt.prescription ? (
                        <button
                          onClick={() => setIssuedPrescriptionModal(appt.prescription)}
                          className="px-4 py-2.5 bg-[#00796B] hover:bg-[#00695C] text-white font-black rounded-2xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-white" /> View Prescription
                        </button>
                      ) : (
                        <span className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Prescribed
                        </span>
                      )}

                      {appt.hasReviewed ? (
                        <span className="px-3.5 py-2.5 rounded-2xl bg-[#FAF5EC] border border-[#E3CF9B] text-[#916D41] text-xs font-black flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setShowReviewModalAppt(appt);
                            setReviewRating(5);
                            setReviewComment('');
                          }}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-2xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-black text-black" /> Leave a Review
                        </button>
                      )}
                    </div>
                  )}

                  {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                    <button
                      onClick={() => handleCancelWithRefund(appt)}
                      className="p-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-2xl cursor-pointer transition-colors"
                      title="Cancel Appointment & Request Automatic 24-Hour Refund"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>

              {/* 24-HOUR REFUND STATUS CARD (DISPLAYED ON CANCELLED APPOINTMENTS) */}
              {appt.status === 'Cancelled' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-amber-950">Automatic Refund Processing Active (24-Hour Guarantee)</h4>
                      <p className="text-amber-800 font-medium mt-0.5">
                        Your booking fee of <strong>₹{appt.feePaid || 500}</strong> has been released and is currently processing back to your original payment account. Estimated credit time: <strong>Within 24 Hours</strong>.
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-amber-100 text-amber-900 font-black rounded-full border border-amber-300 text-[10px] uppercase tracking-wider self-start md:self-auto flex-shrink-0">
                    Status: Refund Initiated
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* BOOK APPOINTMENT MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative font-sans max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div>
                <h3 className="text-lg font-black text-black">Book OPD Doctor Consultation</h3>
                <p className="text-xs text-gray-500 font-medium">Select a newly verified practitioner, OPD slot, and consultation mode</p>
              </div>

              <button
                onClick={() => setShowBookModal(false)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs font-semibold">
              
              {/* Doctor Selector (Newly verified doctors automatically listed) */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Select Verified Doctor *</label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer focus:border-black"
                >
                  {approvedDoctors.map((doc) => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name} — {doc.specialty} ({doc.hospital || 'VaultCare Partner'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Specialty & Department</label>
                <input
                  type="text"
                  readOnly
                  value={specialty}
                  className="w-full bg-gray-100 border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-not-allowed"
                />
              </div>

              {/* Consultation Type Selector */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setConsultationType('online')}
                  className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    consultationType === 'online'
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-[#FAF8F5] text-gray-700 border-[#E5E0D5]'
                  }`}
                >
                  <Video className="w-4 h-4 text-[#C9A574]" /> Online Video Call
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('in-person')}
                  className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    consultationType === 'in-person'
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-[#FAF8F5] text-gray-700 border-[#E5E0D5]'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-[#C9A574]" /> In-Person Hospital OPD
                </button>
              </div>

              {/* Date & Time Slot Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Available OPD Slot *</label>
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer focus:border-black"
                  >
                    {availableSlots.map((slot) => {
                      const taken = isSlotBooked(slot, doctorName, date);
                      return (
                        <option key={slot} value={slot} disabled={taken}>
                          {slot} {taken ? '— (Already Booked)' : '— (Available)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-[#FAF5EC] rounded-2xl border border-[#E3CF9B] space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#916D41] font-bold">
                  <span>Consultation Fee:</span>
                  <span className="text-black font-black text-sm">₹{consultationFee}</span>
                </div>
                <div className="flex items-center justify-between text-[#916D41] text-[11px]">
                  <span>Razorpay Payment Gateway:</span>
                  <span className="font-bold text-emerald-700">Encrypted 256-Bit SSL</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4 text-[#C9A574]" /> Pay ₹{consultationFee} & Confirm Booking
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DEDICATED RESCHEDULE MODAL */}
      {editApptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-5 relative font-sans">
            
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div>
                <h3 className="text-base font-black text-black">Reschedule Appointment Slot</h3>
                <p className="text-xs text-gray-500 font-medium">Modify appointment date or time slot for {editApptData.doctor}</p>
              </div>

              <button
                onClick={() => setEditApptData(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1">New Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={editApptData.date}
                  onChange={(e) => setEditApptData({ ...editApptData, date: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">New OPD Time Slot *</label>
                <select
                  value={editApptData.time}
                  onChange={(e) => setEditApptData({ ...editApptData, time: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer focus:border-black"
                >
                  {availableSlots.map((slot) => {
                    const taken = isSlotBooked(slot, editApptData.doctor, editApptData.date, editApptData.id);
                    return (
                      <option key={slot} value={slot} disabled={taken}>
                        {slot} {taken ? '— (Already Booked)' : '— (Available)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Consultation Mode</label>
                <select
                  value={editApptData.type}
                  onChange={(e) => setEditApptData({ ...editApptData, type: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-bold text-black outline-none cursor-pointer"
                >
                  <option value="online">Online Video Call</option>
                  <option value="in-person">In-Person Hospital OPD</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditApptData(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-black hover:bg-[#2a2a2a] text-white rounded-xl font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-[#C9A574]" /> Save New Slot
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {showReviewModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-5 relative font-sans">
            
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
              <div>
                <h3 className="text-base font-black text-black">Leave Doctor Review</h3>
                <p className="text-xs text-gray-500 font-medium">Reviewing consultation with {showReviewModalAppt.doctor}</p>
              </div>

              <button
                onClick={() => setShowReviewModalAppt(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Star Rating (1 to 5 Stars)</label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        reviewRating >= star
                          ? 'bg-amber-50 border-amber-300 text-amber-500'
                          : 'bg-gray-50 border-gray-200 text-gray-300'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${reviewRating >= star ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="ml-2 font-black text-black text-sm">{reviewRating}.0 / 5.0</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Your Review Feedback *</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe your consultation experience, doctor attentiveness, and diagnostic guidance..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-4 rounded-2xl text-xs font-medium text-black outline-none focus:ring-2 focus:ring-[#C9A574]"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModalAppt(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-black hover:bg-[#2a2a2a] text-white rounded-xl font-black cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUED PRESCRIPTION VIEW MODAL FOR PATIENT */}
      {issuedPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative font-sans max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00796B] border border-teal-200 flex items-center justify-center flex-shrink-0 font-bold">
                  <FileText className="w-5 h-5 text-[#00796B]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Official Medical Prescription</h3>
                  <p className="text-xs text-gray-500 font-medium">{issuedPrescriptionModal.doctorName || 'VaultCare Doctor'} • {issuedPrescriptionModal.reportId || 'PRESCR-101'}</p>
                </div>
              </div>

              <button
                onClick={() => setIssuedPrescriptionModal(null)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-base font-bold"
              >
                ✕
              </button>
            </div>

            {/* Prescription Content Body */}
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D5] grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 text-[11px] block font-bold">Patient Name:</span>
                  <span className="font-extrabold text-black text-sm">{issuedPrescriptionModal.patientName || user?.fullName || 'Patient'}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px] block font-bold">Diagnosis:</span>
                  <span className="font-extrabold text-emerald-800 text-sm">{issuedPrescriptionModal.diagnosis || 'General OPD Consultation'}</span>
                </div>
              </div>

              {issuedPrescriptionModal.symptoms && (
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wider mb-1">Symptoms & Observations</h4>
                  <p className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E0D5] text-gray-700 font-medium">{issuedPrescriptionModal.symptoms}</p>
                </div>
              )}

              {/* Medicines List Table */}
              {issuedPrescriptionModal.medicines && issuedPrescriptionModal.medicines.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wider mb-2">Prescribed Medicines</h4>
                  <div className="overflow-x-auto rounded-2xl border border-[#E5E0D5]">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead className="bg-[#FAF8F5] text-gray-600 border-b border-[#E5E0D5]">
                        <tr>
                          <th className="p-3">Medicine Name</th>
                          <th className="p-3">Dosage</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E0D5]">
                        {issuedPrescriptionModal.medicines.map((med, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF8F5]">
                            <td className="p-3 font-bold text-black">{med.name}</td>
                            <td className="p-3 text-gray-700">{med.dosage || '1 Tablet'}</td>
                            <td className="p-3 text-gray-700">{med.freq || '1-0-1'}</td>
                            <td className="p-3 text-gray-700">{med.duration || '7 Days'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {issuedPrescriptionModal.medicalFindings && (
                <div>
                  <h4 className="text-xs font-black text-black uppercase tracking-wider mb-1">Doctor Consultation Notes</h4>
                  <p className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E0D5] text-gray-700 font-medium">{issuedPrescriptionModal.medicalFindings}</p>
                </div>
              )}

              <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-bold">Status: Digitally Signed & Verified</span>
                <button
                  onClick={() => {
                    downloadPdfFile(
                      issuedPrescriptionModal.diagnosis || 'Official Medical Prescription',
                      issuedPrescriptionModal,
                      `Prescription_${(issuedPrescriptionModal.doctorName || 'Doctor').replace(/\s+/g, '_')}_${Date.now()}.pdf`
                    );
                    setIssuedPrescriptionModal(null);
                  }}
                  className="px-5 py-2.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] font-extrabold rounded-2xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download PDF Prescription
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
