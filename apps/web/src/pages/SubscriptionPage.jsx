import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { GlassCard } from '../components/common/GlassCard';
import { api } from '../api/client';
import { updateUser } from '../app/slices/authSlice';
import { motion } from 'framer-motion';
import { QrCode, CreditCard, CheckCircle2, ShieldAlert, Award, Calendar, Check, Loader2 } from 'lucide-react';

export function SubscriptionPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  const [plan, setPlan] = useState('weekly'); // weekly or monthly
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  useEffect(() => {
    const fetchQr = async () => {
      setLoadingQr(true);
      try {
        const { data } = await api.get(`/subscription/qr?plan=${plan}`);
        setQrCode(data.qrCode);
      } catch (err) {
        console.error('Failed to load dynamic QR code', err);
      } finally {
        setLoadingQr(false);
      }
    };
    fetchQr();
  }, [plan]);

  const submit = async (e) => {
    e.preventDefault();
    if (!reference) {
      setStatus('error');
      setMessage('Please enter your payment reference code.');
      return;
    }
    if (!/^\d{12}$/.test(reference)) {
      setStatus('error');
      setMessage('Invalid reference code. Must be a 12-digit numeric transaction ID.');
      return;
    }
    
    setStatus('loading');
    setMessage('Connecting to UPI Gateway & verifying transaction status...');

    // 3-second simulation step
    setTimeout(async () => {
      try {
        const { data } = await api.post('/subscription/subscribe', {
          plan,
          paymentReference: reference
        });
        dispatch(updateUser(data.user));
        setStatus('success');
        setMessage(data.message);
        setReference('');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Subscription activation failed.');
      }
    }, 3000);
  };

  const getPrice = () => {
    return plan === 'weekly' ? '₹120 / week' : '₹400 / month';
  };

  return (
    <div className="space-y-8 max-w-4xl relative pb-10">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-gradient-to-r from-amber-500 to-transparent" />
          <p className="text-xs uppercase tracking-[0.35em] text-amber-400 font-semibold font-space">Billing & Quota</p>
        </div>
        <h1 className="text-4xl font-extrabold font-space text-white">Subscription Management</h1>
        <p className="mt-2 text-sm text-white/40">Upgrade your plan to unlock unlimited deployments and premium features.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Current Status & Plan Selection */}
        <div className="space-y-6">
          {/* Current Status Card */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22] rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Award className="text-amber-400" size={20} />
              </div>
              <h2 className="text-lg font-bold font-space text-white">Current Status</h2>
            </div>
            
            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
                <span className="text-sm text-white/50 font-sans">Subscription Tier</span>
                <span className={`rounded-full px-3.5 py-1 text-[10px] font-bold font-space uppercase tracking-wider border ${
                  user?.subscription?.status === 'active' 
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                    : 'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {user?.subscription?.status === 'active' 
                    ? `${user?.subscription?.plan} Plan` 
                    : 'Free Starter'}
                </span>
              </div>

              {user?.subscription?.status === 'active' && (
                <div className="flex justify-between items-center bg-[#0D1117] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Calendar size={15} />
                    <span>Expires At</span>
                  </div>
                  <span className="text-sm font-semibold font-mono text-white/80">
                    {new Date(user.subscription.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Plan Selection Form */}
          <GlassCard className="border border-white/[0.06] bg-[#161B22] rounded-2xl">
            <h2 className="text-lg font-bold font-space text-white flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <CreditCard size={16} className="text-purple-400" />
              </div>
              Upgrade Subscription
            </h2>
            <p className="mt-2 text-sm text-white/40 font-sans">
              Select your plan and scan the UPI QR code on the right to pay.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPlan('weekly')}
                  className={`rounded-2xl border p-5 text-center transition-all duration-300 relative overflow-hidden group ${
                    plan === 'weekly' 
                      ? 'border-amber-500/40 bg-amber-500/5 text-white shadow-[0_0_20px_rgba(245,158,11,0.08)]' 
                      : 'border-white/[0.06] bg-[#0D1117] text-white/50 hover:bg-[#161B22] hover:border-white/10'
                  }`}
                >
                  {plan === 'weekly' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-purple-500" />}
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] font-space text-amber-400">Weekly Pro</div>
                  <div className="mt-2 text-2xl font-extrabold font-space">₹120</div>
                  <div className="text-[10px] text-white/30 mt-1 font-sans">Billed weekly</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan('monthly')}
                  className={`rounded-2xl border p-5 text-center transition-all duration-300 relative overflow-hidden group ${
                    plan === 'monthly' 
                      ? 'border-amber-500/40 bg-amber-500/5 text-white shadow-[0_0_20px_rgba(245,158,11,0.08)]' 
                      : 'border-white/[0.06] bg-[#0D1117] text-white/50 hover:bg-[#161B22] hover:border-white/10'
                  }`}
                >
                  {plan === 'monthly' && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-purple-500" />}
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] font-space text-amber-400">Monthly Pro</div>
                  <div className="mt-2 text-2xl font-extrabold font-space">₹400</div>
                  <div className="text-[10px] text-white/30 mt-1 font-sans">Billed monthly</div>
                  <div className="mt-1.5 text-[9px] text-emerald-400 font-semibold font-space">BEST VALUE</div>
                </button>
              </div>

              {/* Status Alert Messages */}
              {status === 'loading' && (
                <div className="flex items-center gap-3 rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-3.5 text-sm text-purple-300">
                  <Loader2 size={18} className="flex-shrink-0 animate-spin" />
                  <span className="font-sans">{message}</span>
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 text-sm text-emerald-400">
                  <CheckCircle2 size={18} className="flex-shrink-0" />
                  <span className="font-sans">{message}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-400">
                  <ShieldAlert size={18} className="flex-shrink-0" />
                  <span className="font-sans">{message}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.15em] font-bold text-white/30 font-space">
                  UPI Transaction ID / Reference Code (12 Digits)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  className="w-full rounded-xl border border-white/[0.06] bg-[#0D1117] px-4 py-3.5 text-sm text-white placeholder-white/20 focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 focus:bg-[#161B22] transition-all duration-300 outline-none font-mono tracking-wider"
                  placeholder="e.g. 123456789012"
                  value={reference}
                  onChange={(e) => setReference(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={status === 'loading'}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-purple-600 py-4 font-bold text-white shadow-[0_4px_20px_rgba(245,158,11,0.15)] hover:shadow-[0_4px_30px_rgba(245,158,11,0.25)] transition-all duration-300 disabled:opacity-50 font-space text-sm tracking-wide"
              >
                {status === 'loading' ? 'Verifying Reference...' : `Activate ${plan === 'weekly' ? 'Weekly' : 'Monthly'} Subscription (${getPrice()})`}
              </motion.button>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: UPI Scan QR Card */}
        <div className="flex">
          <GlassCard className="flex flex-col justify-between items-center w-full border border-amber-500/10 bg-[#161B22] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-purple-500 to-cyan-500" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center space-y-3 relative">
              <div className="mx-auto p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 w-max shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                <QrCode size={24} />
              </div>
              <h3 className="text-xl font-bold font-space text-white">Google Pay / UPI Scan</h3>
              <p className="text-xs text-white/40 max-w-xs leading-relaxed font-sans">
                Scan this QR code using GPay, PhonePe, Paytm, or any banking app.
              </p>
            </div>

            <div className="my-6 bg-[#0D1117] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-center">
              {loadingQr ? (
                <div className="w-44 h-44 flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#161B22]">
                  <Loader2 size={32} className="text-amber-400 animate-spin" />
                </div>
              ) : qrCode ? (
                <img 
                  src={qrCode} 
                  alt="UPI Payment QR Code" 
                  className="w-44 h-44 object-contain rounded-xl border border-white/10 shadow-md bg-white p-2"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center rounded-xl border border-white/[0.06] bg-[#161B22] text-xs text-white/30 font-sans">
                  Failed to load QR
                </div>
              )}
            </div>

            <div className="w-full space-y-4">
              <div className="bg-[#0D1117] rounded-xl border border-white/[0.06] p-4 text-center">
                <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-semibold font-space">UPI ID</div>
                <div className="mt-1.5 text-xs font-mono font-bold text-amber-400 select-all tracking-wide">
                  tharaneshtharanesh431@okhdfcbank
                </div>
              </div>
              
              <ul className="text-[11px] text-white/40 space-y-2.5 px-1 font-sans">
                <li className="flex gap-2.5 items-start">
                  <span className="mt-0.5 flex-shrink-0 p-0.5 rounded bg-amber-500/10">
                    <Check size={10} className="text-amber-400" />
                  </span>
                  First 3 projects can be created completely free.
                </li>
                <li className="flex gap-2.5 items-start">
                  <span className="mt-0.5 flex-shrink-0 p-0.5 rounded bg-amber-500/10">
                    <Check size={10} className="text-amber-400" />
                  </span>
                  Subscription allows deployment of unlimited projects.
                </li>
              </ul>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
export default SubscriptionPage;
