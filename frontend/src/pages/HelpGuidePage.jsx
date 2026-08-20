import React, { useState } from 'react';
import { 
  HelpCircle, 
  BookOpen, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  FileText, 
  Lock, 
  LifeBuoy,
  CheckCircle2,
  Mic,
  Share2
} from 'lucide-react';

export default function HelpGuidePage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'How does VaultCare AI extract data from my uploaded lab reports?',
      a: 'When you upload a PDF or image of a medical report, our HIPAA-compliant microservice uses optical character recognition (OCR) and clinical language processing to extract lab values (such as Glucose, Hemoglobin, and Cholesterol) into structured data.'
    },
    {
      q: 'Is my medical data private and secure?',
      a: 'Yes. All health records, biometrics, and AI chat transcripts are encrypted end-to-end using 256-bit AES encryption. Only you and doctors you explicitly grant access to can view your files.'
    },
    {
      q: 'How do I use Voice Mode with VaultCare AI?',
      a: 'In the AI Health Summary tab, click the Microphone () icon in the bottom input bar. Speak your question naturally, and VaultCare AI will listen, transcribe, and automatically respond both in text and spoken audio voice.'
    },
    {
      q: 'Can I share my medical reports with my doctor?',
      a: 'Yes! From your Dashboard, click "Share With Doctor" to generate an encrypted link or share directly with registered physicians on VaultCare AI.'
    },
    {
      q: 'What should I do if OCR extracts a lab parameter incorrectly?',
      a: 'During the upload process in "Upload Report", an AI Verification Table allows you to edit any parameter value before saving it permanently to your Vault.'
    }
  ];

  const guideCards = [
    {
      icon: Upload,
      title: '1. Uploading Reports',
      desc: 'Drag & drop any lab report, prescription, or scan in JPG/PDF format. Our AI will automatically parse the biomarkers for you.'
    },
    {
      icon: Sparkles,
      title: '2. VaultCare AI Assistant',
      desc: 'Ask questions about your health, attach reports directly to chat, or use Voice Mode to speak naturally with your assistant.'
    },
    {
      icon: Clock,
      title: '3. Timeline & Analytics',
      desc: 'Track your fasting blood sugar, cholesterol, and checkups over time in a unified chronological health journey.'
    },
    {
      icon: ShieldCheck,
      title: '4. Encrypted Sharing',
      desc: 'Share specific reports with doctors via secure 256-bit links while retaining complete control over your health records.'
    }
  ];

  return (
    <div className="space-y-8 select-none max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EC] text-[#916D41] text-xs font-extrabold border border-[#E3CF9B] mb-2">
          <BookOpen className="w-3.5 h-3.5 text-[#C9A574]" /> Help & Documentation Guide
        </div>
        <h1 className="text-2xl font-black text-black">Help & Platform Guide</h1>
        <p className="text-sm text-[#666666] font-medium">
          Everything you need to know about managing your personal health records, AI analysis, and privacy
        </p>
      </div>

      {/* 4 Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guideCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-vault-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] border border-[#E3CF9B] text-[#C9A574] flex items-center justify-center font-bold">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-black">{card.title}</h3>
              <p className="text-xs text-[#666666] leading-relaxed font-medium">
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Frequently Asked Questions (FAQ Accordion) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5E0D5] shadow-vault-card space-y-6">
        <div className="border-b border-[#E5E0D5] pb-4">
          <h2 className="text-lg font-black text-black flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#C9A574]" /> Frequently Asked Questions (FAQ)
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Quick answers to common questions about using VaultCare AI
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="border border-[#E5E0D5] rounded-2xl overflow-hidden transition-all bg-[#FAF8F5]"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between font-extrabold text-xs text-black cursor-pointer hover:bg-[#FAF5EC] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#C9A574]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-gray-600 font-medium leading-relaxed border-t border-[#E5E0D5] bg-white animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Contact Footer Box */}
      <div className="bg-black text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[10px] font-black text-[#C9A574] uppercase tracking-widest block">Need Further Assistance?</span>
          <h3 className="text-lg font-extrabold">VaultCare AI Patient Support Team</h3>
          <p className="text-xs text-gray-400 max-w-md font-medium">
            Our medical records support desk is active 24/7 to assist with report processing or account privacy.
          </p>
        </div>

        <button 
          onClick={() => alert("Contact Support: Email support@vaultcare.ai or call 1-800-VAULTCARE")}
          className="bg-[#C9A574] hover:bg-[#b89463] text-black px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 flex-shrink-0"
        >
          <LifeBuoy className="w-4 h-4" /> Contact Help Desk
        </button>
      </div>

    </div>
  );
}
