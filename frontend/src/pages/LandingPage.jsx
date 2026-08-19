import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  FileText, 
  Activity, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Upload, 
  Cpu, 
  Database, 
  TrendingUp, 
  ChevronRight,
  ShieldCheck,
  Award,
  Video,
  Users,
  Star,
  Check,
  Twitter,
  Linkedin,
  Instagram,
  HeartPulse
} from 'lucide-react';
import { motion } from 'framer-motion';
import stethoscopeBg from '../assets/stethoscope_bg.png';
import doctorsTeam from '../assets/doctors_team.png';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';

export default function LandingPage({ onNavigate }) {
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: 'VaultCare Pro Plan', price: 999 });

  const scrollToSection = (sectionId, e) => {
    e?.preventDefault();
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRazorpayPayment = async (planName, price) => {
    await openRazorpayCheckout({
      amount: price,
      planName: planName,
      description: `Subscription - ${planName}`,
      prefill: {
        name: 'Valued Customer',
        email: 'user@vaultcare.ai'
      },
      notes: {
        subscriptionPlan: planName,
        planPrice: price
      },
      onSuccess: ({ paymentId, orderId }) => {
        setShowPricingModal(false);
        alert(`Razorpay Payment Successful & Verified on Server!\nOrder ID: ${orderId}\nPayment ID: ${paymentId}\nPlan: ${planName}`);
        onNavigate('role-select');
      },
      onFailure: (err) => {
        console.error('Razorpay Payment Failed:', err);
        alert(`Payment Error: ${err.message || 'Razorpay checkout failed or signature could not be verified.'}`);
      },
      onCancel: () => {
        console.log('Razorpay payment cancelled by user');
      }
    });
  };

  const triggerPlanCheckout = (planName, price) => {
    setSelectedPlan({ name: planName, price });
    setShowPricingModal(true);
  };

  const steps = [
    {
      num: '01',
      title: 'Upload',
      desc: 'Upload your reports, scans, or prescriptions (PDF/Image).',
      icon: Upload
    },
    {
      num: '02',
      title: 'AI Extraction',
      desc: 'OCR + AI reads and extracts every value automatically.',
      icon: Cpu
    },
    {
      num: '03',
      title: 'Organized Vault',
      desc: 'Everything structured into your timeline, categorized and searchable.',
      icon: Database
    },
    {
      num: '04',
      title: 'AI Insights',
      desc: 'Get summaries, risk indicators, and doctor-ready reports instantly.',
      icon: TrendingUp
    }
  ];

  const features = [
    {
      icon: Cpu,
      title: 'AI-Powered OCR Extraction',
      desc: 'Upload any physical lab report, PDF, or scan. Our OCR extracts parameters, units, and dates into structured JSON automatically.'
    },
    {
      icon: Lock,
      title: 'Encrypted Private Vault',
      desc: 'Protected by AES 256-bit encryption and Supabase Row Level Security (RLS). Only authorized users can access health data.'
    },
    {
      icon: TrendingUp,
      title: 'Health Timeline & Biometrics',
      desc: 'Visualize Blood Sugar, Cholesterol, and HbA1c over months and years with intelligent trend lines and alert thresholds.'
    },
    {
      icon: Sparkles,
      title: 'AI Health Summary & Q&A',
      desc: 'Ask natural language questions about your medical history and receive instant, plain-English summaries from your stored files.'
    },
    {
      icon: FileText,
      title: 'Doctor-Ready PDF Export',
      desc: 'Generate clean, server-side PDF summaries via pdfkit with one click to bring to your next doctor consultation.'
    },
    {
      icon: Video,
      title: 'Appointments & Video Calls',
      desc: 'Schedule consultations with verified doctors, pay via Razorpay, and launch Google Meet video calls directly from the platform.'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Ananya Sharma',
      role: 'Consultant Cardiologist',
      quote: 'VaultCare AI saves me at least 15 minutes per patient consultation. Having all past blood tests graph-plotted makes diagnostic decisions much faster.'
    },
    {
      name: 'Patient One',
      role: 'VaultCare User (3 years)',
      quote: 'I used to carry a heavy physical folder of 5 years of lab reports to every doctor visit. Now everything is in one clean timeline on my phone!'
    },
    {
      name: 'Snehal Mundhe',
      role: 'Health Conscious User',
      quote: 'The AI Vitamin D and Cholesterol risk matrix pointed out a subtle deficiency pattern my previous doctors had overlooked. Highly recommended!'
    }
  ];

  return (
    <div className="min-h-screen bg-cream-grid flex flex-col font-sans select-none scroll-smooth">
      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E5E0D5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              +
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-black">
              VaultCare <span className="text-[#C9A574]">AI</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-[#4A4A4A]">
            <a href="#platform" onClick={(e) => scrollToSection('platform', e)} className="hover:text-black transition-colors cursor-pointer">Platform</a>
            <a href="#how-it-works" onClick={(e) => scrollToSection('how-it-works', e)} className="hover:text-black transition-colors cursor-pointer">How it works</a>
            <a href="#security" onClick={(e) => scrollToSection('security', e)} className="hover:text-black transition-colors cursor-pointer">Security</a>
            <a href="#pricing" onClick={(e) => scrollToSection('pricing', e)} className="hover:text-black transition-colors cursor-pointer">Pricing</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onNavigate('login')}
              className="text-sm font-semibold text-black hover:text-[#C9A574] transition-colors px-2 cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => onNavigate('role-select')}
              className="bg-black hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col justify-center space-y-24">
             {/* HERO SECTION WITH STETHOSCOPE BACKGROUND */}
        <div 
          className="relative rounded-3xl border border-[#DCD5C6] p-8 md:p-14 overflow-hidden shadow-vault-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${stethoscopeBg})` }}
        >
          {/* Translucent Overlay - High Stethoscope Visibility */}
          <div className="absolute inset-0 bg-[#EDE8DE]/45 pointer-events-none"></div>
          
          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content */}
            <div className="md:col-span-7 space-y-6">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black leading-[1.1]">
                Every Medical Report.<br />
                <span className="text-black">Organized for Life.</span>
              </h1>
              
              <p className="text-lg text-[#333333] font-medium leading-relaxed max-w-xl">
                VaultCare AI reads your scattered lab reports, scans, and prescriptions – then turns years of paperwork into a timeline you and your doctor can actually understand.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={() => onNavigate('role-select')}
                  className="bg-black hover:bg-[#2a2a2a] text-white px-8 py-4 rounded-full text-base font-bold shadow-md hover:shadow-xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  Create your vault
                </button>
                <button
                  onClick={(e) => scrollToSection('how-it-works', e)}
                  className="bg-white hover:bg-[#FAF8F5] text-black border border-black px-8 py-4 rounded-full text-base font-bold transition-all duration-200 shadow-sm cursor-pointer"
                >
                  See how it works
                </button>
              </div>
            </div>

            {/* Right Side Circular Image - Surgical Medical Team Looking Down */}
            <div className="md:col-span-5 flex justify-center relative">
              <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full border-4 border-white shadow-2xl overflow-hidden group bg-gray-100">
                <img 
                  src={doctorsTeam} 
                  alt="Surgical Medical Team Looking Down"
                  className="w-full h-full object-cover transition-transform duration-500"
                  style={{ transform: 'scale(1.45)' }}
                />
              </div>
            </div>
          </div>
        </div>
        //yaha se sab hata de na..
        </main>
        </div>
      );
      }

