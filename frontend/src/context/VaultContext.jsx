import React { craeteContext, useContext, useState, useEffect } from 'react':
import { useAuth } from './AuthContext';
import { saveReportToIndexedDB, getAllReportsFromIndexedDB, deleteReportFromIndexedDB } from '../services/reportStorage';

const VaultContext = createContext();

export const VaultProvider = ({ children }) => {
  const { user } = useAuth();
  const userKey = user?.email ? user.email.toLowerCase().trim() : 'demo_guest';
  const isDemoAccount = userKey === 'snehal@gmail.com';

  const defaultReports = [
    { id: 'REP-101', title: 'Complete Blood Count (CBC)', category: 'Blood Test', date: '2026-07-15', facility: 'Apollo Diagnostic Lab', status: 'Processed', fileName: 'CBC_Blood_Test_Report.pdf', fileSize: '1.4 MB' }
  ];

  const defaultDoctors = [
    { 
      id: 'DOC-101', 
      name: 'Dr. Ananya Sharma', 
      email: 'ananya@hospital.com', 
      specialty: 'Cardiologist', 
      qualification: 'MBBS, MD (Cardiology)', 
      license: 'MCI-98420-MH', 
      experience: '8 Years',
      hospital: 'Apollo Heart Institute, Mumbai',
      status: 'Approved', 
      joinedDate: '2026-05-10',
      verificationStatus: 'APPROVED',
      licenseDoc: { fileName: 'MCI_Medical_License_Ananya.pdf', fileSize: '1.8 MB', fileType: 'pdf' },
      degreeDoc: { fileName: 'MBBS_MD_Degree_Cardiology.pdf', fileSize: '2.4 MB', fileType: 'pdf' },
      govIdDoc: { fileName: 'Govt_Aadhaar_ID_Proof.pdf', fileSize: '1.2 MB', fileType: 'pdf' },
      affiliationDoc: { fileName: 'Apollo_Affiliation_Letter.pdf', fileSize: '0.9 MB', fileType: 'pdf' }
    },
    { 
      id: 'DOC-102', 
      name: 'Dr. Ashramee Mane', 
      email: 'ashramee@gmail.com', 
      specialty: 'General Physician & Cardiologist', 
      qualification: 'MBBS, MD (Internal Medicine)', 
      license: 'MCI-64210-MH', 
      experience: '6 Years',
      hospital: 'Lilavati Hospital, Mumbai',
      status: 'Approved', 
      joinedDate: '2026-06-12',
      verificationStatus: 'APPROVED',
      licenseDoc: { fileName: 'Medical_License_Ashramee.pdf', fileSize: '1.5 MB', fileType: 'pdf' },
      degreeDoc: { fileName: 'MBBS_MD_Degree_Ashramee.pdf', fileSize: '2.1 MB', fileType: 'pdf' },
      govIdDoc: { fileName: 'Govt_ID_Ashramee.pdf', fileSize: '1.1 MB', fileType: 'pdf' }
    },
    { 
      id: 'DOC-103', 
      name: 'Dr. Dev Smith', 
      email: 'dev@gmail.com', 
      specialty: 'Neurologist & Specialist', 
      qualification: 'MBBS, DM (Neurology)', 
      license: 'MCI-88190-DL', 
      experience: '10 Years',
      hospital: 'Fortis Healthcare, New Delhi',
      status: 'Approved', 
      joinedDate: '2026-07-01',
      verificationStatus: 'APPROVED',
      licenseDoc: { fileName: 'Medical_License_Dev.pdf', fileSize: '1.6 MB', fileType: 'pdf' },
      degreeDoc: { fileName: 'MBBS_DM_Degree_Dev.pdf', fileSize: '2.3 MB', fileType: 'pdf' },
      govIdDoc: { fileName: 'Govt_ID_Dev.pdf', fileSize: '1.3 MB', fileType: 'pdf' }
    }
  ];

  const defaultPatients = [
    { id: 'P-101', name: 'Snehal Mundhe', email: 'snehal@gmail.com', joinedDate: '2026-08-01', totalReports: 1, status: 'Active', gender: 'Female', age: 26 }
  ];

  const defaultReviews = [
    {
      id: 'REV-101',
      patientName: 'Snehal Mundhe',
      doctorName: 'Dr. Ananya Sharma',
      doctorSpecialty: 'Cardiologist',
      rating: 5,
      comment: 'Dr. Ananya was exceptionally thorough with my ECG & Lipid panel analysis. Very clear and reassuring guidance!',
      date: '2026-08-02',
      status: 'Published'
    }
  ];

  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem(`vaultcare_reports_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return isDemoAccount ? defaultReports : [];
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const savedUser = localStorage.getItem(`vaultcare_appts_${userKey}`);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && Array.isArray(parsed)) {
          // Strict user filter: only own appointments
          return parsed.filter(a => (a.patientEmail || a.userKey || '').toLowerCase().trim() === userKey);
        }
      }
    } catch (e) {}
    return [];
  });

  const [doctors, setDoctors] = useState(() => {
    try {
      const saved = localStorage.getItem('vaultcare_admin_doctors') || localStorage.getItem('vaultcare_doctors');
      let docList = saved ? JSON.parse(saved) : defaultDoctors;
      if (!Array.isArray(docList)) docList = defaultDoctors;

      // Merge all defaultDoctors so no default doctor is lost
      defaultDoctors.forEach(defDoc => {
        if (!docList.some(d => d.email?.toLowerCase().trim() === defDoc.email.toLowerCase().trim())) {
          docList.push(defDoc);
        }
      });

      // Merge registered doctors from vaultcare_registered_users
      try {
        const regUsers = JSON.parse(localStorage.getItem('vaultcare_registered_users') || '[]');
        regUsers.forEach(u => {
          if (u.role === 'doctor' && u.email) {
            const emailKey = u.email.toLowerCase().trim();
            if (!docList.some(d => d.email?.toLowerCase().trim() === emailKey)) {
              docList.push({
                id: 'DOC-REG-' + Date.now() + '-' + Math.floor(Math.random() * 100),
                name: u.fullName || `Dr. ${emailKey.split('@')[0]}`,
                email: emailKey,
                specialty: 'General Medicine & Specialist',
                qualification: 'MBBS, MD',
                license: 'MCI-REG-VERIFIED',
                hospital: 'VaultCare Healthcare Partner',
                status: 'Not Submitted',
                verificationStatus: 'NOT_SUBMITTED',
                joinedDate: new Date().toISOString().split('T')[0]
              });
            }
          }
        });
      } catch (e) {}

      return docList;
    } catch (e) {}
    return defaultDoctors;
  });

  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem('vaultcare_admin_patients');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultPatients;
  });

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('vaultcare_admin_reviews');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultReviews;
  });

  const [sharedAccess, setSharedAccess] = useState(() => {
    try {
      const saved = localStorage.getItem('vaultcare_shared_access');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Save sharedAccess whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('vaultcare_shared_access', JSON.stringify(sharedAccess));
    } catch (e) {}
  }, [sharedAccess]);

  const grantDoctorAccess = (patientEmail, patientName, doctorEmail) => {
    if (!patientEmail || !doctorEmail) return;
    const pEmail = patientEmail.toLowerCase().trim();
    const dEmail = doctorEmail.toLowerCase().trim();

    setSharedAccess(prev => {
      if (prev.some(sa => sa.patientEmail === pEmail && sa.doctorEmail === dEmail)) {
        return prev;
      }
      return [...prev, { patientEmail: pEmail, patientName: patientName || 'Patient', doctorEmail: dEmail, grantedAt: new Date().toISOString() }];
    });
  };

  const revokeDoctorAccess = (patientEmail, doctorEmail) => {
    if (!patientEmail || !doctorEmail) return;
    const pEmail = patientEmail.toLowerCase().trim();
    const dEmail = doctorEmail.toLowerCase().trim();
    setSharedAccess(prev => prev.filter(sa => !(sa.patientEmail === pEmail && sa.doctorEmail === dEmail)));
  };

  // Load persistent user data on mount & userKey change
  useEffect(() => {
    let isMounted = true;

    // Synchronize appointments from PostgreSQL backend
    const syncAppointments = async () => {
      try {
        const role = user?.role || 'patient';
        const endpoint = role === 'doctor' 
          ? `http://localhost:5000/api/appointments/doctor/${userKey}`
          : `http://localhost:5000/api/appointments/patient/${userKey}`;
        
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.appointments)) {
            if (isMounted) {
              setAppointments(data.appointments);
              localStorage.setItem(`vaultcare_appts_${userKey}`, JSON.stringify(data.appointments));
            }
          }
        }
      } catch (e) {}
    };

    syncAppointments();

    const syncFromIndexedDB = async () => {
      try {
        const savedMeta = localStorage.getItem(`vaultcare_reports_${userKey}`);
        const dbReports = await getAllReportsFromIndexedDB(userKey);

        if (!isMounted) return;

        if (dbReports && dbReports.length > 0) {
          setReports(dbReports);
        } else if (savedMeta) {
          try {
            const parsed = JSON.parse(savedMeta);
            setReports(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setReports([]);
          }
        } else if (isDemoAccount) {
          setReports(defaultReports);
        } else {
          setReports([]);
        }
      } catch (e) {
        if (isMounted) setReports([]);
      }
    };

    syncFromIndexedDB();

    return () => { isMounted = false; };
  }, [userKey, user?.role]);

  useEffect(() => {
    try {
      const metadataOnly = reports.map(r => {
        const copy = { ...r };
        if (copy.fileUrl && copy.fileUrl.length > 500000) {
          delete copy.fileUrl;
        }
        return copy;
      });
      localStorage.setItem(`vaultcare_reports_${userKey}`, JSON.stringify(metadataOnly));
    } catch (e) {}
  }, [reports, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`vaultcare_appts_${userKey}`, JSON.stringify(appointments));
    } catch (e) {}
  }, [appointments, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem('vaultcare_admin_doctors', JSON.stringify(doctors));
      localStorage.setItem('vaultcare_doctors', JSON.stringify(doctors));
    } catch (e) {}
  }, [doctors]);

  useEffect(() => {
    try {
      localStorage.setItem('vaultcare_admin_patients', JSON.stringify(patients));
    } catch (e) {}
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem('vaultcare_admin_reviews', JSON.stringify(reviews));
    } catch (e) {}
  }, [reviews]);

  const addReport = async (newReport) => {
    const reportWithKey = { ...newReport, userKey };
    setReports((prev) => [reportWithKey, ...prev]);
    await saveReportToIndexedDB(reportWithKey);
  };

  const deleteReport = async (id) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    await deleteReportFromIndexedDB(id);
  };

  const addAppointment = async (newAppt) => {
    const appointmentObj = {
      ...newAppt,
      patientEmail: newAppt.patientEmail || userKey,
      patientName: newAppt.patientName || user?.fullName || user?.name || userKey.split('@')[0],
      userKey
    };

    setAppointments((prev) => {
      const updated = [appointmentObj, ...prev.filter(a => a.id !== appointmentObj.id)];
      try {
        localStorage.setItem(`vaultcare_appts_${userKey}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Save to PostgreSQL backend
    try {
      await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentObj)
      });
    } catch (e) {}
  };

  const updateAppointment = async (id, updatedFields) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updatedFields } : a));
      try {
        localStorage.setItem(`vaultcare_appts_${userKey}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Sync to PostgreSQL backend
    try {
      await fetch(`http://localhost:5000/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (e) {}
  };

  const cancelAppointment = async (id) => {
    await updateAppointment(id, { status: 'Cancelled' });
  };

  const addReview = (newReview) => {
    setReviews((prev) => {
      const updated = [newReview, ...prev];
      try {
        localStorage.setItem('vaultcare_admin_reviews', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const addDoctor = (newDoc) => {
    setDoctors((prev) => {
      const targetEmail = (newDoc.email || '').toLowerCase().trim();
      if (prev.some((d) => (d.email || '').toLowerCase().trim() === targetEmail)) {
        return prev.map((d) => ((d.email || '').toLowerCase().trim() === targetEmail ? { ...d, ...newDoc } : d));
      }
      const updated = [newDoc, ...prev];
      try {
        localStorage.setItem('vaultcare_admin_doctors', JSON.stringify(updated));
        localStorage.setItem('vaultcare_doctors', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateDoctorDetails = (docEmailOrId, updatedFields) => {
    if (!docEmailOrId) return;
    const targetKey = String(docEmailOrId).toLowerCase().trim();

    setDoctors((prev) => {
      let found = false;
      const updated = prev.map((d) => {
        const dEmail = (d.email || '').toLowerCase().trim();
        const dId = String(d.id || '').toLowerCase().trim();
        if (dEmail === targetKey || dId === targetKey) {
          found = true;
          return {
            ...d,
            ...updatedFields,
            status: updatedFields.status || 'Pending',
            verificationStatus: (updatedFields.verificationStatus || updatedFields.status || 'PENDING').toUpperCase()
          };
        }
        return d;
      });

      if (!found) {
        const newDoctorRecord = {
          id: 'DOC-' + Date.now(),
          email: targetKey,
          name: updatedFields.name || `Dr. ${targetKey.split('@')[0]}`,
          status: 'Pending',
          verificationStatus: 'PENDING',
          ...updatedFields
        };
        updated.unshift(newDoctorRecord);
      }

      try {
        localStorage.setItem('vaultcare_admin_doctors', JSON.stringify(updated));
        localStorage.setItem('vaultcare_doctors', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });
  };

  const updateDoctorStatus = (docId, newStatus) => {
    setDoctors((prev) => {
      const updated = prev.map((d) =>
        d.id === docId ? { ...d, status: newStatus, verificationStatus: newStatus.toUpperCase() } : d
      );
      try {
        localStorage.setItem('vaultcare_admin_doctors', JSON.stringify(updated));
        localStorage.setItem('vaultcare_doctors', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const issuePrescriptionAndCompleteAppointment = async (apptId, prescriptionPayload) => {
    if (!apptId) return;

    setAppointments((prev) => {
      const updated = prev.map((a) => {
        if (a.id === apptId) {
          return {
            ...a,
            status: 'Completed',
            prescription: prescriptionPayload
          };
        }
        return a;
      });
      try {
        localStorage.setItem('vaultcare_global_all_appointments', JSON.stringify(updated));
        localStorage.setItem(`vaultcare_appts_${userKey}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    const patientKey = (prescriptionPayload.patientEmail || '').toLowerCase().trim();
    if (patientKey) {
      const newReport = {
        id: 'REP-PRESCR-' + Date.now(),
        userKey: patientKey,
        title: `Official Prescription - ${prescriptionPayload.diagnosis || 'OPD Consultation'}`,
        category: 'Prescription',
        date: new Date().toISOString().split('T')[0],
        facility: prescriptionPayload.hospital || 'VaultCare AI Clinic',
        status: 'Processed',
        fileName: `Prescription_${(prescriptionPayload.doctorName || 'Doctor').replace(/\s+/g, '_')}_${Date.now()}.pdf`,
        fileSize: '1.2 MB',
        prescriptionDetails: prescriptionPayload
      };

      setReports((prev) => {
        const updatedReports = [newReport, ...prev];
        try {
          localStorage.setItem(`vaultcare_reports_${patientKey}`, JSON.stringify(updatedReports));
        } catch (e) {}
        return updatedReports;
      });

      await saveReportToIndexedDB(newReport);
    }
  };

  const togglePatientStatus = (patientId) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId
          ? { ...p, status: p.status === 'Active' ? 'Suspended' : 'Active' }
          : p
      )
    );
  };

  const deleteReview = (reviewId) => {
    setReviews((prev) => {
      const updatedList = prev.filter((r) => r.id !== reviewId);
      try {
        localStorage.setItem('vaultcare_admin_reviews', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });
  };

  return(
    <VaultContext.Provider
    value={{
        reports,
        appointments,
        doctors,
        patients,
        reviews,
        sharedAccess,
        grantDoctorAccess,
        revokeDoctorAccess,
        addReport,
        deleteReport,
        addAppointment,
        updateAppointment,
        cancelAppointment,
        addReview,
        addDoctor,
        updateDoctorDetails,
        updateDoctorStatus,
        issuePrescriptionAndCompleteAppointment,
        togglePatientStatus,
        deleteReview
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => useContext(VaultContext);





    