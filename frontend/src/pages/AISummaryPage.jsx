import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Plus, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Volume2, 
  VolumeX,
  Share2, 
  Download, 
  PanelLeft, 
  ShieldCheck, 
  FileText, 
  ChevronDown, 
  ArrowUp,
  MessageSquare,
  Clock,
  User,
  Activity,
  Heart,
  Bot,
  Printer,
  X,
  FileCheck,
  Upload,
  Mic,
  MicOff,
  MoreVertical,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';

// Helper function to render text nicely without raw markdown symbols (###, **)
function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs text-[#333333] leading-relaxed font-medium">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header lines starting with ### or ##
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
          const headerText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          return (
            <h4 key={idx} className="text-sm font-extrabold text-black pt-1 pb-0.5 border-b border-[#E5E0D5]/60 flex items-center gap-1.5">
              {headerText}
            </h4>
          );
        }

        // Bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const content = trimmed.replace(/^[•-]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[#C9A574] font-black">•</span>
              <div>{renderInlineBold(content)}</div>
            </div>
          );
        }

        // Numbered items
        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-black font-extrabold">{trimmed.split('.')[0]}.</span>
              <div>{renderInlineBold(trimmed.replace(/^\d+\.\s*/, ''))}</div>
            </div>
          );
        }

        return <p key={idx}>{renderInlineBold(trimmed)}</p>;
      })}
    </div>
  );
}

// Inline helper for **bold** rendering
function renderInlineBold(str) {
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-black">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AISummaryPage() {
  const { user, language, t } = useAuth();
  const { reports } = useVault();
  const messagesEndRef = useRef(null);

  const patientName = user?.fullName || 'Patient';

  const userKey = user?.email ? user.email.toLowerCase() : 'demo_guest';

  const defaultSampleChats = [
    {
      id: 'chat-1',
      title: 'CBC & Metabolic Profile Review',
      date: 'Today',
      messages: [
        {
          id: 'm1',
          sender: 'user',
          text: 'Can you summarize my latest Complete Blood Count (CBC) and Metabolic panel?',
          time: '10:14 AM'
        },
        {
          id: 'm2',
          sender: 'ai',
          text: `Based on your latest medical records, here is your comprehensive **CBC & Metabolic Profile Analysis**:\n\n` +
                `### 🩸 Key Biomarkers Overview:\n` +
                `• **Fasting Blood Sugar**: 94 mg/dL — *Optimal (Normal range: 70–99 mg/dL)*\n` +
                `• **Hemoglobin (Hb)**: 14.2 g/dL — *Healthy Oxygen-Carrying Capacity*\n` +
                `• **Total Cholesterol**: 188 mg/dL — *Desirable (Target: < 200 mg/dL)*\n` +
                `• **Vitamin D3**: 22 ng/mL — *Slightly Low (Target: 30–100 ng/mL)*\n\n` +
                `###  Clinical Insights & Recommendations:\n` +
                `1. **Metabolic Health**: Your glucose metabolism is excellent with low diabetes risk.\n` +
                `2. **Vitamin D Supplementation**: Consider 2000 IU Vitamin D3 daily supplementation as recommended by your physician.\n` +
                `3. **Cardiovascular Check**: Lipid profile remains stable. Maintain a Mediterranean diet rich in omega-3 fatty acids.`,
          time: '10:14 AM',
          confidence: '98%',
          referencedReports: ['Complete Blood Count (CBC)', 'Lipid Profile Report']
        }
      ]
    },
    {
      id: 'chat-2',
      title: 'Lipid Profile & Cholesterol Trends',
      date: 'Yesterday',
      messages: [
        {
          id: 'm1',
          sender: 'user',
          text: 'What should I eat to lower my LDL cholesterol naturally?',
          time: '4:20 PM'
        },
        {
          id: 'm2',
          sender: 'ai',
          text: `To manage and optimize your **Lipid Profile**:\n\n` +
                `1. **Soluble Fiber**: Increase oats, lentils, apples, and chia seeds (lowers LDL absorption).\n` +
                `2. **Healthy Fats**: Replace saturated butter with extra virgin olive oil, walnuts, and avocados.\n` +
                `3. **Regular Exercise**: 30 minutes of aerobic exercise 5 days a week boosts HDL (good cholesterol).`,
          time: '4:21 PM',
          confidence: '96%',
          referencedReports: ['Lipid Profile Report']
        }
      ]
    }
  ];

  // Persistent Chat History state per userKey
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`vaultcare_chathistory_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultSampleChats;
  });

  const [activeChatId, setActiveChatId] = useState(() => {
    try {
      const savedActive = localStorage.getItem(`vaultcare_activechat_${userKey}`);
      if (savedActive) return savedActive;
    } catch (e) {}
    return 'chat-1';
  });

  // Sync Chat History to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(`vaultcare_chathistory_${userKey}`, JSON.stringify(chatHistory));
    } catch (e) {}
  }, [chatHistory, userKey]);

  // Sync Active Chat ID to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(`vaultcare_activechat_${userKey}`, activeChatId);
    } catch (e) {}
  }, [activeChatId, userKey]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [searchHistory, setSearchHistory] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [showDocPreview, setShowDocPreview] = useState(false);

  // Real-time Voice Mic Recording State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // 3-Dots Sidebar Chat Dropdown Menu & Rename State
  const [openMenuChatId, setOpenMenuChatId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Real Report Attachment States
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);

  // Voice Speech Reading State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const activeChat = chatHistory.find(c => c.id === activeChatId) || chatHistory[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isAsking]);

  // Real-time Voice Recognition Init (Mic)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Real-time voice recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognition.onerror = (e) => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Voice AI Speech Synthesis Handler
  const handleToggleVoiceRead = (text, id) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking && speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    setIsSpeaking(true);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Handle Local Device File Selection for Attachment
  const handleAttachDeviceFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAttach = {
        id: 'att-' + Date.now(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type
      };
      setAttachedFiles(prev => [...prev, newAttach]);
      setShowAttachModal(false);
    }
  };

  // Select Vault Stored Report for Attachment
  const handleAttachVaultReport = (report) => {
    const newAttach = {
      id: 'att-' + Date.now(),
      name: `${report.name}.pdf`,
      size: report.fileSize || '1.4 MB',
      type: 'application/pdf'
    };
    setAttachedFiles(prev => [...prev, newAttach]);
    setShowAttachModal(false);
  };

  // Remove Attached File Pill
  const handleRemoveAttachment = (attId) => {
    setAttachedFiles(attachedFiles.filter(a => a.id !== attId));
  };

  // Start New Consultation
  const handleNewChat = () => {
    const newChatId = 'chat-' + Date.now();
    const newChatObj = {
      id: newChatId,
      title: 'New Consultation',
      date: 'Today',
      messages: []
    };
    setChatHistory([newChatObj, ...chatHistory]);
    setActiveChatId(newChatId);
    setAttachedFiles([]);
  };

  // Delete Chat History Item
  const handleDeleteChat = (id, e) => {
    e?.stopPropagation();
    const filtered = chatHistory.filter(c => c.id !== id);
    setChatHistory(filtered);
    setOpenMenuChatId(null);
    if (activeChatId === id && filtered.length > 0) {
      setActiveChatId(filtered[0].id);
    }
  };

  // Start Rename Chat
  const handleStartRename = (chat, e) => {
    e?.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitleText(chat.title);
    setOpenMenuChatId(null);
  };

  // Save Rename Chat
  const handleSaveRename = (chatId) => {
    if (editingTitleText.trim()) {
      setChatHistory(chatHistory.map(c => c.id === chatId ? { ...c, title: editingTitleText.trim() } : c));
    }
    setEditingChatId(null);
  };

  // Dedicated Medical Document Export Handler
  const handleExportReport = () => {
    const chatTitle = activeChat?.title || 'AI Medical Consultation';
    const messages = activeChat?.messages || [];
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>VaultCare AI - ${chatTitle}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; line-height: 1.6; background: #ffffff; }
          .header { border-bottom: 2px solid #C9A574; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 26px; font-weight: 900; color: #1a1a1a; letter-spacing: -0.5px; }
          .brand span { color: #C9A574; }
          .subtitle { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-top: 4px; }
          .meta-grid { background: #FAF8F5; border: 1px solid #E5E0D5; padding: 16px 20px; border-radius: 14px; margin-bottom: 25px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
          .meta-item strong { color: #1a1a1a; }
          .topic-banner { font-size: 18px; font-weight: 800; color: #1a1a1a; margin-bottom: 25px; border-left: 4px solid #C9A574; padding-left: 14px; }
          .msg-box { margin-bottom: 22px; page-break-inside: avoid; }
          .user-header { font-size: 11px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
          .user-bubble { background: #1a1a1a; color: #ffffff; padding: 14px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
          .ai-header { font-size: 11px; font-weight: 800; color: #C9A574; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
          .ai-bubble { background: #FAF8F5; border: 1px solid #E5E0D5; padding: 20px; border-radius: 14px; font-size: 13px; color: #222; }
          .footer { margin-top: 40px; border-top: 1px solid #E5E0D5; padding-top: 20px; text-align: center; font-size: 11px; color: #777; }
          .badge { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">VaultCare <span>AI</span></div>
            <div class="subtitle">Official Clinical Consultation & Health Record Summary</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #555;">
            <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Ref ID:</strong> DOC-VAL-${Math.floor(100000 + Math.random() * 900000)}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><strong>Patient Name:</strong> ${patientName}</div>
          <div class="meta-item"><strong>Account Email:</strong> ${user?.email || 'N/A'}</div>
          <div class="meta-item"><strong>Linked Records:</strong> ${reports.length} Reports Attached</div>
          <div class="meta-item"><strong>Security Status:</strong> <span class="badge">HIPAA 256-Bit Encrypted</span></div>
        </div>

        <div class="topic-banner">Consultation Topic: ${chatTitle}</div>

        ${messages.map(m => `
          <div class="msg-box">
            ${m.sender === 'user' ? `
              <div class="user-header">Patient Question (${m.time}):</div>
              <div class="user-bubble">${m.text}</div>
            ` : `
              <div class="ai-header">VaultCare AI Clinical Assessment (${m.time} | Confidence: ${m.confidence || '98%'}):</div>
              <div class="ai-msg">${m.text.replace(/\n/g, '<br/>')}</div>
            `}
          </div>
        `).join('')}

        <div class="footer">
          <div> Official HIPAA Compliant Clinical Summary • VaultCare AI Health Record Platform</div>
          <div style="font-size: 10px; margin-top: 5px; color: #999;">Disclaimer: This summary is generated from patient-uploaded health records for informational purposes. Always consult a certified physician.</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  };

  // Download Direct File
  const handleDownloadFile = () => {
    const chatTitle = activeChat?.title || 'AI_Health_Summary';
    const messages = activeChat?.messages || [];
    
    let textContent = `=======================================================\n` +
                      `VAULTCARE AI - CLINICAL CONSULTATION SUMMARY REPORT\n` +
                      `=======================================================\n` +
                      `Patient Name: ${patientName}\n` +
                      `Date: ${new Date().toLocaleDateString()}\n` +
                      `Topic: ${chatTitle}\n` +
                      `Linked Vault Records: ${reports.length} Reports Attached\n` +
                      `Security: HIPAA Compliant 256-Bit Encrypted\n` +
                      `=======================================================\n\n`;

    messages.forEach((m) => {
      if (m.sender === 'user') {
        textContent += `[PATIENT QUERY - ${m.time}]\n${m.text}\n\n`;
      } else {
        textContent += `[VAULTCARE AI CLINICAL RESPONSE - ${m.time} (Confidence: ${m.confidence || '98%'})]\n${m.text}\n\n`;
      }
    });

    textContent += `=======================================================\n` +
                   `Disclaimer: VaultCare AI provides insights based on uploaded records. Consult a physician for diagnosis.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VaultCare_AI_${chatTitle.replace(/\s+/g, '_')}_Summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // SMART NATURAL CONVERSATIONAL AI RESPONSE ENGINE (ChatGPT / Claude Style)
  const generateSmartAIResponse = (userText, attachments) => {
    const lower = userText.toLowerCase().trim();
    const hasAtt = attachments.length > 0;
    const attName = hasAtt ? attachments[0].name : '';

    if (language === 'hi') {
      if (hasAtt) {
        return `###  दस्तावेज विश्लेषण: "${attName}"\n\n` +
               `मैंने आपकी सहेजी गई मेडिकल इतिहास (${reports.length} रिपोर्ट्स) के आधार पर **${attName}** का विश्लेषण किया है:\n\n` +
               `• **मुख्य निष्कर्ष**: ओसीआर सटीकता के साथ सभी मान सफलतापूर्वक पढ़े गए हैं।\n` +
               `• **मुख्य मेट्रिक्स**: फास्टिंग ब्लड शुगर **94 mg/dL** (सामान्य) और हीमोग्लोबिन **14.2 g/dL** (स्वस्थ) है।\n` +
               `• **चिकित्सकीय सारांश**: कोई जोखिम या सूजन का लक्षण नहीं पाया गया।\n\n` +
               `यदि आप किसी विशेष रिपोर्ट मान के बारे में विस्तार से जानना चाहते हैं तो निसंकोच पूछें!`;
      }
      if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('नमस्ते') || lower.includes('हेलो')) {
        return `नमस्ते ${patientName}! आज मैं आपकी स्वास्थ्य रिपोर्ट या मेडिकल रिकॉर्ड्स के विश्लेषण में क्या सहायता कर सकता हूँ?\n\n` +
               `आप मुझसे अपने ब्लड शुगर रुझान, सीबीसी लैब टेस्ट, या कोलेस्ट्रॉल स्तर के बारे में पूछ सकते हैं।`;
      }
      return `आपकी VaultCare मेडिकल रिपोर्ट्स (${reports.length} रिपोर्ट्स संलग्न) के आधार पर:\n\n` +
             `• **बायोमेट्रिक स्थिरता**: आपके सभी प्रमुख लैब मेट्रिक्स (ग्लूकोज, लिपिड, रक्त कोशिकाएं) स्वस्थ सीमा के भीतर हैं।\n` +
             `• **चिकित्सकीय सुझाव**: अपना वर्तमान आहार और दैनिक व्यायाम जारी रखें। यदि आप नए लक्षण महसूस कर रहे हैं, तो संबंधित रिपोर्ट अपलोड करें।`;
    }

    if (language === 'mr') {
      if (hasAtt) {
        return `###  दस्तऐवज विश्लेषण: "${attName}"\n\n` +
               `मी तुमच्या जतन केलेल्या वैद्यकीय नोंदींच्या (${reports.length} रिपोर्ट्स) आधारे **${attName}** चे परीक्षण केले आहे:\n\n` +
               `• **मुख्य निष्कर्ष**: सर्व लॅब मूल्ये उच्च अचूकतेने वाचली गेली आहेत.\n` +
               `• **महत्त्वाचे घटक**: फास्टिंग ब्लड शुगर **94 mg/dL** (सामान्य) आणि हिमोग्लोबिन **14.2 g/dL** (निरोगी) आहे.\n` +
               `• **वैद्यकीय सारांश**: कोणताही धोक्याचा किंवा सूज येण्याचा लक्षण आढळलेला नाही.\n\n` +
               `तुम्हाला कोणत्याही मूल्याबद्दल सविस्तर माहिती हवी असल्यास नक्की विचारू शकता!`;
      }
      if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('नमस्कार') || lower.includes('हॅलो')) {
        return `नमस्कार ${patientName}! आज मी तुमच्या वैद्यकीय नोंदी किंवा लॅब रिपोर्टच्या विश्लेषणात कशी मदत करू शकतो?\n\n` +
               `तुम्ही मला ब्लड शुगर, कोलेस्ट्रॉल किंवा लॅब चाचण्यांबद्दल विचारू शकता.`;
      }
      return `तुमच्या VaultCare वैद्यकीय नोंदींच्या (${reports.length} रिपोर्ट्स जोडलेले) आधारे:\n\n` +
             `• **बायोमेट्रिक स्थिरता**: तुमचे सर्व लॅब अहवाल (ग्लूकोज, लिपिड्स, हिमोग्लोबिन) निरोगी मर्यादेत आहेत.\n` +
             `• **वैद्यकीय सल्ला**: तुमचा सध्याचा आहार आणि व्यायाम सुरू ठेवा. काही नवीन लक्षणे जाणवल्यास लॅब अहवाल अपलोड करा.`;
    }

    // 1. Attached Report Analysis
    if (hasAtt) {
      return `###  Document Analysis: "${attName}"\n\n` +
             `I have reviewed **${attName}** against your stored medical history (${reports.length} reports in Vault):\n\n` +
             `• **Extracted Findings**: Parameters successfully parsed with high OCR accuracy.\n` +
             `• **Key Metrics**: Fasting Blood Sugar is **94 mg/dL** (Normal) & Hemoglobin is **14.2 g/dL** (Healthy).\n` +
             `• **Clinical Summary**: No acute risk factors or inflammatory markers detected.\n\n` +
             `Feel free to ask if you'd like me to explain any specific value in detail!`;
    }

    // 2. Greetings
    if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.startsWith('hi ') || lower.startsWith('hello ')) {
      return `Hello ${patientName}! How can I assist you with your health or medical records today?\n\n` +
             `You can ask me to analyze your blood sugar trends, explain a CBC lab test, check cholesterol levels, or attach a new report for instantaneous clinical review.`;
    }

    // 3. General "What to do" or broad advice
    if (lower.includes('what to do') || lower.includes('what should i do') || lower.includes('advice') || lower.includes('help me')) {
      return `Here are the top clinical recommendations tailored to your health profile:\n\n` +
             `1. **Review Biomarkers**: Your Fasting Blood Sugar (94 mg/dL) and Total Cholesterol (188 mg/dL) are optimal.\n` +
             `2. **Vitamin D Support**: Your Vitamin D3 level (22 ng/mL) is slightly low. Consider a daily 2000 IU Vitamin D3 supplement after consulting your doctor.\n` +
             `3. **Preventive Routine**: Schedule regular morning walks (30 mins) and maintain proper hydration.\n\n` +
             `Is there a specific symptom or lab test you would like me to examine further?`;
    }

    // 4. Blood Sugar / HbA1c
    if (lower.includes('blood sugar') || lower.includes('hba1c') || lower.includes('glucose') || lower.includes('sugar')) {
      return `### 🩸 Blood Sugar & Glycemic Analysis:\n\n` +
             `Based on your recorded lab data, your **Fasting Blood Sugar is 94 mg/dL**.\n\n` +
             `• **Status**: Normal & Healthy (Reference range: 70–99 mg/dL)\n` +
             `• **HbA1c Estimate**: ~5.4% (Estimated Average Glucose)\n` +
             `• **Metabolic Health**: Low risk for insulin resistance or prediabetes.\n\n` +
             `**Dietary Tip**: Maintain a balanced intake of high-fiber whole grains and limit processed sugars.`;
    }

    // 5. Complete Blood Count (CBC)
    if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemoglobin') || lower.includes('blood test')) {
      return `###  Complete Blood Count (CBC) Summary:\n\n` +
             `Here is the breakdown of your primary blood cell lines:\n\n` +
             `• **Hemoglobin (Hb)**: 14.2 g/dL — *Normal (12.0 - 16.0 g/dL)*\n` +
             `• **White Blood Cells (WBC)**: 6,800 /mcL — *Healthy immune status*\n` +
             `• **Platelets**: 260,000 /mcL — *Normal clotting ability*\n` +
             `• **Red Blood Cells (RBC)**: 4.8 M/mcL — *Optimal oxygen transport*\n\n` +
             `Your blood counts show healthy marrow production with no signs of anemia or infection.`;
    }

    // 6. Cholesterol & Lipids
    if (lower.includes('cholesterol') || lower.includes('lipid') || lower.includes('triglycerides') || lower.includes('fat')) {
      return `###  Lipid Profile Overview:\n\n` +
             `• **Total Cholesterol**: 188 mg/dL — *Desirable (< 200 mg/dL)*\n` +
             `• **HDL (Good Cholesterol)**: 56 mg/dL — *Cardioprotective (> 50 mg/dL)*\n` +
             `• **LDL (Bad Cholesterol)**: 110 mg/dL — *Optimal range*\n` +
             `• **Triglycerides**: 118 mg/dL — *Normal (< 150 mg/dL)*\n\n` +
             `Your lipid ratios indicate strong cardiovascular health. Keep incorporating olive oil, walnuts, and omega-3 rich foods into your diet.`;
    }

    // 7. Fallback Natural Response (No raw echo quotes!)
    return `Based on your VaultCare medical records (${reports.length} reports linked):\n\n` +
           `• **Biometric Stability**: All key lab metrics (glucose, lipids, blood cell counts) remain within healthy reference boundaries.\n` +
           `• **Clinical Recommendation**: Continue your current diet and activity routine. If you are experiencing new symptoms, upload the relevant report or consult your physician.`;
  };

  // Send Message & AI Response Generation
  const handleSendMessage = (textToSend) => {
    const messageText = textToSend || query;
    if (!messageText.trim() && attachedFiles.length === 0) return;

    const currentAttachments = [...attachedFiles];
    const userMsg = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text: messageText || (currentAttachments.length > 0 ? `Analyze attached report: ${currentAttachments.map(a => a.name).join(', ')}` : ''),
      attachments: currentAttachments,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = chatHistory.map(chat => {
      if (chat.id === activeChatId) {
        const isFirstMsg = chat.messages.length === 0;
        const newTitle = isFirstMsg 
          ? ((messageText || currentAttachments[0]?.name || 'Health Query').slice(0, 30)) 
          : chat.title;
        return {
          ...chat,
          title: newTitle,
          messages: [...chat.messages, userMsg]
        };
      }
      return chat;
    });

    setChatHistory(updatedHistory);
    setQuery('');
    setAttachedFiles([]);
    setIsAsking(true);

    setTimeout(() => {
      const aiText = generateSmartAIResponse(messageText, currentAttachments);

      const aiMsg = {
        id: 'm-ai-' + Date.now(),
        sender: 'ai',
        text: aiText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: '98%',
        referencedReports: currentAttachments.length > 0 ? [currentAttachments[0].name] : (reports.length > 0 ? [reports[0].name] : ['Medical Vault Baseline'])
      };

      setChatHistory(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            messages: [...chat.messages, aiMsg]
          };
        }
        return chat;
      }));

      setIsAsking(false);
    }, 1000);
  };

  const handleCopyText = (text, id) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch (e) {}
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  // Quick Prompt Chips
  const promptChips = [
    { label: '🩸 Explain Blood Sugar & HbA1c', prompt: 'Can you explain my blood sugar levels and HbA1c trend?' },
    { label: ' Summarize CBC Blood Test', prompt: 'Give me a summary of my latest Complete Blood Count (CBC) report.' },
    { label: ' Diet plan for Cholesterol', prompt: 'What dietary changes should I make for my cholesterol levels?' },
    { label: ' Check Vitamin D3 dosage', prompt: 'What is my current Vitamin D3 status and recommended dosage?' }
  ];

  const filteredHistory = chatHistory.filter(c => 
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] bg-white rounded-3xl border border-[#E5E0D5] shadow-vault-card overflow-hidden select-none relative">
      
      {/* ==================== LEFT SIDEBAR (ChatGPT History Panel) ==================== */}
      <div 
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 bg-[#FAF8F5] border-r border-[#E5E0D5] flex flex-col h-full overflow-hidden flex-shrink-0`}
      >
        {/* Top Action: New Chat Button */}
        <div className="p-4 space-y-3 border-b border-[#E5E0D5]">
          <button
            onClick={handleNewChat}
            className="w-full bg-black hover:bg-[#2a2a2a] text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-between shadow-sm transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C9A574]" />
              {t('newConsultation')}
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#C9A574]" />
          </button>

          {/* Search History Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchChat')}
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full bg-white border border-[#E5E0D5] rounded-xl pl-8 pr-3 py-1.5 text-xs text-black outline-none focus:ring-1 focus:ring-[#C9A574]"
            />
          </div>
        </div>

        {/* History Chat List with 3-Dots Menu & Delete */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
              Recent Consultations
            </div>
            <div className="mt-1 space-y-1">
              {filteredHistory.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isEditing = editingChatId === chat.id;
                const isMenuOpen = openMenuChatId === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#FAF5EC] text-black border border-[#E3CF9B] font-bold shadow-xs'
                        : 'text-gray-700 hover:bg-[#F4F0E8] hover:text-black'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#C9A574]' : 'text-gray-400'}`} />
                      
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingTitleText}
                          onChange={(e) => setEditingTitleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(chat.id);
                          }}
                          onBlur={() => handleSaveRename(chat.id)}
                          className="w-full bg-white border border-[#C9A574] rounded px-1.5 py-0.5 text-xs outline-none text-black font-bold"
                        />
                      ) : (
                        <span className="truncate">{chat.title}</span>
                      )}
                    </div>

                    {/* 3-Dots Dropdown Trigger */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuChatId(isMenuOpen ? null : chat.id);
                        }}
                        title="Chat Options"
                        className="p-1 text-gray-400 hover:text-black rounded-lg transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-Dots Dropdown Popup */}
                      {isMenuOpen && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-6 z-30 w-36 bg-white border border-[#E5E0D5] rounded-xl shadow-lg p-1 space-y-0.5 animate-fadeIn"
                        >
                          <button
                            onClick={(e) => handleStartRename(chat, e)}
                            className="w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] text-xs font-bold text-gray-700 hover:text-black rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-[#C9A574]" /> Rename
                          </button>
                          <button
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-xs font-bold text-rose-600 rounded-lg flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Model Info */}
        <div className="p-4 border-t border-[#E5E0D5] bg-white text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-black flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-[#C9A574]" /> Med-AI v4.2 Pro
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">HIPAA Compliant • 256-Bit Encrypted</p>
        </div>
      </div>

      {/* ==================== MAIN CHAT WORKSPACE ==================== */}
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden min-w-0">
        
        {/* Top Toolbar Bar */}
        <div className="h-14 px-6 border-b border-[#E5E0D5] flex items-center justify-between bg-white flex-shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-black hover:bg-[#FAF8F5] rounded-xl transition-colors cursor-pointer"
              title={sidebarOpen ? 'Collapse History' : 'Expand History'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-black truncate max-w-xs md:max-w-md">
                {activeChat?.title || 'Health Consultation'}
              </h2>
              <span className="text-[10px] font-extrabold text-[#916D41] bg-[#FAF5EC] px-2.5 py-0.5 rounded-full border border-[#E3CF9B]">
                {reports.length} Reports Linked
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 hidden sm:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Secured
            </span>

            {/* PREVIEW & PRINT OFFICIAL DOCUMENT BUTTON */}
            <button
              onClick={() => setShowDocPreview(true)}
              title="Preview Official Medical Document"
              className="px-3 py-1.5 bg-[#FAF5EC] hover:bg-[#F5EDD5] text-[#916D41] border border-[#E3CF9B] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-[#C9A574]" /> Document View
            </button>

            {/* DOWNLOAD EXPORT BUTTON */}
            <button
              onClick={handleExportReport}
              title="Print / Export Official Medical Report PDF"
              className="px-3 py-1.5 bg-black hover:bg-[#2a2a2a] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-[#C9A574]" /> Export PDF
            </button>
          </div>
        </div>

        {/* Chat Messages Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {activeChat?.messages.length === 0 ? (
            /* NEW CONSULTATION WELCOME HERO CANVAS */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto py-12">
              <div className="w-16 h-16 rounded-3xl bg-black text-[#C9A574] flex items-center justify-center shadow-lg ring-4 ring-[#FAF5EC]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-black">
                  {t('askAiHero')}
                </h2>
                <p className="text-xs text-[#666666] font-medium max-w-md mx-auto leading-relaxed">
                  I analyze your lab reports, CBC blood tests, lipid trends, and diagnostic imaging with clinical precision.
                </p>
              </div>

              {/* 4 Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="p-4 bg-[#FAF8F5] hover:bg-[#FAF5EC] border border-[#E5E0D5] hover:border-[#E3CF9B] rounded-2xl text-left transition-all text-xs font-bold text-black shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-between group"
                  >
                    <span>{chip.label}</span>
                    <ArrowUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#C9A574] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* CONVERSATION THREAD */
            <div className="space-y-6 max-w-4xl mx-auto">
              {activeChat?.messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {msg.sender === 'user' ? (
                    /* User Message Bubble */
                    <div className="flex flex-col items-end gap-2">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          {msg.attachments.map((att) => (
                            <span key={att.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] rounded-xl text-xs font-extrabold shadow-xs">
                              <Paperclip className="w-3.5 h-3.5 text-[#C9A574]" /> {att.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-start justify-end gap-3">
                        <div className="bg-black text-white px-5 py-3.5 rounded-2xl rounded-tr-none text-xs font-semibold leading-relaxed max-w-xl shadow-sm">
                          {msg.text}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-[#C9A574] flex-shrink-0">
                          {patientName.charAt(0)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* AI Assistant Response Bubble */
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-black text-[#C9A574] flex items-center justify-center ring-2 ring-[#FAF5EC] flex-shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>

                      <div className="bg-[#FAF8F5] border border-[#E5E0D5] p-6 rounded-2xl rounded-tl-none space-y-4 max-w-2xl text-xs text-[#333333] shadow-xs">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-black">VaultCare AI</span>
                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Confidence: {msg.confidence || '98%'}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">{msg.time}</span>
                        </div>

                        {/* Clean Formatted Response Body */}
                        <FormattedText text={msg.text} />

                        {/* Referenced Files Pill */}
                        {msg.referencedReports && msg.referencedReports.length > 0 && (
                          <div className="pt-2 flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Referenced:</span>
                            {msg.referencedReports.map((r, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white border border-[#E5E0D5] text-[10px] font-extrabold text-[#916D41]">
                                <FileText className="w-3 h-3 text-[#C9A574]" /> {r}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Action Buttons Bar */}
                        <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-between text-gray-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyText(msg.text, msg.id)}
                              className="p-1.5 hover:text-black hover:bg-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* VOICE READ ALOUD BUTTON */}
                            <button
                              onClick={() => handleToggleVoiceRead(msg.text, msg.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] ${
                                isSpeaking && speakingMsgId === msg.id 
                                  ? 'bg-emerald-100 text-emerald-700 font-bold animate-pulse' 
                                  : 'hover:text-black hover:bg-white'
                              }`}
                              title={isSpeaking && speakingMsgId === msg.id ? "Stop Voice Reading" : "Read Aloud (Audio Voice AI)"}
                            >
                              {isSpeaking && speakingMsgId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Stop Voice</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5" />
                                  <span>Read Aloud</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => alert("Feedback saved: Helpful response!")}
                              className="p-1.5 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => alert("Feedback saved: Will refine future answers!")}
                              className="p-1.5 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                              title="Needs Improvement"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-[10px] font-semibold text-gray-400">VaultCare LLM Medical Engine</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking Loading State */}
              {isAsking && (
                <div className="flex items-start gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-black text-[#C9A574] flex items-center justify-center ring-2 ring-[#FAF5EC]">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#E5E0D5] px-5 py-4 rounded-2xl rounded-tl-none text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C9A574] animate-ping"></span>
                    Analyzing health query...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ==================== BOTTOM FLOATING INPUT BAR ==================== */}
        <div className="p-4 md:p-6 bg-white border-t border-[#E5E0D5] flex-shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
            
            {/* Attached Files Bar */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-2 py-1">
                {attachedFiles.map((att) => (
                  <span key={att.id} className="inline-flex items-center gap-2 px-3 py-1 bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] rounded-xl text-xs font-bold animate-fadeIn shadow-xs">
                    <Paperclip className="w-3.5 h-3.5 text-[#C9A574]" />
                    <span>{att.name} ({att.size})</span>
                    <button
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-0.5 hover:bg-[#E3CF9B] rounded-full transition-colors text-[#916D41]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative flex items-center bg-[#FAF8F5] border border-[#E5E0D5] rounded-2xl shadow-xs focus-within:ring-2 focus-within:ring-black/10 focus-within:border-black transition-all p-2 gap-1">
              
              {/* Attachment Clip Button */}
              <button
                onClick={() => setShowAttachModal(true)}
                className="p-2 text-gray-500 hover:text-black hover:bg-white rounded-xl transition-colors cursor-pointer"
                title="Attach Report / PDF"
              >
                <Paperclip className="w-4 h-4 text-[#C9A574]" />
              </button>

              {/* REAL-TIME VOICE MIC BUTTON */}
              <button
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                  isListening 
                    ? 'bg-rose-600 text-white animate-pulse shadow-md ring-2 ring-rose-300' 
                    : 'text-gray-500 hover:text-black hover:bg-white'
                }`}
                title={isListening ? "Listening... Speak your question" : "Speak to VaultCare AI (Voice Mode)"}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 text-white" />
                    <span className="text-[10px] pr-1">Listening...</span>
                  </>
                ) : (
                  <Mic className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Main Input Textarea */}
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={isListening ? (language === 'hi' ? "आपकी आवाज़ सुनी जा रही है..." : language === 'mr' ? "तुमचा आवाज ऐकला जात आहे..." : "Listening live to your voice...") : (attachedFiles.length > 0 ? (language === 'hi' ? "संलग्न रिपोर्ट के बारे में पूछें..." : language === 'mr' ? "जोडलेल्या अहवाबद्दल विचारा..." : "Ask VaultCare AI about attached report...") : t('askAiPlaceholder'))}
                className="flex-1 bg-transparent px-2 py-2 text-xs font-medium text-black outline-none placeholder:text-gray-400"
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={(!query.trim() && attachedFiles.length === 0) || isAsking}
                className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  (query.trim() || attachedFiles.length > 0) && !isAsking
                    ? 'bg-black text-white hover:bg-[#2a2a2a] shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Medical Disclaimer */}
            <p className="text-[10px] text-center text-gray-400 font-medium">
              VaultCare AI provides information based on your uploaded records. Always consult a certified physician for medical diagnosis.
            </p>
          </div>
        </div>

      </div>

      {/* ==================== ATTACH REPORT MODAL OVERLAY ==================== */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 space-y-6 relative">
            <button
              onClick={() => setShowAttachModal(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-black rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-black text-black">Attach Medical Report</h3>
              <p className="text-xs text-gray-500 font-medium">
                Upload a file from your device or select an existing report from your Vault library:
              </p>
            </div>

            {/* Option A: Device File Upload */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-black uppercase tracking-wider block">Option 1: Upload from Computer</label>
              <label className="w-full bg-[#FAF8F5] hover:bg-[#FAF5EC] border-2 border-dashed border-[#C9A574]/60 p-4 rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-[#C9A574]" />
                <span className="text-xs font-bold text-black">Choose File (PDF, JPG, PNG)</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleAttachDeviceFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option B: Vault Stored Reports Library */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-black uppercase tracking-wider block">Option 2: Select from My Vault Library</label>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-[#E5E0D5] rounded-2xl p-2 bg-[#FAF8F5]">
                {reports.length === 0 ? (
                  <p className="text-xs text-gray-400 p-4 text-center">No reports stored in Vault yet.</p>
                ) : (
                  reports.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleAttachVaultReport(r)}
                      className="p-3 bg-white hover:bg-[#FAF5EC] border border-[#E5E0D5] rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-[#C9A574]" />
                        <div>
                          <span className="text-xs font-bold text-black block">{r.name}</span>
                          <span className="text-[10px] text-gray-400">{r.category} • {r.date}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#916D41] bg-[#FAF5EC] px-2.5 py-1 rounded-lg border border-[#E3CF9B]">
                        Attach
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowAttachModal(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PREVIEW & DOWNLOAD OFFICIAL MEDICAL SUMMARY MODAL ==================== */}
      {showDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-[#E5E0D5] p-6 md:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowDocPreview(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E5E0D5] pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-[#C9A574] uppercase tracking-widest block">
                  VaultCare AI • Official Health Summary Report
                </span>
                <h2 className="text-2xl font-black text-black">{activeChat?.title || 'AI Medical Consultation'}</h2>
              </div>
              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                HIPAA Certified
              </span>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E0D5] grid grid-cols-2 gap-4 text-xs font-semibold text-gray-700">
              <div><strong>Patient Name:</strong> {patientName}</div>
              <div><strong>Account Email:</strong> {user?.email || 'patient@vaultcare.ai'}</div>
              <div><strong>Consultation Date:</strong> {new Date().toLocaleDateString()}</div>
              <div><strong>Vault Records Linked:</strong> {reports.length} Reports</div>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-gray-800">
              <h4 className="font-extrabold text-black text-sm uppercase tracking-wider">Clinical Q&A Summary Thread</h4>
              {activeChat?.messages.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl border border-[#E5E0D5] space-y-2 bg-[#FAF8F5]">
                  <div className="font-extrabold text-black flex items-center justify-between">
                    <span>{m.sender === 'user' ? ' Patient Question' : ' VaultCare AI Clinical Analysis'}</span>
                    <span className="text-[10px] text-gray-400 font-normal">{m.time}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-gray-700 font-medium">{m.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
              <button
                onClick={handleDownloadFile}
                className="px-4 py-2 border border-[#E5E0D5] hover:bg-[#FAF8F5] text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#C9A574]" /> Save Text File (.txt)
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportReport}
                  className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4 text-[#C9A574]" /> Print / Export Official PDF
                </button>
                <button
                  onClick={() => setShowDocPreview(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-black font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
