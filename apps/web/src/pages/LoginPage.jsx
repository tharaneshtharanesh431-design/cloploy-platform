import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, verifyLoginOtp, resetOtpState, googleLogin, resendOtp, setToken, fetchMe } from '../app/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, Lock, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requiresOtp, otpEmail, error, token, emailSent, resendStatus, devOtp, emailWarning } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    dispatch(resetOtpState());
    
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlError = params.get('error');
    if (urlToken) {
      dispatch(setToken(urlToken));
      dispatch(fetchMe());
      navigate('/dashboard');
    } else if (urlError) {
      setLocalError(urlError);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.email || !form.password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    dispatch(login(form));
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP code.');
      return;
    }
    dispatch(verifyLoginOtp({ email: otpEmail, otp }));
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    dispatch(resendOtp(otpEmail));
    setResendCooldown(60);
  };

  const handleGoogleAccountSelect = (email, name) => {
    dispatch(googleLogin({ email, name }));
    setShowGooglePopup(false);
  };

  const handleGoogleLoginRedirect = () => {
    const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3121'
      : '';
    window.location.href = `${apiBase}/api/auth/google`;
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail || !customGoogleName) return;
    dispatch(googleLogin({ email: customGoogleEmail, name: customGoogleName }));
    setShowGooglePopup(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16" style={{ backgroundColor: '#06080F' }}>
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/3 -z-10 h-[500px] w-[500px] rounded-full opacity-30 blur-[160px]" style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute bottom-1/4 right-1/3 -z-10 h-[400px] w-[400px] rounded-full opacity-20 blur-[140px]" style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl shadow-purple-500/5" style={{ backgroundColor: '#161B22' }}>
          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500" />

          <div className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              {!requiresOtp ? (
                <motion.div
                  key="login-step"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative rounded-2xl p-4" style={{ backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                      <KeyRound size={28} strokeWidth={2.5} className="text-purple-400" />
                      <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ backgroundColor: 'rgba(168,85,247,0.3)' }} />
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-white font-space">
                      Welcome Back
                    </h1>
                    <p className="mt-2 text-sm font-medium text-white/50">
                      Sign in to your Cloud Command Center
                    </p>
                  </div>

                  {/* Error Alert */}
                  {(error || localError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-red-400"
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <ShieldAlert size={18} className="flex-shrink-0 text-red-400" />
                      <span>{error || localError}</span>
                    </motion.div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-purple-500/30"
                        style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                        placeholder="Email Address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>

                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-purple-400">
                        <Lock size={18} />
                      </span>
                      <input
                        type="password"
                        className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-purple-500/30"
                        style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                        placeholder="Password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                      style={{ background: 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)' }}
                    >
                      Continue
                    </motion.button>
                  </form>

                  {/* Divider */}
                  <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-white/[0.06]" />
                    <span className="mx-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">or</span>
                    <div className="flex-grow border-t border-white/[0.06]" />
                  </div>

                  {/* Google Button */}
                  <motion.button
                    type="button"
                    onClick={handleGoogleLoginRedirect}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-3 rounded-xl py-3.5 text-sm font-semibold text-white/80 transition-all duration-300 hover:border-white/10 hover:text-white"
                    style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.97 1 12 1 7.35 1 3.39 3.67 1.5 7.56l3.89 3.02C6.31 7.57 8.95 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                      <path fill="#FBBC05" d="M5.39 14.58c-.24-.73-.39-1.51-.39-2.33s.14-1.6.39-2.33L1.5 6.9C.54 8.84 0 11 0 13s.54 4.16 1.5 6.1l3.89-3.02z" />
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.1.74-2.52 1.18-4.23 1.18-3.05 0-5.69-2.53-6.61-5.54L1.5 15.85C3.39 19.74 7.35 23 12 23z" />
                    </svg>
                    <span>Continue with Google</span>
                  </motion.button>

                  {/* Footer link */}
                  <p className="text-center text-xs font-medium text-white/40">
                    Don't have an account?{' '}
                    <Link className="font-semibold text-purple-400 hover:text-purple-300 transition-colors" to="/register">
                      Create one
                    </Link>
                  </p>
                </motion.div>
              ) : (
                /* OTP Verification Step */
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* OTP Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative rounded-2xl p-4" style={{ backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 size={28} strokeWidth={2.5} className="text-emerald-400" />
                      <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }} />
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-white font-space">
                      Security Code
                    </h1>
                    <p className="mt-3 text-sm font-medium text-white/50 leading-relaxed">
                      {emailSent ? (
                        <>We sent a 2FA verification code to<br />
                        <span className="font-bold text-purple-400">{otpEmail}</span></>
                      ) : (
                        <span className="font-semibold text-amber-400">⚠️ Email could not be sent. Check server logs.</span>
                      )}
                    </p>
                  </div>

                  {/* Dev mode OTP display */}
                  {devOtp && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-6 rounded-xl px-4 py-5 text-center"
                      style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">🔧 Dev Mode — Ethereal Email</p>
                      <p className="text-3xl font-bold tracking-[0.3em] text-amber-400 font-space">{devOtp}</p>
                      <p className="mt-3 text-[10px] font-medium text-white/30">Set SMTP_PASS in .env with a Google App Password to send real emails</p>
                    </motion.div>
                  )}

                  {/* Email warning */}
                  {emailWarning && !devOtp && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-semibold text-amber-400"
                      style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
                    >
                      <ShieldAlert size={16} className="flex-shrink-0" />
                      <span>{emailWarning}</span>
                    </motion.div>
                  )}

                  {/* Error Alert */}
                  {(error || localError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-red-400"
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <ShieldAlert size={18} className="flex-shrink-0" />
                      <span>{error || localError}</span>
                    </motion.div>
                  )}

                  {/* OTP Form */}
                  <form onSubmit={handleOtpSubmit} className="mt-8 space-y-5">
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full text-center rounded-xl py-4 text-2xl font-bold tracking-[0.4em] text-white placeholder-white/20 outline-none transition-all duration-300 focus:ring-2 focus:ring-purple-500/30 font-space"
                      style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      autoFocus
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                      style={{ background: 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)' }}
                    >
                      Verify & Authenticate
                    </motion.button>
                  </form>

                  {/* OTP actions */}
                  <div className="mt-6 flex items-center justify-between text-xs">
                    <button
                      onClick={() => dispatch(resetOtpState())}
                      className="font-semibold text-white/40 transition-colors hover:text-white/80"
                    >
                      ← Back to login
                    </button>

                    <button
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || resendStatus === 'loading'}
                      className={`flex items-center gap-1.5 font-semibold transition-colors ${
                        resendCooldown > 0 ? 'cursor-not-allowed text-white/20' : 'text-purple-400 hover:text-purple-300'
                      }`}
                    >
                      <RefreshCw size={14} strokeWidth={2.5} className={resendStatus === 'loading' ? 'animate-spin' : ''} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>

                  <p className="mt-5 text-center text-xs font-medium text-white/30">
                    Check your email inbox & spam folder
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Google Auth Popup Modal */}
      <AnimatePresence>
        {showGooglePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-white/[0.06] p-6 text-left shadow-2xl shadow-black/40"
              style={{ backgroundColor: '#161B22' }}
            >
              {/* Modal Header */}
              <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="flex items-center gap-2.5">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.97 1 12 1 7.35 1 3.39 3.67 1.5 7.56l3.89 3.02C6.31 7.57 8.95 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.89c2.18-2.01 3.7-4.99 3.7-8.62z" />
                    <path fill="#FBBC05" d="M5.39 14.58c-.24-.73-.39-1.51-.39-2.33s.14-1.6.39-2.33L1.5 6.9C.54 8.84 0 11 0 13s.54 4.16 1.5 6.1l3.89-3.02z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.73-2.89c-1.1.74-2.52 1.18-4.23 1.18-3.05 0-5.69-2.53-6.61-5.54L1.5 15.85C3.39 19.74 7.35 23 12 23z" />
                  </svg>
                  <span className="text-sm font-bold text-white">Sign in with Google</span>
                </div>
                <button
                  onClick={() => { setShowGooglePopup(false); setShowCustomGoogleInput(false); }}
                  className="text-xs font-semibold text-white/40 transition-colors hover:text-white/80"
                >
                  Close
                </button>
              </div>

              {!showCustomGoogleInput ? (
                <div className="space-y-3">
                  <p className="mb-4 text-xs font-medium text-white/40">Choose an account to continue to Cloploy</p>

                  {/* Default Google Account */}
                  <button
                    onClick={() => handleGoogleAccountSelect('tharaneshtharanesh431@gmail.com', 'Tharaneesh')}
                    className="flex w-full items-center justify-between rounded-xl p-4 text-left transition-all duration-300 hover:border-purple-500/30"
                    style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">Tharaneesh</div>
                      <div className="mt-0.5 text-[10px] font-medium text-white/40">tharaneshtharanesh431@gmail.com</div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-purple-400" style={{ backgroundColor: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
                      Default
                    </span>
                  </button>

                  {/* Use another account */}
                  <button
                    onClick={() => setShowCustomGoogleInput(true)}
                    className="w-full rounded-xl border border-dashed border-white/[0.08] py-4 text-xs font-medium text-white/40 transition-all duration-300 hover:border-white/20 hover:text-white/60"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    Use another account
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Google Full Name</label>
                    <input
                      type="text" required placeholder="e.g. John Doe"
                      className="w-full rounded-xl px-3.5 py-3 text-xs font-medium text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-purple-500/30"
                      style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">Google Email Address</label>
                    <input
                      type="email" required placeholder="e.g. johndoe@gmail.com"
                      className="w-full rounded-xl px-3.5 py-3 text-xs font-medium text-white placeholder-white/20 outline-none transition-all focus:ring-2 focus:ring-purple-500/30"
                      style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleInput(false)}
                      className="flex-1 rounded-xl py-3 text-xs font-semibold text-white/60 transition-all hover:text-white"
                      style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition-all"
                      style={{ background: 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)' }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
