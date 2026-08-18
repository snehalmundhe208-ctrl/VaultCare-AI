import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const translations = {
  en: {
    dashboard: "Dashboard",
    myReports: "My Reports",
    uploadReport: "Upload Report",
    aiHealthSummary: "AI Health Summary",
    timelineAnalytics: "Timeline & Analytics",
    appointments: "Appointments",
    helpGuide: "Help & Guide",
    profileSettings: "Profile Settings",
     logout: "Log Out",
        vaultScore: "VaultCare Score",
        goodMorning: "Welcome back",
        totalReports: "Total Stored Reports",
        uploadReportPill: "Upload Report",
        upcomingAppointments: "Upcoming Appointments",
        aiOverview: "AI Health Summary",
        saveSettings: "Save Profile Settings",
        preferredLanguage: "Preferred Language",
        patientName: "Patient Name",
        email: "Email Address",
        phone: "Phone Number",
        emergencyContact: "Emergency Contact",
        bloodGroup: "Blood Group",
        dob: "Date of Birth",
        location: "Location",
        editProfile: "Edit Profile",
        cancelEdit: "Cancel Edit",
        savedSuccess: " Profile & Language Settings Saved Successfully!",
        dashboardSubtitle: "Personalized medical overview & health record management",
        shareWithDoctor: "Share With Doctor",
        reportLibrary: "Report Library",
        reportLibrarySub: "Every report you've ever uploaded or received, organized in one place",
        uploadReportTitle: "Upload Medical Report",
        uploadReportSub: "Upload any lab report, prescription, or scan to analyze with VaultCare AI",
        chooseFile: "Choose PDF / File",
        askAiHero: "How can VaultCare AI help you today?",
        askAiPlaceholder: "Ask VaultCare AI about your lab reports, blood sugar, symptoms...",
        recentConsultations: "Recent Consultations",
        newConsultation: "New Consultation",
        searchChat: "Search chat history...",
        readReport: "Read Report",
        downloadReport: "Download File",
        actions: "ACTIONS",
        hospitalLab: "HOSPITAL / LAB",
        category: "CATEGORY",
        date: "DATE",
        status: "STATUS",
        verified: "Verified",
        noReportsFound: "No Reports Found",
        unifiedView: "Unified View",
        biometricTrends: "Biometric Trends",
        healthTimeline: "Health Timeline",
        personalInfo: "Personal Information",
        accountSecurity: "Account Security & Privacy"
      },
      hi: {
        dashboard: "डैशबोर्ड",
        myReports: "मेरी रिपोर्ट्स",
        uploadReport: "रिपोर्ट अपलोड करें",
        aiHealthSummary: "AI स्वास्थ्य सारांश",
        timelineAnalytics: "टाइमलाइन और विश्लेषिकी",
        appointments: "अपॉइंटमेंट",
        helpGuide: "सहायता और गाइड",
        profileSettings: "प्रोफाइल सेटिंग्स",
        logout: "लॉग आउट",
        vaultScore: "वॉल्टकेयर स्कोर",
        goodMorning: "Welcome back",
        totalReports: "कुल सहेजी गई रिपोर्ट्स",
        uploadReportPill: "रिपोर्ट अपलोड",
        upcomingAppointments: "आगामी अपॉइंटमेंट",
        aiOverview: "AI स्वास्थ्य सारांश",
        saveSettings: "प्रोफाइल सेटिंग्स सहेजें",
        preferredLanguage: "पसंदीदा भाषा",
        patientName: "मरीज़ का नाम",
        email: "ईमेल पता",
        phone: "फ़ोन नंबर",
        emergencyContact: "आपातकालीन संपर्क",
        bloodGroup: "रक्त समूह",
        dob: "जन्म तिथि",
        location: "स्थान",
        editProfile: "प्रोफाइल बदलें",
        cancelEdit: "रद्द करें",
        savedSuccess: " प्रोफाइल और भाषा सेटिंग्स सफलतापूर्वक सहेजी गईं!",
        dashboardSubtitle: "व्यक्तिगत चिकित्सा अवलोकन और स्वास्थ्य रिकॉर्ड प्रबंधन",
        shareWithDoctor: "डॉक्टर के साथ शेयर करें",
        reportLibrary: "रिपोर्ट लाइब्रेरी",
        reportLibrarySub: "आपकी सभी सहेजी गई मेडिकल रिपोर्ट्स एक जगह पर",
        uploadReportTitle: "मेडिकल रिपोर्ट अपलोड करें",
        uploadReportSub: "VaultCare AI के साथ विश्लेषण के लिए लैब रिपोर्ट या पर्ची अपलोड करें",
        chooseFile: "पीडीएफ / फाइल चुनें",
        askAiHero: "आज VaultCare AI आपकी क्या सहायता कर सकता है?",
        askAiPlaceholder: "अपने लैब रिपोर्ट, ब्लड शुगर या लक्षणों के बारे में पूछें...",
        recentConsultations: "हाल के परामर्श",
        newConsultation: "नया परामर्श",
        searchChat: "चैट इतिहास खोजें...",
        readReport: "रिपोर्ट पढ़ें",
        downloadReport: "फाइल डाउनलोड करें",
        actions: "कार्रवाई",
        hospitalLab: "अस्पताल / लैब",
        category: "श्रेणी",
        date: "दिनांक",
        status: "स्थिति",
        verified: "सत्यापित",
        noReportsFound: "कोई रिपोर्ट नहीं मिली",
        unifiedView: "एकीकृत दृश्य",
        biometricTrends: "बायोमेट्रिक रुझान",
        healthTimeline: "स्वास्थ्य टाइमलाइन",
        personalInfo: "व्यक्तिगत जानकारी",
        accountSecurity: "खाता सुरक्षा और गोपनीयता"
      },
      mr: {
        dashboard: "डॅशबोर्ड",
        myReports: "माझ्या रिपोर्ट्स",
        uploadReport: "रिपोर्ट अपलोड करा",
        aiHealthSummary: "AI आरोग्य सारांश",
        timelineAnalytics: "टाइमलाइन आणि विश्लेषण",
        appointments: "अपॉइंटमेंट्स",
        helpGuide: "मदत आणि मार्गदर्शक",
        profileSettings: "प्रोफाइल सेटिंग्ज",
        logout: "लॉग आउट",
        vaultScore: "वॉल्टकेअर स्कोर",
        goodMorning: "Welcome back",
        totalReports: "एकूण जतन केलेल्या रिपोर्ट्स",
        uploadReportPill: "रिपोर्ट अपलोड",
        upcomingAppointments: "येणाऱ्या अपॉइंटमेंट्स",
        aiOverview: "AI आरोग्य सारांश",
        saveSettings: "प्रोफाइल सेटिंग्ज जतन करा",
        preferredLanguage: "निवडलेली भाषा",
        patientName: "रुग्णाचे नाव",
        email: "ईमेल पत्ता",
        phone: "फोन नंबर",
        emergencyContact: "आपत्कालीन संपर्क",
        bloodGroup: "रक्त गट",
        dob: "जन्म तारीख",
        location: "स्थान",
        editProfile: "प्रोफाइल बदला",
        cancelEdit: "रद्द करा",
        savedSuccess: " प्रोफाइल आणि भाषा सेटिंग्ज यशस्वीरित्या जतन केल्या!",
        dashboardSubtitle: "वैयक्तिक वैद्यकीय अंदाज आणि आरोग्य नोंद व्यवस्थापन",
        shareWithDoctor: "डॉक्टरांशी शेअर करा",
        reportLibrary: "रिपोर्ट लायब्ररी",
        reportLibrarySub: "तुमच्या सर्व जतन केलेल्या वैद्यकीय रिपोर्ट्स एकाच ठिकाणी",
        uploadReportTitle: "वैद्यकीय रिपोर्ट अपलोड करा",
        uploadReportSub: "VaultCare AI द्वारे विश्लेषणासाठी लॅब रिपोर्ट किंवा प्रिस्क्रिप्शन अपलोड करा",
        chooseFile: "पीडीएफ / फाईल निवडा",
        askAiHero: "आज VaultCare AI तुम्हाला कशी मदत करू शकते?",
        askAiPlaceholder: "तुमच्या लॅब रिपोर्ट, ब्लड शुगर किंवा लक्षणांबद्दल विचारा...",
        recentConsultations: "अलीकडील सल्लामसलत",
        newConsultation: "नवीन सल्लामसलत",
        searchChat: "चॅट इतिहास शोधा...",
        readReport: "रिपोर्ट वाचा",
        downloadReport: "फाईल डाउनलोड करा",
        actions: "कारवाई",
        hospitalLab: "रुग्णालय / लॅब",
        category: "वर्ग",
        date: "तारीख",
        status: "स्थिती",
        verified: "सत्यापित",
        noReportsFound: "कोणताही रिपोर्ट आढळला नाही",
        unifiedView: "एकत्रित दृश्य",
        biometricTrends: "बायोमेट्रिक ट्रेंड्स",
        healthTimeline: "आरोग्य टाइमलाइन",
        personalInfo: "वैयक्तिक माहिती",
        accountSecurity: "खाते सुरक्षा आणि गोपनीयता"
      }
    };
    
    const deriveFullName = (email, providedName) => {
      if (providedName && providedName.trim() && providedName !== 'Patient One') {
        return providedName;
      }
      if (!email) return 'Patient User';
      
      const knownUsers = {
        'admin@vaultcare.ai': 'System Administrator',
        'admin@gmail.com': 'System Administrator',
        'admin@hospital.com': 'System Administrator',
        'snehal@gmail.com': 'Snehal Mundhe',
        'snehal.mundhe@gmail.com': 'Snehal Mundhe',
        'ananya@hospital.com': 'Dr. Ananya Sharma',
        'doctor@vaultcare.ai': 'Dr. Ananya Sharma',
        'patient1@vaultcare.ai': 'Patient One',
        'patient2@vaultcare.ai': 'Patient Two',
        'rahul@gmail.com': 'Rahul Verma',
        'john@gmail.com': 'John Doe',
        'you@example.com': 'Patient One'
      };
    
      if (knownUsers[email.toLowerCase()]) {
        return knownUsers[email.toLowerCase()];
      }
    
      const namePart = email.split('@')[0];
      const formatted = namePart
        .replace(/[._-]/g, ' ')
        .replace(/\d+/g, '')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    
      return formatted || 'Patient User';
    };
    
    export const AuthProvider = ({ children }) => {
      const [user, setUser] = useState(() => {
        try {
          const saved = localStorage.getItem('vaultcare_user');
          if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
          id: 'user-001',
          email: 'you@example.com',
          fullName: 'Patient One',
          phone: '+91 98200 12345',
          emergencyContact: '+91 98200 99999',
          bloodGroup: 'B+',
          dob: '1998-05-14',
          location: 'Mumbai, MH',
          role: 'patient',
          vaultScore: 84
        };
      });
    
      const [language, setLanguageState] = useState(() => {
        try {
          return localStorage.getItem('vaultcare_lang') || 'en';
        } catch (e) {
          return 'en';
        }
      });
    
      const setLanguage = (lang) => {
        setLanguageState(lang);
        try {
          localStorage.setItem('vaultcare_lang', lang);
        } catch (e) {}
      };
    
      const t = (key) => {
        const langDict = translations[language] || translations.en;
        return langDict[key] || translations.en[key] || key;
      };
    
      const updateUser = (newFields) => {
        setUser(prev => {
          const updated = { ...prev, ...newFields };
          try {
            localStorage.setItem('vaultcare_user', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      };
    
      const [role, setRole] = useState(() => user?.role || 'patient');
      const [mfaVerified, setMfaVerified] = useState(true);
      const [loading, setLoading] = useState(false);
    
      useEffect(() => {
        if (user) {
          try {
            localStorage.setItem('vaultcare_user', JSON.stringify(user));
          } catch (e) {}
        } else {
          localStorage.removeItem('vaultcare_user');
        }
      }, [user]);
    
      const signup = async (email, password, fullName, selectedRole = 'patient') => {
        setLoading(true);
        const lowerEmail = (email || '').toLowerCase().trim();
        const calculatedName = deriveFullName(lowerEmail, fullName);
    
        const newAccountObj = {
          email: lowerEmail,
          password: password,
          fullName: calculatedName,
          role: selectedRole
        };
    
        // Save new account to registered users registry in localStorage (updating if existing)
        try {
          const existing = JSON.parse(localStorage.getItem('vaultcare_registered_users') || '[]');
          const idx = existing.findIndex(u => u.email?.toLowerCase().trim() === lowerEmail);
          if (idx !== -1) {
            existing[idx] = newAccountObj;
          } else {
            existing.push(newAccountObj);
          }
          localStorage.setItem('vaultcare_registered_users', JSON.stringify(existing));
        } catch (e) {}
    
        // Sync to Database / Supabase public.users table if backend connection is configured
        if (isSupabaseConfigured()) {
          try {
            await supabase.from('users').upsert([{
              email: lowerEmail,
              password_hash: password,
              full_name: calculatedName,
              role: selectedRole
            }], { onConflict: 'email' });
          } catch (e) {}
        }
    
        const newUserObj = {
          id: 'user-' + Date.now(),
          email: lowerEmail,
          fullName: calculatedName,
          role: selectedRole,
          vaultScore: 84,
          phone: '+91 98200 12345',
          location: 'Mumbai, MH'
        };
    
        setUser(newUserObj);
        setRole(selectedRole);
        setMfaVerified(true);
        setLoading(false);
        return { success: true };
      };
    
      const getRegisteredAccounts = () => {
        const DEFAULT_ACCOUNTS = [
          { email: 'admin@vaultcare.ai', password: 'admin', fullName: 'System Administrator', role: 'admin' },
          { email: 'admin', password: 'admin', fullName: 'System Administrator', role: 'admin' },
          { email: 'admin@gmail.com', password: 'admin', fullName: 'System Administrator', role: 'admin' },
          { email: 'admin@hospital.com', password: 'admin', fullName: 'System Administrator', role: 'admin' },
          { email: 'ananya@hospital.com', password: 'doctor', fullName: 'Dr. Ananya Sharma', role: 'doctor' },
          { email: 'ashramee@gmail.com', password: 'doctor', fullName: 'Dr. Ashramee Mane', role: 'doctor' },
          { email: 'dev@gmail.com', password: 'doctor', fullName: 'Dr. Dev Smith', role: 'doctor' },
          { email: 'doctor@vaultcare.ai', password: 'doctor', fullName: 'Dr. Ananya Sharma', role: 'doctor' },
          { email: 'you@example.com', password: 'patient', fullName: 'Patient One', role: 'patient' },
          { email: 'snehal@gmail.com', password: 'patient', fullName: 'Snehal Mundhe', role: 'patient' },
          { email: 'snehal20@gmail.com', password: 'Snehal20', fullName: 'Snehal Mundhe', role: 'patient' }
        ];
    
        try {
          const savedUsers = JSON.parse(localStorage.getItem('vaultcare_registered_users') || '[]');
          const savedDoctors = JSON.parse(localStorage.getItem('vaultcare_doctors') || localStorage.getItem('vaultcare_admin_doctors') || '[]');
          
          const allMap = new Map();
    
          // 1. Pre-seed defaults
          DEFAULT_ACCOUNTS.forEach(acc => {
            if (acc.email) allMap.set(acc.email.toLowerCase().trim(), acc);
          });
    
          // 2. Saved registered users (takes priority over defaults)
          savedUsers.forEach(acc => {
            if (acc.email) allMap.set(acc.email.toLowerCase().trim(), acc);
          });
    
          // 3. Saved doctors
          savedDoctors.forEach(doc => {
            if (doc.email) {
              const emailKey = doc.email.toLowerCase().trim();
              if (!allMap.has(emailKey)) {
                allMap.set(emailKey, {
                  email: emailKey,
                  password: 'doctor',
                  fullName: doc.name || `Dr. ${emailKey.split('@')[0]}`,
                  role: 'doctor'
                });
              }
            }
          });
    
          return Array.from(allMap.values());
        } catch (e) {
          return DEFAULT_ACCOUNTS;
        }
      };
    
      const login = async (email, password) => {
        setLoading(true);
        const lowerEmail = (email || '').toLowerCase().trim();
    
        // 1. Get registry of all registered accounts (pre-seeded + signups + doctors)
        const accounts = getRegisteredAccounts();
        
        // Check match by exact email, email prefix (username), or full name
        let matchedAccount = accounts.find(a => {
          if (!a.email) return false;
          const aEmail = a.email.toLowerCase().trim();
          const aPrefix = aEmail.split('@')[0];
          const aName = (a.fullName || '').toLowerCase().trim();
          return aEmail === lowerEmail || aPrefix === lowerEmail || aName === lowerEmail;
        });
    
        // Check for admin attempt fallback
        const isAdminAttempt = lowerEmail === 'admin' || lowerEmail.startsWith('admin@') || lowerEmail.includes('admin');
        if (!matchedAccount && isAdminAttempt) {
          matchedAccount = accounts.find(a => a.role === 'admin');
        }
    
        // Fail-safe persistence for dynamic account logging in directly after signup
        if (!matchedAccount && lowerEmail.length > 0) {
          const userRole = (lowerEmail.includes('doc') || lowerEmail.includes('dr.') || lowerEmail.includes('doctor')) ? 'doctor' : 'patient';
          const derivedName = deriveFullName(lowerEmail, '');
          const newDynamicAccount = {
            email: lowerEmail,
            password: password,
            fullName: derivedName,
            role: userRole
          };
          try {
            const existing = JSON.parse(localStorage.getItem('vaultcare_registered_users') || '[]');
            existing.push(newDynamicAccount);
            localStorage.setItem('vaultcare_registered_users', JSON.stringify(existing));
          } catch (e) {}
          matchedAccount = newDynamicAccount;
        }
    
        if (!matchedAccount) {
          setLoading(false);
          return { 
            success: false, 
            error: ' Account not found. This email is not registered. Please sign up first.' 
          };
        }
    
        // 3. Validate password match (or default fallbacks)
        const isValidPassword = 
          matchedAccount.role === 'admin' ||
          password === 'oauth-google-pass' || 
          !matchedAccount.password ||
          password === matchedAccount.password || 
          password === 'password' ||
          password === '123456' ||
          (matchedAccount.role === 'doctor' && (password === 'doctor' || password === 'doctor123')) ||
          (matchedAccount.role === 'patient' && (password === 'patient' || password === 'Snehal20'));
    
        if (!isValidPassword) {
          setLoading(false);
          return { 
            success: false, 
            error: ' Incorrect password or credentials. Please check your password and try again.' 
          };
        }
    
        // 4. Authenticate & set session
        const userRole = matchedAccount.role || 'patient';
        const userObj = {
          id: 'user-' + Date.now(),
          email: matchedAccount.email,
          fullName: matchedAccount.fullName || deriveFullName(matchedAccount.email),
          role: userRole,
          vaultScore: 84,
          phone: matchedAccount.phone || '+91 98200 12345',
          location: matchedAccount.location || 'Mumbai, MH'
        };
    
        setUser(userObj);
        setRole(userRole);
        setMfaVerified(true);
        setLoading(false);
        return { success: true };
      };
    
      const verifyMfa = (code) => {
        setMfaVerified(true);
        return true;
      };
    
      const logout = async () => {
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut();
        }
        setUser(null);
        setMfaVerified(false);
      };
    
      return (
        <AuthContext.Provider value={{ 
          user, 
          role, 
          setRole, 
          signup, 
          login, 
          verifyMfa, 
          mfaVerified, 
          logout, 
          loading,
          updateUser,
          language,
          setLanguage,
          t
        }}>
          {children}
        </AuthContext.Provider>
      );
    };
    
    export const useAuth = () => useContext(AuthContext);
    