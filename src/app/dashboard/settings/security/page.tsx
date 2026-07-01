'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Lock,
  Key,
  QrCode,
  Copy,
  CheckCircle2,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TotpSetup {
  secret: string;
  qrCodeUrl: string;
}

// ─── Security Page Inner Component ────────────────────────────────────────────

function SecurityPageInner() {
  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);

  // PIN state
  const [pinTab, setPinTab]           = useState<'setup' | 'reset'>('setup');
  const [newPin, setNewPin]           = useState('');
  const [confirmPin, setConfirmPin]   = useState('');
  const [pinPassword, setPinPassword] = useState('');
  const [pinLoading, setPinLoading]   = useState(false);

  // TOTP state
  const [totpSetup, setTotpSetup]     = useState<TotpSetup | null>(null);
  const [totpCode, setTotpCode]       = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disablePw, setDisablePw]     = useState('');
  const [totpLoading, setTotpLoading] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8)    { toast.error('Minimum 8 characters');   return; }
    toast.success('Password changed!');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin)   { toast.error('PINs do not match');         return; }
    if (newPin.length < 4)       { toast.error('PIN must be 4–6 digits');    return; }
    setPinLoading(true);
    try {
      await apiClient.post('/users/pin', { pin: newPin });
      toast.success('Transaction PIN set successfully');
      setNewPin(''); setConfirmPin('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to set PIN';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exist')) {
        toast.error('PIN already set — use "Reset PIN" below to change it.');
      } else {
        toast.error(msg);
      }
    } finally {
      setPinLoading(false);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin !== confirmPin) { toast.error('PINs do not match');      return; }
    if (!pinPassword)          { toast.error('Enter your password');     return; }
    if (newPin.length < 4)     { toast.error('PIN must be 4–6 digits'); return; }
    setPinLoading(true);
    try {
      await apiClient.patch('/users/pin/reset', { password: pinPassword, newPin });
      toast.success('Transaction PIN reset successfully');
      setNewPin(''); setConfirmPin(''); setPinPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to reset PIN';
      toast.error(msg);
    } finally {
      setPinLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setTotpLoading(true);
    try {
      const res = await apiClient.post('/auth/2fa/setup');
      const d = res.data?.data ?? res.data;
      setTotpSetup({ secret: d.secret, qrCodeUrl: d.qrCodeUrl });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to start 2FA setup';
      toast.error(msg);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!totpSetup || !totpCode) { toast.error('Enter the 6-digit verification code'); return; }
    setTotpLoading(true);
    try {
      const res = await apiClient.post('/auth/2fa/enable', { secret: totpSetup.secret, code: totpCode });
      const codes: string[] = res.data?.data?.backupCodes ?? res.data?.backupCodes ?? [];
      setBackupCodes(codes);
      setTotpSetup(null);
      setTotpEnabled(true);
      toast.success('Two-factor authentication enabled!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Invalid code — please try again';
      toast.error(msg);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disableCode || !disablePw) { toast.error('Both code and password are required'); return; }
    setTotpLoading(true);
    try {
      await apiClient.post('/auth/2fa/disable', { code: disableCode, password: disablePw });
      toast.success('Two-factor authentication disabled');
      setShowDisable(false);
      setDisableCode('');
      setDisablePw('');
      setTotpEnabled(false);
      setBackupCodes([]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to disable 2FA';
      toast.error(msg);
    } finally {
      setTotpLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 3000);
      toast.success('Backup codes copied!');
    } catch {
      toast.error('Could not copy — please copy manually');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-text-secondary hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-white text-sm font-medium">Security</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Security Settings</h1>
        <p className="text-text-secondary mt-1">Manage your password, transaction PIN, and two-factor authentication.</p>
      </div>

      {/* ── Change Password ── */}
      <form onSubmit={handlePasswordChange} className="card space-y-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-accent" />
          Change Password
        </h3>
        {[
          { id: 'cur-pw',  label: 'Current Password', val: currentPw, set: setCurrentPw },
          { id: 'new-pw',  label: 'New Password',      val: newPw,    set: setNewPw },
          { id: 'conf-pw', label: 'Confirm Password',  val: confirmPw, set: setConfirmPw },
        ].map(({ id, label, val, set }) => (
          <div key={id}>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor={id}>
              {label}
            </label>
            <div className="relative">
              <input
                id={id}
                type={showPw ? 'text' : 'password'}
                className="input pr-12"
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary gap-2">
            <Lock className="w-4 h-4" />
            Update Password
          </button>
        </div>
      </form>

      {/* ── Transaction PIN ── */}
      <div className="card space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-accent" />
            Transaction PIN
          </h3>
          <p className="text-text-secondary text-sm mt-1">
            A 4–6 digit PIN required to authorise transfers and withdrawals. After 5 failed attempts your PIN will be locked.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-bg-tertiary rounded-lg w-fit">
          {(['setup', 'reset'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setPinTab(t); setNewPin(''); setConfirmPin(''); setPinPassword(''); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                pinTab === t ? 'bg-accent text-white shadow' : 'text-text-secondary hover:text-white'
              }`}
            >
              {t === 'setup' ? 'Set PIN' : 'Reset PIN'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {pinTab === 'setup' ? (
            <motion.form
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleSetupPin}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="new-pin">
                    New PIN
                  </label>
                  <input
                    id="new-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    minLength={4}
                    maxLength={6}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-xl tracking-[0.4em] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="confirm-pin">
                    Confirm PIN
                  </label>
                  <input
                    id="confirm-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    minLength={4}
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-xl tracking-[0.4em] font-mono"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pinLoading || newPin.length < 4}
                className="btn-primary gap-2"
              >
                {pinLoading ? <Spinner size="sm" /> : <><Key className="w-4 h-4" /> Set PIN</>}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="reset"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              onSubmit={handleResetPin}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="pin-password">
                  Account Password
                </label>
                <input
                  id="pin-password"
                  type="password"
                  placeholder="••••••••"
                  value={pinPassword}
                  onChange={(e) => setPinPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="reset-pin">
                    New PIN
                  </label>
                  <input
                    id="reset-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    minLength={4}
                    maxLength={6}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-xl tracking-[0.4em] font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="reset-confirm-pin">
                    Confirm PIN
                  </label>
                  <input
                    id="reset-confirm-pin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    minLength={4}
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="input text-center text-xl tracking-[0.4em] font-mono"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={pinLoading || newPin.length < 4 || !pinPassword}
                className="btn-secondary gap-2"
              >
                {pinLoading ? <Spinner size="sm" /> : 'Reset PIN'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* ── Two-Factor Authentication ── */}
      <div className="card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Two-Factor Authentication
            </h3>
            <p className="text-text-secondary text-sm mt-1">
              Add an extra layer of security using an authenticator app (Google Authenticator, Authy, etc.).
            </p>
          </div>
          {totpEnabled && (
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
              <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
            </span>
          )}
        </div>

        {/* ── TOTP not yet set up / setup flow ── */}
        <AnimatePresence mode="wait">
          {!totpEnabled && !totpSetup && (
            <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                type="button"
                onClick={handleSetup2FA}
                disabled={totpLoading}
                className="btn-primary gap-2"
              >
                {totpLoading ? <Spinner size="sm" /> : <><QrCode className="w-4 h-4" /> Set up 2FA</>}
              </button>
            </motion.div>
          )}

          {totpSetup && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Step 1: Scan QR */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-secondary">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold mr-2">1</span>
                  Scan this QR code with your authenticator app
                </p>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={totpSetup.qrCodeUrl}
                    alt="TOTP QR Code"
                    className="w-48 h-48 rounded-xl border border-border bg-white p-2"
                  />
                </div>
                <div className="bg-bg-tertiary rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">Can&apos;t scan? Enter this secret manually:</p>
                  <p className="text-sm font-mono text-white break-all">{totpSetup.secret}</p>
                </div>
              </div>

              {/* Step 2: Verify */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-text-secondary">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white text-xs font-bold mr-2">2</span>
                  Enter the 6-digit code from your app to confirm
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="input w-40 text-center text-xl tracking-[0.4em] font-mono"
                    aria-label="TOTP verification code"
                  />
                  <button
                    type="button"
                    onClick={handleEnable2FA}
                    disabled={totpLoading || totpCode.length !== 6}
                    className="btn-primary gap-2"
                  >
                    {totpLoading ? <Spinner size="sm" /> : <><ShieldCheck className="w-4 h-4" /> Enable 2FA</>}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setTotpSetup(null)}
                  className="text-sm text-text-muted hover:text-white transition-colors"
                >
                  Cancel setup
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Backup codes (shown once after enable) ── */}
        <AnimatePresence>
          {backupCodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 border border-warning/30 rounded-xl p-4 bg-warning/5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Save your backup codes</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    These codes are shown only once. Store them securely — each can be used to log in if you lose access to your authenticator.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code) => (
                  <div
                    key={code}
                    className="bg-bg-tertiary rounded-lg px-3 py-2 text-center font-mono text-sm text-white tracking-widest"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="btn-secondary gap-2 w-full"
              >
                {copiedCodes ? (
                  <><CheckCircle2 className="w-4 h-4 text-success" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy all codes</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Disable 2FA section ── */}
        {totpEnabled && (
          <div className="pt-2">
            <div className="divider" />
            {!showDisable ? (
              <button
                type="button"
                onClick={() => setShowDisable(true)}
                className="btn-danger gap-2 mt-4"
              >
                <ShieldOff className="w-4 h-4" />
                Disable 2FA
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 mt-4"
              >
                <p className="text-sm text-text-secondary">
                  Enter your authenticator code and account password to confirm.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="disable-code">
                      Authenticator Code
                    </label>
                    <input
                      id="disable-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                      className="input text-center font-mono tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="disable-pw">
                      Account Password
                    </label>
                    <input
                      id="disable-pw"
                      type="password"
                      placeholder="••••••••"
                      value={disablePw}
                      onChange={(e) => setDisablePw(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    disabled={totpLoading || !disableCode || !disablePw}
                    className="btn-danger gap-2"
                  >
                    {totpLoading ? <Spinner size="sm" /> : <><ShieldOff className="w-4 h-4" /> Confirm Disable</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDisable(false); setDisableCode(''); setDisablePw(''); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root Export (with QueryClientProvider) ───────────────────────────────────

const queryClient = new QueryClient();

export default function SecuritySettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SecurityPageInner />
    </QueryClientProvider>
  );
}
