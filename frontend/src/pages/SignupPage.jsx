import React, { useState } from 'react';
import {Eye , EyeOff , Lock, ShieldCheck, FileText , TrendingUp, QrCode, Stethoscope,User, Upload, CheckCircle2 } from 'lucide-react';
import { useAuth} from '../context/AuthContext';
import { useVault} from '../context/VaultContext';

export default function SignupPage({onNavigate}) {
    const {signup} = useAuth();
    const {addDoctor} = useVault();

    //Role Selection State
    const [signupRole, setSignupRole] = useState('patient'); // 'patient' or 'doctor'

    //Form Fields State (empty by default)
    const [fullName, setFullName]= useState('');
    const [email, setEmail]= useState('');
    const [password, setPassword]= useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const[showPassword, setShowPassword]= useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agreeTerms) {
      setErrorMsg("Please agree to the Terms of Service & Privacy Policy before creating your account");
      return;
    }
    if (!fullName || !email || !password) {
      setErrorMsg("Please fill in all mandatory fields");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please check your password.");
      return;
    }

    if (signupRole === 'doctor') {
      const docName = fullName.toLowerCase().startsWith('dr.') ? fullName : `Dr. ${fullName}`;
      const newDocObj = {
        id: 'DOC-' + Math.floor(100 + Math.random() * 900),
        name: docName,
        email: email.toLowerCase().trim(),
        specialty: '',
        qualification: '',
        license: '',
        experience: '',
        hospital: '',
        status: 'Not Submitted',
        verificationStatus: 'NOT_SUBMITTED',
        joinedDate: new Date().toISOString().split('T')[0]
      };

      addDoctor(newDocObj);
    }

    const res = await signup(email, password, fullName, signupRole);
    if (res.success) {
      onNavigate('app');
    } else {
      setErrorMsg(res.error || 'Failed to create account. Please try again.');
    }
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
        <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-start w-full">
          
          {/* Left Side High-Impact Branding & Typography */}
          <div className="md:col-span-5 space-y-8 sticky top-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-950/20 bg-rose-900/5 text-rose-900 text-xs font-black tracking-wide uppercase shadow-xs">
              <Lock className="w-4 h-4 text-rose-900" />
              <span>Built for encrypted healthcare records</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.08]">
                Join<br />
                <span className="bg-gradient-to-r from-black via-[#665235] to-[#C9A574] bg-clip-text text-transparent">
                  VaultCare AI
                </span>
              </h1>

              <p className="text-sm md:text-base text-[#444444] font-medium leading-relaxed max-w-xl pt-2">
                {signupRole === 'doctor' 
                  ? 'Practitioner Registration: Create your doctor account to access assigned patient vaults, sign AI extractions, & issue prescriptions.'
                  : 'Patient Registration: Store your medical reports, AI consultations, and health timeline securely.'}
              </p>
            </div>

            {/* Role Switcher Pills */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-extrabold text-gray-600 uppercase tracking-wider">Select Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSignupRole('patient')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    signupRole === 'patient'
                      ? 'bg-black text-white border-black shadow-md'
                      : 'bg-white text-black border-[#E5E0D5] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <User className={`w-5 h-5 ${signupRole === 'patient' ? 'text-[#C9A574]' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-black">Patient</div>
                    <div className="text-[10px] opacity-70">Personal Vault</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole('doctor')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    signupRole === 'doctor'
                      ? 'bg-black text-white border-black shadow-md'
                      : 'bg-white text-black border-[#E5E0D5] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Stethoscope className={`w-5 h-5 ${signupRole === 'doctor' ? 'text-[#C9A574]' : 'text-gray-400'}`} />
                  <div>
                    <div className="text-xs font-black">Doctor / Practitioner</div>
                    <div className="text-[10px] opacity-70">Verification Req.</div>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Right Side Signup Card Form */}
          <div className="md:col-span-7 flex justify-center">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#E5E0D5] shadow-vault-lg w-full space-y-6">
              <div className="text-center space-y-2 border-b border-[#E5E0D5] pb-6">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#FAF5EC] text-[#916D41] border border-[#E3CF9B]">
                  {signupRole === 'doctor' ? '🩺 Practitioner Registration' : ' Patient Registration'}
                </span>
                <h2 className="text-3xl font-black text-black tracking-tight">Create Account</h2>
              </div>

              {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-bold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Full Name & Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-2 uppercase tracking-wider">
                      {signupRole === 'doctor' ? 'Doctor Full Name *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black text-black placeholder-gray-400 px-5 py-3.5 rounded-2xl text-xs font-semibold outline-none shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-2 uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-[#CCCCCC] focus:border-black text-black placeholder-gray-400 px-5 py-3.5 rounded-2xl text-xs font-semibold outline-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-2 uppercase tracking-wider">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] focus:border-black text-black placeholder-gray-400 px-5 py-3.5 rounded-2xl text-xs font-semibold outline-none shadow-xs pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#444444] mb-2 uppercase tracking-wider">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-[#CCCCCC] focus:border-black text-black placeholder-gray-400 px-5 py-3.5 rounded-2xl text-xs font-semibold outline-none shadow-xs pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mandatory Terms Checkbox Rule */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E0D5] flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-5 h-5 accent-black rounded-lg cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="terms" className="text-xs text-[#555555] font-semibold cursor-pointer select-none">
                    I agree to the <span className="text-rose-700 font-bold underline">Terms of Service & Privacy Policy</span>
                  </label>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={!agreeTerms}
                  className={`w-full py-4 rounded-full font-black text-base transition-all shadow-md ${
                    agreeTerms 
                      ? 'bg-black hover:bg-[#2a2a2a] text-white cursor-pointer hover:shadow-xl' 
                      : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                  }`}
                >
                  Create {signupRole === 'doctor' ? 'Doctor' : 'Patient'} Account
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs font-semibold text-[#666666]">
                  Already have an account?{' '}
                  <button 
                    onClick={() => onNavigate('login')}
                    className="text-black font-extrabold hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </span>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

