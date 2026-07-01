'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

export default function TwoFactorPage() {
  const router = useRouter();
  const { login } = useAuth();
  const tempToken = useAuthStore((s) => s.tempToken);
  const requires2FA = useAuthStore((s) => s.requires2FA);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Guard: if there's no pending 2FA state, redirect to login
  useEffect(() => {
    if (!requires2FA || !tempToken) {
      router.replace('/auth/login');
    }
  }, [requires2FA, tempToken, router]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // only last char if pasted
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    pasted.split('').forEach((char, i) => {
      newCode[i] = char;
    });
    setCode(newCode);
    // Focus the last filled input or the end
    const lastIndex = Math.min(pasted.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;

    const totpCode = useBackup ? backupCode : code.join('');

    if (!useBackup && totpCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    if (useBackup && !backupCode.trim()) {
      toast.error('Please enter your backup code');
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/2fa/verify', {
        tempToken,
        code: totpCode,
      });

      if (data.success) {
        toast.success('Two-factor authentication verified! 🎉');
        login(data.data.tokens.accessToken, data.data.user, data.data.tokens.expiresIn);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearAuth();
    router.push('/auth/login');
  };

  if (!requires2FA || !tempToken) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-accent" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-display font-bold mb-2 text-white">
          Two-factor authentication
        </h1>
        <p className="text-text-secondary">
          {useBackup
            ? 'Enter one of your backup codes to continue.'
            : 'Open your authenticator app and enter the 6-digit code.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <AnimatePresence mode="wait">
          {!useBackup ? (
            <motion.div
              key="totp"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
            >
              <fieldset>
                <legend className="sr-only">Enter your 6-digit authenticator code</legend>
                <div
                  className="flex justify-between gap-2 sm:gap-3"
                  role="group"
                  aria-label="6-digit authentication code"
                >
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      id={`2fa-digit-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Digit ${index + 1} of 6`}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-mono bg-bg-secondary border border-bg-border rounded-xl focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-white"
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                    />
                  ))}
                </div>
              </fieldset>
            </motion.div>
          ) : (
            <motion.div
              key="backup"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <label
                htmlFor="backup-code"
                className="block text-sm font-medium text-text-secondary mb-1.5"
              >
                Backup code
              </label>
              <input
                id="backup-code"
                type="text"
                className="input font-mono tracking-wider"
                placeholder="xxxxxxxx"
                autoComplete="one-time-code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.trim())}
                aria-describedby="backup-code-hint"
              />
              <p id="backup-code-hint" className="text-xs text-text-muted mt-1">
                Backup codes are 8 characters long and can only be used once.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="btn-primary w-full h-12 gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-busy={loading}
        >
          {loading ? (
            <><Spinner size="sm" /> Verifying…</>
          ) : (
            <>Verify <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
      </form>

      {/* Backup code toggle */}
      <div className="mt-6 text-center space-y-3">
        <button
          type="button"
          onClick={() => {
            setUseBackup(!useBackup);
            setCode(['', '', '', '', '', '']);
            setBackupCode('');
          }}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-white transition-colors"
          aria-label={useBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
        >
          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
          {useBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
        </button>

        <div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel — back to login
          </button>
        </div>
      </div>
    </motion.div>
  );
}
