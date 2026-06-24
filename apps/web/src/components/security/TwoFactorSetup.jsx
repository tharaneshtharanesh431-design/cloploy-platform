import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, AlertCircle, Shield } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';

export function TwoFactorSetup({ qrCode, secret, backupCodes, onVerify, onCancel, isLoading }) {
  const [step, setStep] = useState('scan'); // scan, verify, backup
  const [totpCode, setTotpCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (totpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      await onVerify(totpCode);
      setStep('backup');
    } catch (err) {
      setError(err.message || 'Invalid code, please try again');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <GlassCard className="w-full max-w-2xl mx-auto border border-white/5 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-xl bg-cyanNeon/15 p-2.5 text-cyanNeon border border-cyanNeon/25">
          <Shield size={24} />
        </div>
        <h2 className="text-2xl font-bold text-white">Enable Two-Factor Authentication</h2>
      </div>

      {step === 'scan' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4">Step 1: Scan QR Code</h3>
            <p className="text-sm text-white/60 mb-6">
              Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)
            </p>
            {qrCode && (
              <div className="flex justify-center mb-6">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 p-4 bg-white rounded-lg" />
              </div>
            )}
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4">Or enter manually</h3>
            <p className="text-sm text-white/60 mb-3">If you can't scan, enter this code:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white/10 rounded-lg px-4 py-2 text-sm font-mono text-cyanNeon break-all">
                {secret}
              </code>
              <button
                onClick={() => copyToClipboard(secret)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {copiedCode ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-white/60" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setStep('verify')}
            className="w-full bg-gradient-to-r from-cyanNeon to-royal py-3 rounded-lg font-semibold text-white hover:shadow-cyan transition-all"
          >
            Next: Verify Code
          </button>

          <button
            onClick={onCancel}
            className="w-full bg-white/5 border border-white/10 py-3 rounded-lg font-semibold text-white hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {step === 'verify' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4">Step 2: Verify Code</h3>
            <p className="text-sm text-white/60 mb-6">
              Enter the 6-digit code from your authenticator app to confirm it's working correctly.
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-3 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center rounded-lg border border-white/10 bg-white/5 py-3 text-2xl font-bold tracking-[0.4em] text-cyanNeon focus:border-cyanNeon/50 focus:bg-white/10 outline-none"
              />

              <button
                type="submit"
                disabled={isLoading || totpCode.length !== 6}
                className="w-full bg-gradient-to-r from-cyanNeon to-royal py-3 rounded-lg font-semibold text-white hover:shadow-cyan transition-all disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>

          <button
            onClick={() => setStep('scan')}
            className="w-full bg-white/5 border border-white/10 py-3 rounded-lg font-semibold text-white hover:bg-white/10 transition-all"
          >
            Back
          </button>
        </motion.div>
      )}

      {step === 'backup' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-300">
              <p className="font-semibold mb-1">Save your backup codes</p>
              <p>Store these codes in a safe place. Use them to regain access if you lose your authenticator.</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-sm font-semibold text-white mb-4">Backup Codes</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-lg px-3 py-2 font-mono text-sm text-white/80 border border-white/5"
                >
                  {code}
                </div>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(backupCodes.join('\n'))}
              className="flex items-center gap-2 text-sm text-cyanNeon hover:text-cyanNeon/80 transition-colors mb-6"
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              Copy all codes
            </button>
          </div>

          <button
            onClick={onCancel}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 py-3 rounded-lg font-semibold text-white hover:shadow-lg transition-all"
          >
            I've saved my backup codes - Complete Setup
          </button>
        </motion.div>
      )}
    </GlassCard>
  );
}
