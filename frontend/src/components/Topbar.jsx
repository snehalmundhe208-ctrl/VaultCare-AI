import React, { useState, useRef, useEffect } from 'react';
import { Bell, Globe, Check, Clock, FileText, ShieldCheck, Calendar, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';

export default function Topbar({ title }) {
  const { user, role, language, setLanguage, t } = useAuth();
  const vault = useVault ? useVault() : {};
  const doctors = vault?.doctors || [];
  const appointments = vault?.appointments || [];
  const reports = vault?.reports || [];

  const [showNotifications, setShowNotifications] = useState(false);
  const currentRole = (user?.role || role || 'patient').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase().trim();
  const userName = user?.fullName || 'User';
  const userKey = userEmail || 'guest';

  const getUserNotifications = () => {
    // 1. Read per-user persisted notifications from localStorage
    try {
      const savedKey = `vaultcare_notifications_${userKey}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-attach Lucide component references based on stored icon names
          return parsed.map(n => ({
            ...n,
            icon: n.iconType === 'ShieldCheck' ? ShieldCheck : n.iconType === 'Clock' ? Clock : n.iconType === 'FileText' ? FileText : Calendar
          }));
        }
      }
    } catch (e) {}

    // 2. Generate user-isolated initial notifications for logged-in user
    if (currentRole === 'doctor') {
      const matchedDoc = doctors.find(d => d.email && d.email.toLowerCase() === userEmail);
      const status = (matchedDoc?.verificationStatus || matchedDoc?.status || 'NOT_SUBMITTED').toUpperCase();

      if (status === 'APPROVED') {
        const myAppts = appointments.filter(a => a.doctorEmail?.toLowerCase() === userEmail || (userName && a.doctor?.toLowerCase() === userName.toLowerCase()));
        return [
          {
            id: 'doc-1',
            title: 'NMC Medical License Active',
            desc: `Dr. ${userName}, your practitioner license #${matchedDoc?.license || 'NMC-LICENSE'} is verified.`,
            time: 'Just now',
            unread: true,
            icon: ShieldCheck,
            iconType: 'ShieldCheck',
            iconBg: 'bg-emerald-50 text-emerald-600'
          },
          {
            id: 'doc-2',
            title: 'OPD Schedule Ready',
            desc: myAppts.length > 0 ? `You have ${myAppts.length} active consultation appointment(s) in your queue.` : 'Your OPD slots are open for patient booking.',
            time: '1 hour ago',
            unread: true,
            icon: Calendar,
            iconType: 'Calendar',
            iconBg: 'bg-blue-50 text-blue-600'
          }
        ];
      } else if (status === 'PENDING') {
        return [
          {
            id: 'doc-1',
            title: 'Verification Request Under Review',
            desc: `Credentials submitted for Dr. ${userName} are awaiting Admin Board approval.`,
            time: 'Just now',
            unread: true,
            icon: Clock,
            iconType: 'Clock',
            iconBg: 'bg-amber-50 text-amber-600'
          }
        ];
      } else {
        return [
          {
            id: 'doc-1',
            title: 'License Verification Required',
            desc: `Welcome Dr. ${userName}. Please submit your medical license to access doctor portal features.`,
            time: 'Just now',
            unread: true,
            icon: FileText,
            iconType: 'FileText',
            iconBg: 'bg-blue-50 text-blue-600'
          }
        ];
      }
    }

    if (currentRole === 'admin') {
      const pendingDocs = doctors.filter(d => (d.verificationStatus || d.status || '').toUpperCase() === 'PENDING');
      return [
        {
          id: 'admin-1',
          title: 'Admin Security Sync',
          desc: 'VaultCare AI encryption policies & user data isolation operational.',
          time: 'Just now',
          unread: true,
          icon: ShieldCheck,
          iconType: 'ShieldCheck',
          iconBg: 'bg-purple-50 text-purple-600'
        },
        {
          id: 'admin-2',
          title: pendingDocs.length > 0 ? `${pendingDocs.length} Pending Doctor Verification(s)` : 'System Operational',
          desc: pendingDocs.length > 0 ? `${pendingDocs.length} practitioner verification request(s) in review queue.` : 'All registered doctors verified.',
          time: '15 min ago',
          unread: pendingDocs.length > 0,
          icon: Clock,
          iconType: 'Clock',
          iconBg: 'bg-amber-50 text-amber-600'
        }
      ];
    }

    // Patient User-Specific Notifications
    const myAppts = appointments.filter(a => a.patientEmail?.toLowerCase() === userEmail || (userKey && a.userKey === userKey));
    const myReports = reports.filter(r => r.userKey === userKey || r.patientEmail === userEmail);

    const list = [];
    if (myAppts.length > 0) {
      const nextAppt = myAppts[0];
      list.push({
        id: 'pat-1',
        title: 'Upcoming Consultation',
        desc: `Appointment scheduled with ${nextAppt.doctor || 'Doctor'} on ${nextAppt.date || 'upcoming date'} at ${nextAppt.time || '10:00 AM'}.`,
        time: '10 min ago',
        unread: true,
        icon: Calendar,
        iconType: 'Calendar',
        iconBg: 'bg-blue-50 text-blue-600'
      });
    }

    if (myReports.length > 0) {
      const lastRep = myReports[0];
      list.push({
        id: 'pat-2',
        title: 'Report Vault Synced',
        desc: `Report "${lastRep.title || 'Medical File'}" encrypted & analyzed by VaultCare AI.`,
        time: '30 min ago',
        unread: true,
        icon: FileText,
        iconType: 'FileText',
        iconBg: 'bg-emerald-50 text-emerald-600'
      });
    }

    list.push({
      id: 'pat-3',
      title: 'HealthVault Security Active',
      desc: `Welcome ${userName}. Your health records are encrypted with 256-bit SHA.`,
      time: 'Just now',
      unread: false,
      icon: ShieldCheck,
      iconType: 'ShieldCheck',
      iconBg: 'bg-purple-50 text-purple-600'
    });

    return list;
  };

  const [notifications, setNotifications] = useState(getUserNotifications);

  useEffect(() => {
    setNotifications(getUserNotifications());
  }, [userEmail, currentRole, doctors.length, appointments.length, reports.length]);

  const saveNotifications = (updated) => {
    setNotifications(updated);
    try {
      localStorage.setItem(`vaultcare_notifications_${userKey}`, JSON.stringify(updated.map(n => ({
        id: n.id,
        title: n.title,
        desc: n.desc,
        time: n.time,
        unread: n.unread,
        iconType: n.iconType || 'FileText',
        iconBg: n.iconBg
      }))));
    } catch (e) {}
  };

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    saveNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const removeNotification = (id) => {
    saveNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <header className="w-full bg-white border-b border-[#E5E0D5] shadow-[0_2px_10px_rgba(0,0,0,0.03)] px-8 py-6 sticky top-0 z-30 select-none">
      <div className="flex items-center justify-between w-full min-h-[44px]">
        
        {/* Left: Page Title */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-black tracking-tight capitalize leading-none">
            {title || t('dashboard')}
          </h1>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>

          {/* VaultCare Score Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF5EC] border border-[#E3CF9B] shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            <span className="text-xs font-semibold text-[#916D41] whitespace-nowrap">
              {t('vaultScore')}: <span className="font-extrabold text-[#C9A574] text-xs ml-0.5">84/100</span>
            </span>
          </div>

          {/* Interactive Bell Icon & Dropdown Trigger */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications & Reminders"
              className="relative p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] text-[#555555] hover:text-black hover:bg-[#F4F0E8] rounded-full transition-all cursor-pointer flex-shrink-0 flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl border border-[#E5E0D5] shadow-2xl z-50 overflow-hidden animate-fadeIn">
                
                {/* Header */}
                <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D5] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#C9A574]" />
                    <h3 className="text-sm font-extrabold text-black">Notifications & Reminders</h3>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-[#916D41] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[#F0EEE8]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Sparkles className="w-6 h-6 text-gray-300 mx-auto" />
                      <p className="text-xs font-bold text-gray-500">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div 
                          key={item.id} 
                          className={`p-4 flex items-start gap-3 hover:bg-[#FAF8F5] transition-colors relative group ${
                            item.unread ? 'bg-[#FAF5EC]/40' : ''
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 font-bold shadow-xs mt-0.5`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between pr-4">
                              <h4 className="text-xs font-extrabold text-black">{item.title}</h4>
                              <span className="text-[10px] text-gray-400 font-semibold">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-600 font-medium leading-tight">
                              {item.desc}
                            </p>
                          </div>

                          {item.unread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5"></span>
                          )}

                          <button
                            onClick={() => removeNotification(item.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 transition-opacity p-1 cursor-pointer"
                            title="Dismiss"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 bg-[#FAF8F5] border-t border-[#E5E0D5] text-center">
                  <span className="text-[11px] font-bold text-gray-500">
                    VaultCare AI Real-time Notification Dispatcher
                  </span>
                </div>

              </div>
            )}
          </div>

          {/* User AVatar circle */}
          <div classname="flex items-center flex-shrink-0">
            <div classname="w-9 h-9rounded-full bg-[#1A1A1A] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring[#C9A574]">
              {user?.fullName ? user.fullName.charAt(0) : 'P'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
