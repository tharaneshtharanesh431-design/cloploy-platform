import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertCircle, KeyRound } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

export function TwoFactorVerification({ email, onVerify, onUseBackupCode, isLoading, error }) {
  const [totpCode, setTotpCode] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [localError, setLocalError] = useState('');

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (totpCode.length !== 6) {
      setLocalError('Please enter a valid 6-digit code');
      return;
    }

    await onVerify(totpCode);
  };

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (backupCode.length < 6) {
      setLocalError('Invalid backup code');
      return;
    }

    await onUseBackupCode(backupCode);
  };

  return (
    <GlassCard className="relative overflow-hidden border border-white/5 shadow-glow p-8 md:p-10 w-full max-w-md">
      <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-cyanNeon via-royal to-gold" />

      {!showBackupCode ? (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-royal/15 p-3.5 text-royal border border-royal/25 shadow-lg">
              <KeyRound size={26} />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white font-space">
              Authenticate
            </h1>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-400"
            >
              <ShieldAlert size={18} className="flex-shrink-0" />
              <span>{error || localError}</span>
            </motion.div>
          )}

          <form onSubmit={handleTotpSubmit} className="mt-8 space-y-5">
            <input
              type="text"
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full text-center rounded-2xl border border-white/5 bg-white/5 py-4 text-2xl font-bold tracking-[0.4em] text-royal placeholder-white/10 focus:border-royal/50 focus:bg-white/10 transition-all duration-300 outline-none font-space"
            />

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="w-full rounded-2xl bg-gradient-to-r from-royal to-cyanNeon py-4 font-bold text-white shadow-cyan hover:shadow-glow transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </motion.button>
          </form>

          <button
            onClick={() => setShowBackupCode(true)}
            className="mt-6 w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Use backup code instead
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="rounded-2xl bg-amber-500/15 p-3.5 text-amber-400 border border-amber-500/25 shadow-lg">
              <AlertCircle size={26} />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white font-space">
              Backup Code
            </h1>
            <p className="mt-3 text-sm text-white/60 leading-relaxed">
              Enter one of your backup codes to continue
            </p>
          </div>

          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-400"
            >
              <ShieldAlert size={18} className="flex-shrink-0" />
              <span>{error || localError}</span>
            </motion.div>
          )}

          <form onSubmit={handleBackupCodeSubmit} className="mt-8 space-y-5">
            <input
              type="text"
              autoFocus
              placeholder="XXXXXXXX"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
              className="w-full text-center rounded-2xl border border-white/5 bg-white/5 py-4 text-xl font-mono text-amber-400 placeholder-white/10 focus:border-amber-500/50 focus:bg-white/10 transition-all duration-300 outline-none"
            />

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-4 font-bold text-white shadow-lg transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify Backup Code'}
            </motion.button>
          </form>

          <button
            onClick={() => setShowBackupCode(false)}
            className="mt-6 w-full text-center text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Back to authenticator code
          </button>
        </motion.div>
      )}
    </GlassCard>
  );
}
