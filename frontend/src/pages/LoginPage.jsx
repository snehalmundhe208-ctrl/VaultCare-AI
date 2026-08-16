import React ,{useState} from "react";
import { Stethoscope, ShieldCheck, FileText, TrendingUp, QrCode } from 'lucide-react';
import {useAuth} from "../context/AuthContext";
import GoogleOAuthModal from "../components/GoogleOAuthModal";

export default function LoginPage({onNavigate}) {
    const {login} = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showGoogleModal, setShowGoogleModal] = useState(false);

   const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both Email and Password');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      onNavigate('app');
    } else {
      setErrorMsg(res.error || ' Incorrect password or credentials. Please check your password and try again.');
    }
  };

  const handleGoogleSuccess = (googleEmail, googleName) => {
    login(googleEmail, 'oauth-google-pass');
    setShowGoogleModal(false);
    onNavigate('app');
  };

  const handleForgotPasswordClick = () => {
    onNavigate('forgot-mfa');
  };

  return (
    <div className="min-h-screen bg-cream-grid flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
            +
          </div>
          <span className="font-extrabold text-xl tracking-tight text-black">
            VaultCare <span className="text-[#C9A574]">AI</span>
          </span>
        </div>
      </header>

      {/* Main Split Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-8 flex items-center justify-center">
        <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* Left Side High-Impact Branding & Typography */}
          <div className="md:col-span-6 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-950/20 bg-rose-900/5 text-rose-900 text-xs font-black tracking-wide uppercase shadow-xs">
              <Stethoscope className="w-4 h-4 text-rose-900" />
              <span>Built for lifelong medical records</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-black tracking-tight leading-[1.08]">
                Welcome back to<br />
                <span className="bg-gradient-to-r from-black via-[#665235] to-[#C9A574] bg-clip-text text-transparent">
                  your HealthVault..
                </span>
              </h1>

              <p className="text-base md:text-lg text-[#444444] font-medium leading-relaxed max-w-xl pt-2">
                Access every report, scan, prescription, and AI extraction organized into one timeline you and your doctor can understand.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-lg pt-2">
              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-black">256-Bit SHA Encryption</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-black">AI OCR Extraction</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-black">Biometric Trends</span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-[#E5E0D5] flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-xs font-extrabold text-black">Digital QR Passport</span>
              </div>
            </div>

          </div>

          {/* Right Side Single Clean Login Form (No 2-option toggle!) */}
          <div className="md:col-span-6 flex justify-center">
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#E5E0D5] shadow-vault-lg w-full max-w-xl space-y-6">
              <div className="text-center space-y-2 border-b border-[#E5E0D5] pb-6">
                <h2 className="text-3xl font-black text-black tracking-tight">Login</h2>
                <p className="text-xs md:text-sm text-[#666666] font-semibold">
                  Enter your credentials to access your vault
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-2 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. snehal@gmail.com or ananya@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-[#CCCCCC] focus:border-black text-black placeholder-gray-400 px-5 py-3.5 rounded-2xl text-xs font-semibold outline-none transition-all shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#444444] uppercase tracking-wider">Password</label>
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-xs font-extrabold text-rose-700 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#CCCCCC] focus:border-black text-black placeholder-gray-400 px-5 py-3.5 rounded-2xl text-xs font-semibold outline-none transition-all shadow-xs"
                  />
                </div>

                {/* Single Clean Login Button */}
                <button
                  type="submit"
                  className="w-full bg-black hover:bg-[#2a2a2a] text-white py-4 rounded-full font-black text-base shadow-md hover:shadow-xl transition-all cursor-pointer mt-2"
                >
                  Login
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E0D5]"></div>
                </div>
                <span className="relative bg-white px-4 text-xs font-bold text-[#888888] uppercase tracking-wider">
                  or continue with
                </span>
              </div>

              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full bg-white hover:bg-[#FAF8F5] text-black border-2 border-[#E5E0D5] py-3.5 rounded-full font-extrabold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.25 21.3 7.31 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.21 0 10.05 0 12s.46 3.79 1.28 5.42l4-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Google
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#777777] font-semibold">
                  Don't have an account yet?{' '}
                  <button onClick={() => onNavigate('signup')} className="text-rose-700 font-bold hover:underline cursor-pointer">
                    Sign Up
                  </button>
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Google OAuth Modal */}
      <GoogleOAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
}