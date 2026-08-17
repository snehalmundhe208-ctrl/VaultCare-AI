import React { useState, useEffect } from 'react';
import { Send, MoreVertical, ShieldAlert, UserX, Check, Clock, User, Stethoscope, Search, MessageSquare, AlertCircle, Paperclip, FileText, Download, ShieldCheck, FileCheck, Eye, CornerUpLeft, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { 
  saveMessageToStorage, 
  getMessagesFromStorage, 
  getAllUserConversationsFromStorage,
  blockUserInStorage, 
  unblockUserInStorage, 
  isUserBlockedInStorage, 
  reportUserInStorage 
} from '../services/chatStorage';

export default function ChatWindow() {
  const { user } = useAuth();
  const { doctors, appointments, sharedAccess, grantDoctorAccess } = useVault();

  const currentRole = (user?.role || 'patient').toLowerCase();
  const currentEmail = (user?.email || '').toLowerCase().trim();
  const currentName = user?.fullName || 'User';

  const [contactsList, setContactsList] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Message Reply State
  const [replyingTo, setReplyingTo] = useState(null);

  // Three-Dot Menu & Modals State
  const [showMenu, setShowMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Language');
  const [reportDetails, setReportDetails] = useState('');

  // Attachment Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const menuRef = useRef(null);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load contacts list based on role & authenticated user history
  useEffect(() => {
    if (!currentEmail) return;

    const loadContacts = async () => {
      const allUserMsgs = await getAllUserConversationsFromStorage(currentEmail);

      if (currentRole === 'doctor') {
        const patientMap = new Map();

        // 1. Check appointments for this doctor
        (appointments || []).forEach(a => {
          const docEmail = (a.doctorEmail || '').toLowerCase().trim();
          const docName = (a.doctor || '').toLowerCase();
          if (docEmail === currentEmail || (currentName && docName.includes(currentName.toLowerCase()))) {
            const pEmail = (a.patientEmail || `${(a.patientName || 'patient').toLowerCase().replace(/\s+/g, '')}@gmail.com`).toLowerCase().trim();
            if (!patientMap.has(pEmail)) {
              patientMap.set(pEmail, {
                id: pEmail,
                email: pEmail,
                name: a.patientName || 'Patient User',
                role: 'patient',
                subtext: `Appointment: ${a.date || 'Scheduled'}`
              });
            }
          }
        });

        // 2. Check patients who shared medical access with this doctor
        (sharedAccess || []).forEach(sa => {
          const docEmail = (sa.doctorEmail || '').toLowerCase().trim();
          if (docEmail === currentEmail) {
            const pEmail = (sa.patientEmail || '').toLowerCase().trim();
            if (pEmail && !patientMap.has(pEmail)) {
              patientMap.set(pEmail, {
                id: pEmail,
                email: pEmail,
                name: sa.patientName || 'Patient User',
                role: 'patient',
                subtext: 'Vault Access Granted'
              });
            }
          }
        });

        // 3. Check message history involving this doctor
        allUserMsgs.forEach(m => {
          const otherEmail = m.senderEmail === currentEmail ? m.receiverEmail : m.senderEmail;
          if (otherEmail && !patientMap.has(otherEmail)) {
            patientMap.set(otherEmail, {
              id: otherEmail,
              email: otherEmail,
              name: otherEmail.split('@')[0].replace('.', ' ').toUpperCase(),
              role: 'patient',
              subtext: 'Patient User'
            });
          }
        });

        const list = Array.from(patientMap.values());
        setContactsList(list);
        if (list.length > 0 && !activeContact) {
          setActiveContact(list[0]);
        }
      } else {
        // Patient View: Get ALL approved/active doctors from VaultContext
        const approved = (doctors || []).filter(d => {
          const st = (d.verificationStatus || d.status || '').toUpperCase();
          return st === 'APPROVED' || st === 'ACTIVE';
        });

        const list = approved.map((doc, idx) => {
          const email = (doc.email || `doc-${idx}@hospital.com`).toLowerCase().trim();
          return {
            id: email,
            email: email,
            name: doc.name || 'Dr. Practitioner',
            specialty: doc.specialty || 'General Practitioner',
            hospital: doc.hospital || 'Medical Center',
            role: 'doctor',
            subtext: doc.specialty ? `${doc.specialty} • ${doc.hospital || 'VaultCare'}` : 'Medical Specialist'
          };
        });

        setContactsList(list);
        if (list.length > 0 && !activeContact) {
          setActiveContact(list[0]);
        }
      }
    };

    loadContacts();
  }, [currentEmail, currentRole, doctors.length, appointments.length, sharedAccess?.length]);

  // Load chat messages & block status when active contact changes
  useEffect(() => {
    if (!activeContact || !currentEmail) return;

    let isMounted = true;
    const loadChatData = async () => {
      const history = await getMessagesFromStorage(currentEmail, activeContact.email);
      if (isMounted) {
        setMessages(history);
      }

      const docEmail = currentRole === 'doctor' ? currentEmail : activeContact.email;
      const patEmail = currentRole === 'doctor' ? activeContact.email : currentEmail;
      const blocked = await isUserBlockedInStorage(docEmail, patEmail);
      if (isMounted) {
        setIsBlocked(blocked);
      }
    };

    loadChatData();
    return () => { isMounted = false; };
  }, [activeContact?.email, currentEmail, currentRole]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close 3-dot dropdown menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact || isBlocked) return;

    const newMsg = {
      id: 'MSG-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      senderEmail: currentEmail,
      receiverEmail: activeContact.email,
      senderRole: currentRole,
      text: inputText.trim(),
      replyTo: replyingTo ? { text: replyingTo.text, senderName: replyingTo.senderName } : null,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setInputText('');
    setReplyingTo(null);
    setMessages(prev => [...prev, newMsg]);
    await saveMessageToStorage(newMsg);
  };

  // Handle File Attachment Upload on Both Sides (Patient & Doctor)
  const handleFileAttachment = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact || isBlocked) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const attMsg = {
        id: 'MSG-ATT-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        senderEmail: currentEmail,
        receiverEmail: activeContact.email,
        senderRole: currentRole,
        text: `Attached file: ${file.name}`,
        attachment: {
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          fileType: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
          fileData: dataUrl
        },
        timestamp: new Date().toISOString(),
        displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, attMsg]);
      await saveMessageToStorage(attMsg);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Share Vault Access via Chat
  const handleShareVaultAccessInChat = async () => {
    if (!activeContact || currentRole !== 'patient' || isBlocked) return;

    if (grantDoctorAccess) {
      grantDoctorAccess(currentEmail, currentName, activeContact.email);
    }

    const shareMsg = {
      id: 'MSG-VAULT-' + Date.now(),
      senderEmail: currentEmail,
      receiverEmail: activeContact.email,
      senderRole: 'patient',
      text: `SHARED MEDICAL VAULT ACCESS: Patient ${currentName} has granted you encrypted access to view their VaultCare AI health records and lab reports.`,
      isSharedVaultAccess: true,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, shareMsg]);
    await saveMessageToStorage(shareMsg);
    alert(`Medical access granted & shared directly in chat with ${activeContact.name}!`);
  };

  const getMessageAttachment = (m) => {
    if (m.attachment && m.attachment.fileName) return m.attachment;
    if (!m.text) return null;

    if (m.text.includes('Attached file:')) {
      const fname = m.text.replace(/.*Attached file:\s*/i, '').trim();
      const isImg = fname.toLowerCase().endsWith('.jpg') || fname.toLowerCase().endsWith('.jpeg') || fname.toLowerCase().endsWith('.png');
      return {
        fileName: fname,
        fileSize: '1.2 MB',
        fileType: isImg ? 'image' : 'pdf',
        fileData: isImg 
          ? 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' 
          : 'data:application/pdf;base64,JVBERi0xLjQKJ...'
      };
    }

    if (m.text.includes('Medical Record Shared:')) {
      const fname = m.text.replace(/.*Medical Record Shared:\s*/i, '').replace(/.*shared health document\s*/i, '').trim();
      return {
        fileName: fname.endsWith('.pdf') ? fname : `${fname || 'Health_Report'}.pdf`,
        fileSize: '1.4 MB',
        fileType: 'pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
      };
    }

    return null;
  };

  const handleOpenAttachment = (att) => {
    if (!att) return;
    const resolvedAtt = {
      ...att,
      fileData: att.fileData || (att.fileType === 'image' 
        ? 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' 
        : 'data:application/pdf;base64,JVBERi0xLjQKJ...')
    };
    setPreviewAttachment(resolvedAtt);
  };

  const handleDownloadAttachment = (att) => {
    if (!att) return;
    const data = att.fileData || 'data:text/plain;charset=utf-8,VaultCare%20Medical%20Record';
    try {
      const a = document.createElement('a');
      a.href = data;
      a.download = att.fileName || 'VaultCare_Medical_Document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert('Downloading document...');
    }
  };

  const handleToggleBlock = async () => {
    if (!activeContact) return;
    const docEmail = currentRole === 'doctor' ? currentEmail : activeContact.email;
    const patEmail = currentRole === 'doctor' ? activeContact.email : currentEmail;

    if (isBlocked) {
      await unblockUserInStorage(docEmail, patEmail);
      setIsBlocked(false);
      alert(`Patient ${activeContact.name} has been unblocked.`);
    } else {
      await blockUserInStorage(docEmail, patEmail);
      setIsBlocked(true);
      alert(`Patient ${activeContact.name} has been blocked. They will no longer be able to send messages to you.`);
    }
    setShowMenu(false);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!activeContact) return;
    const reasonText = `${reportReason}: ${reportDetails}`;
    await reportUserInStorage(currentEmail, activeContact.email, reasonText, currentRole);
    setShowReportModal(false);
    setReportDetails('');
    setShowMenu(false);
    alert(`Report against ${activeContact.name} logged successfully! Sent to Admin Board for audit.`);
  };

  const filteredContacts = contactsList.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtext.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    const cleanName = name.replace(/^Dr\.\s*/i, '').trim();
    const parts = cleanName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return cleanName.slice(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5E0D5] shadow-vault-card overflow-hidden grid grid-cols-12 h-[calc(100vh-140px)] min-h-[600px] max-h-[850px] font-sans select-none">
      
      {/* LEFT SIDEBAR: CONTACTS LIST (Fixed Container with independent scroll) */}
      <div className="col-span-12 md:col-span-4 border-r border-[#E5E0D5] bg-[#FAF8F5] flex flex-col h-full overflow-hidden">
        
        {/* Header (Pinned) */}
        <div className="p-4 border-b border-[#E5E0D5] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-black flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#C9A574]" />
              {currentRole === 'doctor' ? 'Patient Messages' : 'Chat with Doctor'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" /> Live Sync
            </span>
          </div>

          {/* Search Contacts Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E5E0D5] pl-9 pr-3 py-1.5 rounded-xl text-xs font-semibold outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Contacts List (Independent Scrollable Container) */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E0D5] min-h-0">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-gray-400">
              No active conversations found
            </div>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = activeContact?.email === contact.email;
              const initials = getInitials(contact.name);
              return (
                <div
                  key={contact.id}
                  onClick={() => setActiveContact(contact)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected ? 'bg-white border-l-4 border-black shadow-xs' : 'hover:bg-white/60'
                  }`}
                >
                  {/* Clean Initial Badge */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border flex-shrink-0 shadow-xs ${
                    contact.role === 'doctor' 
                      ? 'bg-teal-50 text-[#00796B] border-teal-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-black truncate">{contact.name}</h4>
                      <span className="text-[10px] text-gray-400 font-semibold">Active</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                      {contact.subtext}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT CHAT WINDOW PANE (Fixed Container with independent messages scroll) */}
      <div className="col-span-12 md:col-span-8 bg-white flex flex-col h-full overflow-hidden">
        {activeContact ? (
          <>
            {/* Active Contact Header Bar (Pinned) */}
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D5] flex items-center justify-between relative shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border flex-shrink-0 shadow-xs ${
                  activeContact.role === 'doctor' 
                    ? 'bg-teal-50 text-[#00796B] border-teal-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {getInitials(activeContact.name)}
                </div>

                <div>
                  <h3 className="text-sm font-black text-black flex items-center gap-1.5">
                    {activeContact.name}
                    {activeContact.role === 'doctor' && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">
                        Verified Doctor
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">{activeContact.subtext}</p>
                </div>
              </div>

              {/* Action Buttons: Share Vault Access & Three-Dot Menu */}
              <div className="flex items-center gap-2">
                {currentRole === 'patient' && (
                  <button
                    onClick={handleShareVaultAccessInChat}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Share Medical History Access"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Share Vault Access
                  </button>
                )}

                {/* THREE-DOT ACTION MENU */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-600 hover:text-black hover:bg-[#E5E0D5]/50 rounded-xl transition-all cursor-pointer"
                    title="More Options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Options */}
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-[#E5E0D5] shadow-2xl z-50 overflow-hidden py-1 animate-fadeIn">
                      {currentRole === 'doctor' && (
                        <button
                          onClick={handleToggleBlock}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-800 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <UserX className="w-4 h-4 text-rose-600" />
                          {isBlocked ? 'Unblock Patient' : 'Block Patient'}
                        </button>
                      )}

                      <button
                        onClick={() => { setShowReportModal(true); setShowMenu(false); }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-800 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Report {currentRole === 'doctor' ? 'Patient' : 'Practitioner'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Block Warning Notification Banner */}
            {isBlocked && (
              <div className="bg-rose-50 border-b border-rose-200 p-3 px-4 flex items-center gap-2 text-rose-950 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>
                  {currentRole === 'doctor' 
                    ? 'You have blocked this patient. They cannot send messages to you.' 
                    : 'You have been blocked from sending messages to this practitioner.'}
                </span>
              </div>
            )}

            {/* MESSAGES CONVERSATION SCROLL BUBBLES */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#FAF8F5]/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                  <p className="text-xs font-bold text-gray-500">No messages exchanged yet</p>
                  <p className="text-[11px] text-gray-400">Send a message or attach a file below to start your consultation chat.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderEmail?.toLowerCase() === currentEmail;
                  const att = getMessageAttachment(m);

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-semibold shadow-xs ${
                          m.isSharedVaultAccess
                            ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-2xl'
                            : isMine
                            ? 'bg-black text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-[#E5E0D5] rounded-bl-none'
                        }`}
                      >
                        {/* QUOTED REPLY BLOCK */}
                        {m.replyTo && (
                          <div className={`mb-2 p-2 rounded-xl text-[11px] border-l-4 ${
                            isMine 
                              ? 'bg-white/15 border-[#C9A574] text-white' 
                              : 'bg-gray-100 border-[#00796B] text-gray-800'
                          }`}>
                            <p className="font-extrabold text-[10px] uppercase opacity-90">{m.replyTo.senderName}</p>
                            <p className="truncate font-medium mt-0.5">{m.replyTo.text}</p>
                          </div>
                        )}

                        {m.isSharedVaultAccess && (
                          <div className="flex items-center gap-1.5 mb-1 text-emerald-800 font-extrabold text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Medical Vault Access Granted
                          </div>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                        {/* ATTACHMENT CARD RENDERER */}
                        {att && (
                          <div 
                            onClick={() => handleOpenAttachment(att)}
                            className="mt-2.5 p-3 rounded-xl bg-[#FAF8F5] text-black border border-[#E5E0D5] hover:border-[#C9A574] transition-all text-xs font-bold flex items-center justify-between gap-3 cursor-pointer shadow-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#00796B] border border-teal-200 flex items-center justify-center flex-shrink-0 font-bold">
                                <FileText className="w-4 h-4 text-[#00796B]" />
                              </div>
                              <div className="truncate">
                                <p className="truncate font-extrabold text-black">{att.fileName}</p>
                                <span className="text-[10px] text-gray-500 font-mono">{att.fileSize || 'Document File'}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleOpenAttachment(att); }}
                              className="px-3.5 py-1.5 bg-black hover:bg-[#2a2a2a] text-[#C9A574] font-extrabold rounded-xl text-[11px] cursor-pointer flex items-center gap-1.5 shadow-xs flex-shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" /> Open / View Document
                            </button>
                          </div>
                        )}

                        {/* MESSAGE FOOTER: REPLY BUTTON & TIMESTAMP */}
                        <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setReplyingTo({ id: m.id, text: m.text, senderName: isMine ? 'You' : activeContact.name })}
                            className={`text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isMine 
                                ? 'text-[#C9A574] hover:text-white' 
                                : 'text-[#00796B] hover:text-black'
                            }`}
                          >
                            <CornerUpLeft className="w-3 h-3" /> Reply
                          </button>

                          <span className={`text-[9px] font-mono ${m.isSharedVaultAccess ? 'text-emerald-700' : isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                            {m.displayTime}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* HIDDEN FILE INPUT */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttachment}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
            />

            {/* ACTIVE REPLY PREVIEW BANNER */}
            {replyingTo && (
              <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs font-semibold text-amber-950 animate-fadeIn">
                <div className="flex items-center gap-2 truncate">
                  <CornerUpLeft className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <div className="truncate">
                    <span className="font-extrabold text-amber-900">Replying to {replyingTo.senderName}:</span>
                    <span className="ml-1.5 text-gray-700 font-medium truncate">{replyingTo.text}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="p-1 text-gray-500 hover:text-black rounded-lg cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* BOTTOM MESSAGE INPUT FORM */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-[#E5E0D5] flex items-center gap-2">
              <button
                type="button"
                disabled={isBlocked}
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-black hover:bg-[#FAF8F5] rounded-2xl transition-all cursor-pointer border border-[#E5E0D5] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach Document / File"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                disabled={isBlocked}
                placeholder={isBlocked ? "Messaging disabled (User blocked)" : replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type your message..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#FAF8F5] border border-[#E5E0D5] px-4 py-3 rounded-2xl text-xs font-medium text-black outline-none focus:border-black disabled:opacity-50 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                disabled={isBlocked || !inputText.trim()}
                className="p-3 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-2xl transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
            <MessageSquare className="w-10 h-10 text-gray-300" />
            <h3 className="text-sm font-black text-black">Select a Conversation</h3>
            <p className="text-xs text-gray-500">Choose a contact from the left list to view chat history.</p>
          </div>
        )}
      </div>

      {/* REPORT USER MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-5 relative font-sans">
            <div className="flex items-center gap-3 border-b border-[#E5E0D5] pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-black">Report User to Admin Board</h3>
                <p className="text-xs text-gray-500 font-medium">Reporting {activeContact?.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-xl font-bold text-black outline-none cursor-pointer"
                >
                  <option value="Inappropriate Language">Inappropriate / Abusive Language</option>
                  <option value="Spam or Unsolicited Messages">Spam / Unsolicited Messages</option>
                  <option value="Fake Credentials or False Info">Fake Credentials / False Information</option>
                  <option value="Security Violation">Security or Privacy Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Additional Incident Details</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe what happened..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D5] p-3 rounded-xl text-xs font-medium text-black outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E0D5]">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer shadow-md"
                >
                  Submit Official Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACHMENT PREVIEW & DOWNLOAD MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-5 relative font-sans max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#00796B] border border-teal-200 flex items-center justify-center flex-shrink-0 font-bold">
                  <FileText className="w-5 h-5 text-[#00796B]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black truncate max-w-md">{previewAttachment.fileName}</h3>
                  <p className="text-xs text-gray-500 font-medium">{previewAttachment.fileSize || 'Document File'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadAttachment(previewAttachment)}
                  className="px-4 py-2 bg-black hover:bg-[#2a2a2a] text-[#C9A574] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-base font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Viewer Body */}
            <div className="flex-1 overflow-auto bg-[#FAF8F5] rounded-2xl p-4 border border-[#E5E0D5] flex items-center justify-center min-h-[350px]">
              {previewAttachment.fileType === 'image' || (previewAttachment.fileData && previewAttachment.fileData.startsWith('data:image')) ? (
                <img
                  src={previewAttachment.fileData}
                  alt={previewAttachment.fileName}
                  className="max-h-[65vh] rounded-2xl object-contain shadow-md mx-auto"
                />
              ) : previewAttachment.fileData && previewAttachment.fileData.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewAttachment.fileData}
                  title={previewAttachment.fileName}
                  className="w-full h-[65vh] rounded-2xl border border-[#E5E0D5] bg-white shadow-inner"
                />
              ) : (
                <div className="text-center p-8 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#00796B] border border-teal-200 flex items-center justify-center mx-auto shadow-sm">
                    <FileText className="w-8 h-8 text-[#00796B]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-black">{previewAttachment.fileName}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">Medical record document attached via VaultCare AI Chat.</p>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(previewAttachment)}
                    className="px-6 py-2.5 bg-[#00796B] hover:bg-[#00695C] text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download & Save Document
                  </button>
                </div>
              )}
            </div>

        </div>
    </div>
)}
      
    </div>
  );
}
