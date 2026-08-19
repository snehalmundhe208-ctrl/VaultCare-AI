import React,{useState, useEffect} from "react";
import {Shield,Lock,Send,CheckCirlce2} from 'lucide-react';
import {useAuth} from '../context/AuthContext';

export default function MFAPage({onNavigate,isForgotPasswordMode = true}) {
    const {user, verifyMfa} = useAuth();
    const [emailInput, setEmailInput] = useState(user?.email  || 'patient@vaultcare.ai');
    const [otpSent, setOtpSent] = useState(false);
    const[isTimerRunning, setIsTimerRunning] = useState(false);
    const [otp, setOtp] = useState(['','','','','','']); //Completely Blank by default
    const [timer, setTimer]= useState(180); //03:00 countdown
    const [showPasswordResetForm, setShowPasswordResetForm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [notification, setNotification] = useState('');

  // Countdown timer effect - ONLY runs when isTimerRunning is true
  useEffect(() => {
    if (!isTimerRunning) return;
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, [isTimerRunning]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!emailInput) {
      alert('Please enter your email address');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setIsTimerRunning(true);
      setTimer(180);
      setNotification(`6-digit OTP code sent successfully to ${emailInput}`);

      setTimeout(() => {
        const firstInput = document.getElementById('otp-input-0');
        if (firstInput) firstInput.focus();
      }, 100);
    } catch (err) {
      alert('Could not reach the server. Please check your connection.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.some(d => d === '')) {
      alert('Please enter complete 6-digit OTP code');
      return;
    }
    const result = await verifyMfa(otp.join(''), emailInput);
    if (!result.success) {
      alert(result.error || 'Invalid OTP');
      return;
    }
    setShowPasswordResetForm(true);
  };

  const handlePasswordResetSubmit = (e) => {
    e.preventDefault();
    if (!newPassword) {
      setResetError('Please enter a new password');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match');
      return;
    }

    alert('Password reset successfully! Log in with your new password.');
    onNavigate('login');
  };

  return (
    <div className="min-h-screen bg-cream-grid flex flex-col font-sans select-none">
      {/* Header Bar */}
      <header className="px-8 py-6 flex items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            +
          </div>
          <span className="font-extrabold text-lg tracking-tight text-black">
            VaultCare <span className="text-[#C9A574]">AI</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-center">
        <div className="grid md:grid-cols-12 gap-12 items-center w-full">
          
          {/* Left Side Info */}
          <div className="md:col-span-6 space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-black text-black tracking-tight leading-tight">
              Reset Your<br />Vault Password
            </h1>

            <p className="text-base text-[#444444] max-w-md font-semibold leading-relaxed">
              Forgot your password? No problem. Click "Send OTP" to receive a 6-digit verification code on your registered email.
            </p>
          </div>

          {/* Right Side Card */}
          <div className="md:col-span-6 flex justify-center">
            <div className="bg-white rounded-3xl p-8 md:p-10 border border-[#E5E0D5] shadow-vault-lg w-full max-w-lg text-center">
              
              {/* Shield Icon */}
              <div className="w-14 h-14 bg-[#FAF5EC] border border-[#E3CF9B] text-[#C9A574] rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
                <Shield className="w-7 h-7 text-[#C9A574]" />
              </div>

              {notification && (
                <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2 justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{notification}</span>
                </div>
              )}

              {/* STEP 1: Send OTP Form (Before OTP is sent, timer NOT running) */}
              {!otpSent && !showPasswordResetForm && (
                <div className="space-y-6 text-left">
                  <div className="text-center space-y-1">
                    <h2 className="text-2xl font-extrabold text-black">Request Password Reset OTP</h2>
                    <p className="text-xs text-[#666666] font-medium">Enter your registered email address below</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-[#444444] mb-1.5">Registered Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-black text-white placeholder-gray-400 px-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#C9A574]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black hover:bg-[#2a2a2a] text-white py-4 rounded-full font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Send OTP
                    </button>
                  </form>
                </div>
              )}

              {/* STEP 2: Verify OTP Form (After user clicks "Send OTP", timer running) */}
              {otpSent && !showPasswordResetForm && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-black">Enter Verification OTP</h2>
                    <p className="text-xs text-[#777777] font-medium">
                      We sent a 6-digit code to <span className="font-bold text-black">{emailInput}</span>
                    </p>
                  </div>

                  {/* 6 Blank Square OTP Inputs */}
                  <form onSubmit={handleVerify} className="space-y-6">
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-input-${idx}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          className="w-11 h-12 border-2 border-[#CCCCCC] rounded-xl text-center text-lg font-black text-black bg-white focus:border-black focus:ring-2 focus:ring-black/10 outline-none transition-all"
                        />
                      ))}
                    </div>

                    <p className="text-xs text-[#777777] font-medium">
                      code expires in <span className="font-bold text-black">{formatTimer(timer)}</span>
                    </p>

                    <button
                      type="submit"
                      className="w-full bg-black hover:bg-[#2a2a2a] text-white py-4 rounded-full font-black text-sm shadow-md transition-all cursor-pointer"
                    >
                      Verify & Continue to Reset
                    </button>
                  </form>

                  <div className="pt-2">
                    <button
                      onClick={() => { setTimer(180); setOtp(['','','','','','']); setNotification(`New 6-digit OTP code sent to ${emailInput}`); }}
                      className="text-xs text-[#777777] hover:text-black cursor-pointer"
                    >
                      Didn't get the code? <span className="text-rose-700 font-bold hover:underline">Resend OTP</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Password Reset Form (After OTP verification) */}
              {showPasswordResetForm && (
                <div className="animate-fadeIn space-y-5 text-left">
                  <div className="text-center space-y-1 mb-4">
                    <h2 className="text-2xl font-extrabold text-black">Choose New Password</h2>
                    <p className="text-xs text-[#777777] font-medium">Enter your new secure password below</p>
                  </div>

                  {resetError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
                      {resetError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#444444] mb-1.5">New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-black text-white placeholder-gray-400 px-4 py-3.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#C9A574]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#444444] mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-black text-white placeholder-gray-400 px-4 py-3.5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#C9A574]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-black hover:bg-[#2a2a2a] text-white py-4 rounded-full font-black text-sm shadow-md transition-all mt-2 cursor-pointer"
                    >
                      Reset Password
                    </button>
                  </form>
                </div>
              )}

              <div className="my-6 border-t border-[#E5E0D5]"></div>

              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-xs text-[#777777] hover:text-black font-semibold cursor-pointer"
                >
                  Back to <span className="text-rose-700 underline font-bold">Login</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#888888]">
                  <Lock className="w-3 h-3 text-[#888888]" />
                  <span>Your data stays fully encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}