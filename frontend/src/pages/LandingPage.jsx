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
  HeartPulse
} from 'lucide-react';

import { FaInstagram, FaTwitter, FaLinkedin } from 'react-icons/fa';

import { motion } from 'framer-motion';

import stethoscopeBg from '../assets/stethoscope_bg.png';
import doctorsTeam from '../assets/doctors_team.png';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';

export default function LandingPage({ onNavigate }) {
  const [showPricingModal, setShowPricingModal] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState({
    name: 'VaultCare Pro Plan',
    price: 999
  });

  const scrollToSection = (sectionId, e) => {
    e?.preventDefault();

    const elem = document.getElementById(sectionId);

    if (elem) {
      elem.scrollIntoView({
        behavior: 'smooth'
      });
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

        alert(
          `Razorpay Payment Successful & Verified on Server!\nOrder ID: ${orderId}\nPayment ID: ${paymentId}\nPlan: ${planName}`
        );

        onNavigate('role-select');
      },

      onFailure: (err) => {
        console.error('Razorpay Payment Failed:', err);

        alert(
          `Payment Error: ${
            err.message ||
            'Razorpay checkout failed or signature could not be verified.'
          }`
        );
      },

      onCancel: () => {
        console.log('Razorpay payment cancelled by user');
      }
    });
  };

  const triggerPlanCheckout = (planName, price) => {
    setSelectedPlan({
      name: planName,
      price
    });

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
      quote:
        'VaultCare AI saves me at least 15 minutes per patient consultation. Having all past blood tests graph-plotted makes diagnostic decisions much faster.'
    },
    {
      name: 'Patient One',
      role: 'VaultCare User (3 years)',
      quote:
        'I used to carry a heavy physical folder of 5 years of lab reports to every doctor visit. Now everything is in one clean timeline on my phone!'
    },
    {
      name: 'Snehal Mundhe',
      role: 'Health Conscious User',
      quote:
        'The AI Vitamin D and Cholesterol risk matrix pointed out a subtle deficiency pattern my previous doctors had overlooked. Highly recommended!'
    }
  ];

  return (
    <div className="min-h-screen bg-cream-grid flex flex-col font-sans select-none scroll-smooth">

      {/* Top Navbar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-[#E5E0D5] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
              +
            </div>

            <span className="font-extrabold text-2xl tracking-tight text-black">
              VaultCare <span className="text-[#C9A574]">AI</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-[#4A4A4A]">
            <a
              href="#platform"
              onClick={(e) => scrollToSection('platform', e)}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Platform
            </a>

            <a
              href="#how-it-works"
              onClick={(e) => scrollToSection('how-it-works', e)}
              className="hover:text-black transition-colors cursor-pointer"
            >
              How it works
            </a>

            <a
              href="#security"
              onClick={(e) => scrollToSection('security', e)}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Security
            </a>

            <a
              href="#pricing"
              onClick={(e) => scrollToSection('pricing', e)}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Pricing
            </a>
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
          {/* Translucent Overlay */}
          <div className="absolute inset-0 bg-[#EDE8DE]/45 pointer-events-none"></div>

          <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">

            {/* Left Content */}
            <div className="md:col-span-7 space-y-6">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black leading-[1.1]">
                Every Medical Report.
                <br />
                <span className="text-black">
                  Organized for Life.
                </span>
              </h1>

              <p className="text-lg text-[#333333] font-medium leading-relaxed max-w-xl">
                VaultCare AI reads your scattered lab reports, scans, and
                prescriptions – then turns years of paperwork into a timeline
                you and your doctor can actually understand.
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

            {/* Right Side Circular Image */}
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

        {/* SECTION: How VaultCare-AI works */}
        <section
          id="how-it-works"
          className="scroll-mt-24 space-y-10"
        >
          <div className="text-center max-w-3xl mx-auto space-y-3">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A574]" />
              Simple 4-Step Process
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
              How VaultCare-AI Works
            </h2>

            <p className="text-base text-[#666666] font-medium leading-relaxed">
              Four simple steps to transform your scattered lab reports into
              intelligent, actionable health insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {steps.map((step, idx) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.1
                  }}
                  className="bg-white p-8 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between hover:shadow-xl transition-all hover:-translate-y-1 relative group"
                >
                  <div className="space-y-6">

                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-full bg-[#FAF5EC] text-[#C9A574] border border-[#E3CF9B] flex items-center justify-center shadow-xs group-hover:bg-[#C9A574] group-hover:text-white transition-colors duration-300">
                        <Icon className="w-6 h-6" />
                      </div>

                      <span className="text-2xl font-black text-[#C9A574] font-mono">
                        {step.num}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold text-black">
                        {step.title}
                      </h3>

                      <p className="text-xs text-[#666666] font-medium leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#FAF8F5] flex items-center justify-between text-[11px] font-bold text-[#999999] group-hover:text-black transition-colors">
                    <span>
                      Step {idx + 1} of 4
                    </span>

                    <ChevronRight className="w-4 h-4 text-[#C9A574]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 1: Features Section */}
        <section
          id="platform"
          className="scroll-mt-24 space-y-12"
        >
          <div className="text-center max-w-3xl mx-auto space-y-3">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] text-xs font-bold">
              <Cpu className="w-3.5 h-3.5 text-[#C9A574]" />
              Comprehensive Platform
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
              Why VaultCare AI
            </h2>

            <p className="text-base text-[#666666] font-medium leading-relaxed">
              Everything you need to take complete ownership of your lifelong
              medical history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {features.map((feat, idx) => {
              const Icon = feat.icon;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.08
                  }}
                  className="bg-white p-8 rounded-2xl border border-[#E5E0D5] shadow-vault-card hover:shadow-xl transition-all space-y-4"
                >
                  <div className="w-12 h-12 bg-[#FAF5EC] text-[#C9A574] rounded-xl flex items-center justify-center border border-[#E3CF9B]">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-extrabold text-black">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-[#666666] font-medium leading-relaxed">
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: Security & Privacy */}
        <section
          id="security"
          className="scroll-mt-24 space-y-10"
        >
          <div className="bg-[#E8E2D5] rounded-3xl p-8 md:p-14 border border-[#DCD5C6] shadow-vault-lg space-y-8 relative overflow-hidden">

            <div className="max-w-3xl space-y-3">

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#916D41] border border-[#E3CF9B] text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-[#C9A574]" />
                Enterprise-Grade Protection
              </div>

              <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
                Built for Lifelong Medical Privacy & Security
              </h2>

              <p className="text-base text-[#444444] font-medium leading-relaxed">
                Your sensitive health data is protected by enterprise-grade
                encryption, role-based access control, and strict privacy
                standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>

                <h3 className="text-base font-extrabold text-black">
                  AES 256 Encryption
                </h3>

                <p className="text-xs text-[#666666] leading-relaxed">
                  All documents uploaded to Supabase Storage are encrypted
                  both in transit and at rest.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>

                <h3 className="text-base font-extrabold text-black">
                  Supabase RLS & RBAC
                </h3>

                <p className="text-xs text-[#666666] leading-relaxed">
                  Strict Row Level Security (RLS) ensures only verified
                  patients and assigned doctors can read files.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#E5E0D5] shadow-sm space-y-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>

                <h3 className="text-base font-extrabold text-black">
                  Zero Data Selling
                </h3>

                <p className="text-xs text-[#666666] leading-relaxed">
                  We never sell, monetize, or train open models on your
                  private medical diagnostic files.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3: Social Proof & Testimonials */}
        <section className="space-y-12">

          {/* Stat Banner */}
          <div className="bg-white p-8 rounded-3xl border border-[#E5E0D5] shadow-vault-card grid grid-cols-2 md:grid-cols-4 gap-6 text-center">

            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-black">
                10,000+
              </div>
              <div className="text-xs text-[#777777] font-semibold">
                Reports Organized
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-black">
                500+
              </div>
              <div className="text-xs text-[#777777] font-semibold">
                Verified Doctors
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-black">
                99.98%
              </div>
              <div className="text-xs text-[#777777] font-semibold">
                System Uptime
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-black">
                84/100
              </div>
              <div className="text-xs text-[#777777] font-semibold">
                Avg Health Score
              </div>
            </div>

          </div>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {testimonials.map((t, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.4,
                  delay: idx * 0.1
                }}
                className="bg-white p-8 rounded-2xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">

                  <div className="flex items-center gap-1 text-[#C9A574]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current"
                      />
                    ))}
                  </div>

                  <p className="text-xs text-[#333333] font-medium leading-relaxed italic">
                    "{t.quote}"
                  </p>

                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#FAF8F5]">

                  <div className="w-10 h-10 rounded-full bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] font-extrabold text-xs flex items-center justify-center">
                    {t.name.charAt(0)}
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-black">
                      {t.name}
                    </h4>

                    <p className="text-[11px] text-[#777777] font-semibold">
                      {t.role}
                    </p>
                  </div>

                </div>
              </motion.div>
            ))}

          </div>
        </section>

        {/* SECTION 4: Pricing Section */}
        <section
          id="pricing"
          className="scroll-mt-24 space-y-12"
        >

          <div className="text-center max-w-3xl mx-auto space-y-3">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#C9A574]" />
              Transparent Plans
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight">
              Simple, Transparent Pricing
            </h2>

            <p className="text-base text-[#666666] font-medium leading-relaxed">
              Choose the plan that fits your personal or family health record
              needs.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Free Plan */}
            <div className="bg-white p-8 rounded-3xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between space-y-6">

              <div className="space-y-4">

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-black">
                    Basic Vault
                  </h3>

                  <p className="text-xs text-[#777777]">
                    Free forever for individuals
                  </p>
                </div>

                <div className="text-3xl font-black text-black">
                  ₹0{' '}
                  <span className="text-xs font-normal text-gray-500">
                    / forever
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-[#333333] pt-2">

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Up to 10 report uploads
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Basic biometrics trend charts
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Health Timeline access
                  </li>

                </ul>
              </div>

              <button
                onClick={() => onNavigate('role-select')}
                className="w-full bg-[#FAF8F5] hover:bg-[#F4F0E8] text-black border border-black py-3 rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Get Started Free
              </button>

            </div>

            {/* Pro Plan */}
            <div className="bg-[#1A1A1A] text-white p-8 rounded-3xl border-2 border-[#C9A574] shadow-vault-lg flex flex-col justify-between space-y-6 relative transform md:-translate-y-2">

              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A574] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                Most Popular
              </div>

              <div className="space-y-4">

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-white">
                    VaultCare Pro
                  </h3>

                  <p className="text-xs text-gray-400">
                    Complete AI health analysis
                  </p>
                </div>

                <div className="text-4xl font-black text-white">
                  ₹999{' '}
                  <span className="text-xs font-normal text-gray-400">
                    / year
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-gray-200 pt-2">

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Unlimited report uploads
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    AI Health Summary & Q&A assistant
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Server-side PDF export via pdfkit
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Razorpay protected checkout
                  </li>

                </ul>
              </div>

              <button
                onClick={() =>
                  triggerPlanCheckout(
                    'VaultCare Pro Plan',
                    999
                  )
                }
                className="w-full bg-[#C9A574] hover:bg-[#B58E5C] text-white py-3.5 rounded-full font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                Upgrade to Pro (₹999)
              </button>

            </div>

            {/* Family Plan */}
            <div className="bg-white p-8 rounded-3xl border border-[#E5E0D5] shadow-vault-card flex flex-col justify-between space-y-6">

              <div className="space-y-4">

                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-black">
                    Family Vault
                  </h3>

                  <p className="text-xs text-[#777777]">
                    Up to 5 family members
                  </p>
                </div>

                <div className="text-3xl font-black text-black">
                  ₹1,999{' '}
                  <span className="text-xs font-normal text-gray-500">
                    / year
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-[#333333] pt-2">

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    5 Patient vault profiles
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Unlimited OCR & AI extractions
                  </li>

                  <li className="flex items-center gap-2 font-semibold">
                    <Check className="w-4 h-4 text-[#C9A574]" />
                    Dedicated doctor sharing portal
                  </li>

                </ul>
              </div>

              <button
                onClick={() =>
                  triggerPlanCheckout(
                    'Family Vault Plan',
                    1999
                  )
                }
                className="w-full bg-black hover:bg-[#2a2a2a] text-white py-3 rounded-full font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                Choose Family Plan
              </button>

            </div>
          </div>
        </section>

        {/* SECTION 5: CTA Banner */}
        <section className="bg-[#E8E2D5] rounded-3xl p-10 md:p-16 text-center text-black space-y-6 shadow-vault-lg border border-[#DCD5C6] relative overflow-hidden">

          <div className="max-w-2xl mx-auto space-y-4">

            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black">
              Start organizing your health today
            </h2>

            <p className="text-sm md:text-base text-[#444444] font-medium leading-relaxed">
              Turn years of scattered paperwork into a single intelligent
              timeline you and your doctor can rely on.
            </p>

          </div>

          <div className="flex justify-center pt-2">

            <button
              onClick={() => onNavigate('role-select')}
              className="bg-black hover:bg-[#2a2a2a] text-white px-10 py-4 rounded-full text-base font-extrabold shadow-xl transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
            >
              <span>Create your vault</span>

              <ArrowRight className="w-5 h-5 text-[#C9A574]" />
            </button>

          </div>
        </section>
      </main>

      {/* SECTION 6: Detailed Footer */}
      <footer className="bg-[#E8E2D5] text-[#555555] border-t border-[#DCD5C6] mt-20 pt-16 pb-12 select-none">

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#DCD5C6]">

          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">

            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => onNavigate('landing')}
            >
              <div className="w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center font-extrabold text-xl shadow-md">
                +
              </div>

              <span className="font-extrabold text-2xl tracking-tight text-black">
                VaultCare <span className="text-[#C9A574]">AI</span>
              </span>
            </div>

            <p className="text-xs text-[#555555] leading-relaxed max-w-sm font-medium">
              VaultCare AI is an AI-powered personal health record platform
              designed to organize scattered lab reports, scans, and
              prescriptions into a unified, encrypted health timeline.
            </p>

            <div className="flex items-center gap-4 text-[#555555] pt-2">

              <a
                href="#"
                className="hover:text-[#C9A574] transition-colors"
              >
                <FaTwitter className="w-4 h-4" />
              </a>

              <a
                href="#"
                className="hover:text-[#C9A574] transition-colors"
              >
                <FaLinkedin className="w-4 h-4" />
              </a>

              <a
                href="#"
                className="hover:text-[#C9A574] transition-colors"
              >
                <FaInstagram className="w-4 h-4" />
              </a>

            </div>
          </div>

          {/* Col 2: Product */}
          <div className="space-y-3 text-xs">

            <h4 className="text-sm font-extrabold text-black uppercase tracking-wider">
              Product
            </h4>

            <ul className="space-y-2 font-medium">

              <li>
                <a
                  href="#platform"
                  onClick={(e) => scrollToSection('platform', e)}
                  className="hover:text-black transition-colors"
                >
                  Platform
                </a>
              </li>

              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection('how-it-works', e)}
                  className="hover:text-black transition-colors"
                >
                  How it works
                </a>
              </li>

              <li>
                <a
                  href="#security"
                  onClick={(e) => scrollToSection('security', e)}
                  className="hover:text-black transition-colors"
                >
                  Security
                </a>
              </li>

              <li>
                <a
                  href="#pricing"
                  onClick={(e) => scrollToSection('pricing', e)}
                  className="hover:text-black transition-colors"
                >
                  Pricing
                </a>
              </li>

            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-3 text-xs">

            <h4 className="text-sm font-extrabold text-black uppercase tracking-wider">
              Company
            </h4>

            <ul className="space-y-2 font-medium">

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('VaultCare AI About Us page');
                  }}
                  className="hover:text-black transition-colors"
                >
                  About Us
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('VaultCare AI Careers');
                  }}
                  className="hover:text-black transition-colors"
                >
                  Careers
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('VaultCare AI Health Blog');
                  }}
                  className="hover:text-black transition-colors"
                >
                  Blog
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Contact: support@vaultcare.ai');
                  }}
                  className="hover:text-black transition-colors"
                >
                  Contact
                </a>
              </li>

            </ul>
          </div>

          {/* Col 4: Legal */}
          <div className="space-y-3 text-xs">

            <h4 className="text-sm font-extrabold text-black uppercase tracking-wider">
              Legal
            </h4>

            <ul className="space-y-2 font-medium">

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Terms of Service');
                  }}
                  className="hover:text-black transition-colors"
                >
                  Terms of Service
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Privacy Policy');
                  }}
                  className="hover:text-black transition-colors"
                >
                  Privacy Policy
                </a>
              </li>

              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Cookie Policy');
                  }}
                  className="hover:text-black transition-colors"
                >
                  Cookie Policy
                </a>
              </li>

            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#777777] font-medium gap-4">

          <span>
            © 2026 VaultCare AI. All rights reserved.
          </span>

          <div className="flex gap-6">

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Terms of Service');
              }}
              className="hover:text-black"
            >
              Terms
            </a>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert('Privacy Policy');
              }}
              className="hover:text-black"
            >
              Privacy
            </a>

          </div>
        </div>
      </footer>

      {/* Razorpay Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">

          <div className="bg-white max-w-lg w-full rounded-3xl p-8 border border-[#E5E0D5] shadow-2xl relative animate-scaleUp">

            <button
              onClick={() => setShowPricingModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-black font-bold text-lg"
            >
              ×
            </button>

            <div className="text-center mb-6">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5EDD5] text-[#916D41] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Razorpay Secured Checkout
              </div>

              <h2 className="text-2xl font-black text-black">
                Upgrade to {selectedPlan.name}
              </h2>

              <p className="text-sm text-[#666666] mt-1">
                Unlimited OCR extraction, AI Chat assistant & PDF export
              </p>

            </div>

            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#E5E0D5] mb-6 space-y-3">

              <div className="flex items-center gap-2 text-sm text-black font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#C9A574]" />
                Unlimited report uploads (PDF/Images)
              </div>

              <div className="flex items-center gap-2 text-sm text-black font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#C9A574]" />
                AI Health Summary & Risk Matrix
              </div>

              <div className="flex items-center gap-2 text-sm text-black font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#C9A574]" />
                Server-side PDF export with pdfkit
              </div>

              <div className="flex items-center gap-2 text-sm text-black font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#C9A574]" />
                Doctor consultation sharing link
              </div>

            </div>

            <div className="flex items-center justify-between mb-6">

              <div>
                <span className="text-3xl font-black text-black">
                  ₹{selectedPlan.price}
                </span>

                <span className="text-xs text-gray-500">
                  {' '}
                  / year
                </span>
              </div>

              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Save 40% annually
              </span>

            </div>

            <button
              onClick={() =>
                handleRazorpayPayment(
                  selectedPlan.name,
                  selectedPlan.price
                )
              }
              className="w-full bg-black hover:bg-[#2a2a2a] text-white py-4 rounded-xl font-extrabold text-base shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              Pay ₹{selectedPlan.price} with Razorpay
            </button>

          </div>
        </div>
      )}

    </div>
  );
}