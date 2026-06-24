import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Check, AlertCircle, Loader } from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { TwoFactorSetup } from '../components/security/TwoFactorSetup';
import { api } from '../api/client';

export function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTwoFactorStatus();
  }, [token, navigate]);

  const fetchTwoFactorStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/2fa/status');
      setTwoFactorStatus(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch 2FA status');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      setError('');
      const { data } = await api.get('/2fa/setup');
      setSetupData(data);
      setShowSetup(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize 2FA setup');
    }
  };

  const handleVerifySetup = async (totpCode) => {
    try {
      setError('');
      const { data } = await api.post('/2fa/verify-setup', { token: totpCode });
      setSuccessMessage(data.message);
      setShowSetup(false);
      setSetupData(null);
      await fetchTwoFactorStatus();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Invalid code');
    }
  };

  const handleDisableTwoFactor = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const { data } = await api.post('/2fa/disable', { password: disablePassword });
      setSuccessMessage(data.message);
      setDisablePassword('');
      setShowDisablePassword(false);
      await fetchTwoFactorStatus();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06080F]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[#A855F7]/20 blur-xl animate-pulse" />
            <Loader className="relative animate-spin text-[#A855F7]" size={36} />
          </div>
          <span className="text-white/40 text-sm font-space">Loading security settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080F] py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#A855F7]/20 blur-lg" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#22D3EE] flex items-center justify-center shadow-lg shadow-[#A855F7]/20">
                <Shield className="text-white" size={26} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white font-space tracking-tight">
                Security Settings
              </h1>
              <p className="text-white/50 text-sm mt-0.5">
                Manage your account security and authentication methods
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Success Message ── */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl px-5 py-3.5 text-sm text-emerald-400"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Check size={14} />
            </div>
            {successMessage}
          </motion.div>
        )}

        {/* ── Error Message ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl px-5 py-3.5 text-sm text-red-400"
          >
            <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={14} />
            </div>
            {error}
          </motion.div>
        )}

        {/* ── Two-Factor Authentication Card ── */}
        {!showSetup ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <GlassCard className="relative overflow-hidden border border-white/[0.06] bg-[#0D1117]/80 backdrop-blur-xl rounded-2xl p-8">
              {/* Subtle gradient accent at top */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#A855F7]/40 to-transparent" />

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-space mb-2">
                    Two-Factor Authentication
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed max-w-lg">
                    Add an extra layer of security to your account by requiring a verification code from your authenticator app.
                  </p>

                  {twoFactorStatus?.enabled && (
                    <div className="mt-4 flex items-center gap-2.5 text-emerald-400">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check size={12} />
                      </div>
                      <span className="font-semibold text-sm">Enabled</span>
                      {twoFactorStatus?.verifiedAt && (
                        <span className="text-xs text-white/40">
                          since {new Date(twoFactorStatus.verifiedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase font-space ${
                  twoFactorStatus?.enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                    : 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 shadow-lg shadow-[#F59E0B]/5'
                }`}>
                  {twoFactorStatus?.enabled ? '● Active' : '○ Inactive'}
                </div>
              </div>

              {/* ── Enabled State: Backup + Disable ── */}
              {twoFactorStatus?.enabled && (
                <div className="mt-8 pt-8 border-t border-white/[0.06]">
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* Backup Codes */}
                    <div className="group relative rounded-2xl bg-[#161B22]/80 border border-white/[0.06] p-5 hover:border-[#22D3EE]/20 transition-all duration-300">
                      <div className="absolute inset-0 rounded-2xl bg-[#22D3EE]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <h3 className="text-sm font-semibold text-white mb-1.5 font-space">Backup Codes</h3>
                        <p className="text-xs text-white/40 mb-4 leading-relaxed">
                          <span className="text-[#22D3EE] font-semibold">{twoFactorStatus.backupCodesRemaining}</span> recovery codes remaining
                        </p>
                        <button
                          onClick={() => handleEnableTwoFactor()}
                          className="text-xs font-semibold text-[#22D3EE] hover:text-[#22D3EE]/80 transition-colors flex items-center gap-1.5"
                        >
                          Regenerate backup codes
                          <span className="text-[#22D3EE]/60">→</span>
                        </button>
                      </div>
                    </div>

                    {/* Disable 2FA */}
                    <div className="group relative rounded-2xl bg-[#161B22]/80 border border-white/[0.06] p-5 hover:border-red-500/20 transition-all duration-300">
                      <div className="absolute inset-0 rounded-2xl bg-red-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <h3 className="text-sm font-semibold text-white mb-1.5 font-space">Disable 2FA</h3>
                        <p className="text-xs text-white/40 mb-4 leading-relaxed">
                          Remove two-factor authentication from your account
                        </p>
                        <button
                          onClick={() => setShowDisablePassword(true)}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5"
                        >
                          Disable two-factor auth
                          <span className="text-red-400/60">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Disabled State: Enable Button ── */}
              {!twoFactorStatus?.enabled && (
                <div className="mt-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnableTwoFactor}
                    className="relative group bg-gradient-to-r from-[#A855F7] to-[#22D3EE] px-8 py-3.5 rounded-xl font-semibold text-white text-sm shadow-lg shadow-[#A855F7]/20 hover:shadow-[#A855F7]/30 transition-all duration-300"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#22D3EE] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                    <span className="relative flex items-center gap-2">
                      <Shield size={16} />
                      Enable Two-Factor Authentication
                    </span>
                  </motion.button>
                </div>
              )}
            </GlassCard>
          </motion.div>
        ) : (
          <TwoFactorSetup
            qrCode={setupData?.qrCode}
            secret={setupData?.secret}
            backupCodes={setupData?.backupCodes}
            onVerify={handleVerifySetup}
            onCancel={() => {
              setShowSetup(false);
              setSetupData(null);
              setError('');
            }}
            isLoading={false}
          />
        )}

        {/* ── Disable Password Modal ── */}
        {showDisablePassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <GlassCard className="relative overflow-hidden border border-white/[0.06] bg-[#0D1117]/95 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/40">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Shield className="text-red-400" size={18} />
                  </div>
                  <h3 className="text-xl font-bold text-white font-space">Disable 2FA</h3>
                </div>
                <p className="text-white/50 text-sm mb-6 leading-relaxed">
                  Enter your account password to confirm disabling two-factor authentication. This will reduce your account security.
                </p>

                <form onSubmit={handleDisableTwoFactor} className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 block font-space">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#161B22] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-red-500/40 focus:bg-[#161B22]/80 focus:ring-1 focus:ring-red-500/20 outline-none transition-all duration-200"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="submit"
                      className="flex-1 bg-red-500/90 hover:bg-red-500 px-4 py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 shadow-lg shadow-red-500/10 hover:shadow-red-500/20"
                    >
                      Disable 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisablePassword(false);
                        setDisablePassword('');
                      }}
                      className="flex-1 bg-[#161B22] border border-white/[0.08] hover:bg-[#161B22]/80 hover:border-white/[0.12] px-4 py-3 rounded-xl font-semibold text-white/70 text-sm transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
