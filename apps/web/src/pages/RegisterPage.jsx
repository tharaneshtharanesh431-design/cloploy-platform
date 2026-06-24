import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, verifyOtp, resetOtpState } from '../app/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, User, Mail, Lock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { requiresOtp, otpEmail, error, token, devOtp, emailSent, emailWarning } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');

  // Clear OTP state on mount
  useEffect(() => {
    dispatch(resetOtpState());
  }, [dispatch]);

  // Navigate on successful token activation
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!form.name || !form.email || !form.password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }
    dispatch(register(form));
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP code.');
      return;
    }
    dispatch(verifyOtp({ email: otpEmail, otp }));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16" style={{ backgroundColor: '#06080F' }}>
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute top-1/4 right-1/3 -z-10 h-[500px] w-[500px] rounded-full opacity-20 blur-[160px]" style={{ background: 'radial-gradient(circle, #22D3EE 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute bottom-1/4 left-1/3 -z-10 h-[400px] w-[400px] rounded-full opacity-25 blur-[140px]" style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute top-0 left-0 -z-10 h-full w-full" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.05) 0%, transparent 60%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] shadow-2xl shadow-cyan-500/5" style={{ backgroundColor: '#161B22' }}>
          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400" />

          <div className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              {!requiresOtp ? (
                // Step 1: Registration Form
                <motion.div
                  key="register-step"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative rounded-2xl p-4" style={{ backgroundColor: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}>
                      <UserPlus size={28} strokeWidth={2.5} className="text-cyan-400" />
                      <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ backgroundColor: 'rgba(34,211,238,0.3)' }} />
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-white font-space">
                      Create Account
                    </h1>
                    <p className="mt-2 text-sm font-medium text-white/50">
                      Deploy, scan, and automate in minutes
                    </p>
                  </div>

                  {/* Error Alert */}
                  {(error || localError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-red-400"
                      style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
                    >
                      <ShieldAlert size={18} className="flex-shrink-0 text-red-400" />
                      <span>{error || localError}</span>
                    </motion.div>
                  )}

                  {/* Registration Form */}
                  <form onSubmit={handleRegisterSubmit} className="mt-8 space-y-4">
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-cyan-400">
                        <User size={18} />
                      </span>
                      <input
                        type="text"
                        className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-cyan-500/30"
                        style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                        placeholder="Full Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>

                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-cyan-400">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-cyan-500/30"
                        style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                        placeholder="Email Address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>

                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-cyan-400">
                        <Lock size={18} />
                      </span>
                      <input
                        type="password"
                        className="w-full rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white placeholder-white/30 outline-none transition-all duration-300 focus:ring-2 focus:ring-cyan-500/30"
                        style={{ backgroundColor: '#0D1117', border: '1px solid rgba(255,255,255,0.06)' }}
                        placeholder="Password (min. 8 characters)"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-2 w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
                      style={{ background: 'linear-gradient(135deg, #22D3EE 0%, #A855F7 100%)' }}
                    >
                      Create Free Account
                    </motion.button>
                  </form>

                  {/* Footer link */}
                  <p className="mt-6 text-center text-xs font-medium text-white/40">
                    Already have an account?{' '}
                    <Link className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors" to="/login">
                      Sign in
                    </Link>
                  </p>
                </motion.div>
              ) : (
                // Step 2: 2FA Registration OTP Verification
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
                      <CheckCircle2 size={28} strokeWidth={2.5} className="text-emerald-400 animate-pulse" />
                      <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{ backgroundColor: 'rgba(16,185,129,0.3)' }} />
                    </div>
                    <h1 className="mt-5 text-3xl font-bold tracking-tight text-white font-space">
                      Verify Registration
                    </h1>
                    <p className="mt-3 text-sm font-medium text-white/50 leading-relaxed">
                      {emailSent ? (
                        <>We sent a verification code to<br />
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
                    />

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                      style={{ background: 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)' }}
                    >
                      Verify & Create Account
                    </motion.button>
                  </form>

                  {/* OTP actions */}
                  <div className="mt-6 flex items-center justify-between text-xs">
                    <button
                      onClick={() => dispatch(resetOtpState())}
                      className="font-semibold text-white/40 transition-colors hover:text-white/80"
                    >
                      ← Back to signup
                    </button>
                    <span className="font-medium text-white/30">
                      {emailSent ? 'Check your email inbox' : 'Use the code shown above'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
