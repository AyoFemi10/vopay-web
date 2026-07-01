'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import { cn, formatCurrency } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Send,
  QrCode,
  CheckCircle2,
  User,
  X,
  Star,
  ArrowLeft,
  Lock,
  PartyPopper,
  ExternalLink,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResolvedUser {
  displayName: string;
  vpxAccountNumber: string;
  username: string | null;
  avatarUrl?: string | null;
}

interface Beneficiary {
  id: string;
  displayName: string;
  email?: string | null;
  vpxAccountNumber?: string | null;
  username?: string | null;
  currency: string;
  isVopayUser: boolean;
}

interface TransferResult {
  reference?: string;
  transactionId?: string;
  id?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS', 'ZAR'];
const STEP_LABELS = ['Recipient', 'Amount', 'PIN', 'Done'];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  return (
    <div
      className="flex items-center justify-center gap-2 mb-8"
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-label={`Step ${step} of 4: ${STEP_LABELS[step - 1]}`}
    >
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done && 'bg-accent text-white',
                  active && 'bg-accent text-white ring-4 ring-accent/20',
                  !done && !active && 'bg-bg-secondary text-text-muted border border-bg-border'
                )}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-accent' : 'text-text-muted')}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn('w-8 h-0.5 mb-4 transition-all', done ? 'bg-accent' : 'bg-bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────

function QrScannerModal({
  onResult,
  onClose,
}: {
  onResult: (vpxAccountNumber: string, username: string) => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    import('html5-qrcode')
      .then(({ Html5Qrcode }) => {
        const scannerId = 'vpx-qr-scanner-div';
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            (decodedText: string) => {
              if (decodedText.startsWith('vpx:')) {
                const parts = decodedText.split(':');
                const accountNumber = parts[1] ?? '';
                const username = parts[2] ?? '';
                scanner.stop().catch(() => null);
                onResult(accountNumber, username);
              } else {
                setError('Invalid QR code. Please scan a VOPayX QR code.');
              }
            },
            () => { /* ignore per-frame errors */ }
          )
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Camera access denied';
            setError(msg);
          });
      })
      .catch(() => setError('QR scanner failed to load'));

    return () => {
      if (scannerRef.current) {
        const s = scannerRef.current as { stop: () => Promise<void>; isScanning: boolean };
        if (s.isScanning) s.stop().catch(() => null);
      }
    };
  }, [onResult]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="QR Code Scanner"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Scan QR Code</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            aria-label="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-text-muted text-sm mb-4">Point your camera at a VOPayX QR code</p>
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden bg-black" style={{ minHeight: 280 }}>
            <div id="vpx-qr-scanner-div" style={{ width: '100%' }} />
          </div>
        )}
        <button onClick={onClose} className="btn-secondary w-full mt-4">
          Cancel
        </button>
      </motion.div>
    </div>
  );
}

// ─── Recipient Chip ───────────────────────────────────────────────────────────

function RecipientChip({
  user,
  onClear,
}: {
  user: ResolvedUser;
  onClear: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/30 rounded-xl"
    >
      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0 overflow-hidden">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
        ) : (
          <User className="w-4 h-4 text-accent" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
        <p className="text-xs text-text-muted truncate">
          {user.vpxAccountNumber}
          {user.username ? ` · @${user.username}` : ''}
        </p>
      </div>
      <button
        onClick={onClear}
        className="w-7 h-7 rounded-lg bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-white transition-colors shrink-0"
        aria-label="Clear recipient"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Main Transfer Flow ───────────────────────────────────────────────────────

function TransferFlowInner() {
  const queryClient = useQueryClient();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const [step, setStep] = useState(1);
  const [showScanner, setShowScanner] = useState(false);

  // Step 1 — recipient
  const [query, setQuery] = useState('');
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 — amount
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [note, setNote] = useState('');

  // Step 3 — PIN
  const [pin, setPin] = useState('');

  // Step 4 — result
  const [result, setResult] = useState<TransferResult | null>(null);

  // ── Beneficiaries ─────────────────────────────────────────────────────────
  const { data: beneficiaries = [] } = useQuery<Beneficiary[]>({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const res = await apiClient.get('/beneficiaries');
      return (res.data?.data ?? []) as Beneficiary[];
    },
  });

  // ── Debounced lookup ──────────────────────────────────────────────────────
  const lookupUser = useCallback(
    async (q: string) => {
      if (q.length < 2) return;
      setIsResolving(true);
      try {
        const res = await apiClient.get(`/users/lookup?q=${encodeURIComponent(q)}`);
        const u = res.data?.data ?? res.data;
        if (u?.vpxAccountNumber) {
          setResolvedUser({
            displayName: u.displayName ?? u.firstName + ' ' + u.lastName,
            vpxAccountNumber: u.vpxAccountNumber,
            username: u.username ?? null,
            avatarUrl: u.avatarUrl ?? null,
          });
        }
      } catch {
        // not found — silent
      } finally {
        setIsResolving(false);
      }
    },
    []
  );

  useEffect(() => {
    if (resolvedUser) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => lookupUser(query), 500);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, resolvedUser, lookupUser]);

  // ── QR result ─────────────────────────────────────────────────────────────
  const handleQrResult = useCallback(
    (vpxAccountNumber: string, username: string) => {
      setShowScanner(false);
      setQuery(vpxAccountNumber);
      setResolvedUser({
        displayName: username ? `@${username}` : vpxAccountNumber,
        vpxAccountNumber,
        username: username || null,
        avatarUrl: null,
      });
      // Try to fetch the full display name
      lookupUser(vpxAccountNumber);
    },
    [lookupUser]
  );

  // ── Transfer mutation ─────────────────────────────────────────────────────
  const transferMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string | undefined> = {
        amount,
        currency,
        note: note || undefined,
        pin,
      };
      // Resolution priority follows design §4.5:
      // receiverVpxAccountNumber → receiverUsername → receiverEmail
      if (resolvedUser?.vpxAccountNumber) {
        payload.receiverVpxAccountNumber = resolvedUser.vpxAccountNumber;
      } else if (resolvedUser?.username) {
        payload.receiverUsername = resolvedUser.username;
      } else if (query.includes('@') && !query.startsWith('@')) {
        payload.receiverEmail = query;
      }
      const res = await apiClient.post('/transfers', payload);
      return (res.data?.data ?? res.data) as TransferResult;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const prev = queryClient.getQueryData(['transactions']);
      queryClient.setQueryData(['transactions'], (old: unknown[]) => [
        { id: 'optimistic', status: 'PENDING', amount, currency, createdAt: new Date().toISOString() },
        ...(old ?? []),
      ]);
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(['transactions'], context.prev);
      const msg =
        (_err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Transfer failed';
      toast.error(msg);
    },
    onSuccess: (data) => {
      setResult(data);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });

  const resetFlow = () => {
    setStep(1);
    setQuery('');
    setResolvedUser(null);
    setAmount('');
    setCurrency('NGN');
    setNote('');
    setPin('');
    setResult(null);
  };

  // ── Step 1: Recipient ─────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="recipient-input">
          Username, VPX number, or email
        </label>
        <div className="relative">
          <input
            id="recipient-input"
            type="text"
            placeholder="@username, VPX00000001, or email"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setResolvedUser(null);
            }}
            className="input pr-20"
            disabled={!!resolvedUser}
            aria-label="Recipient identifier"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isResolving && <Spinner size="sm" />}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center text-text-secondary hover:text-white transition-colors"
              aria-label="Scan QR code"
              title="Scan QR code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Resolved user chip */}
      {resolvedUser && (
        <RecipientChip user={resolvedUser} onClear={() => { setResolvedUser(null); setQuery(''); }} />
      )}

      {/* Beneficiaries quick-pick */}
      {!resolvedUser && beneficiaries.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Saved Beneficiaries
          </p>
          <div className="space-y-2">
            {beneficiaries.slice(0, 5).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setResolvedUser({
                    displayName: b.displayName,
                    vpxAccountNumber: b.vpxAccountNumber ?? '',
                    username: b.username ?? null,
                    avatarUrl: null,
                  });
                  setQuery(b.vpxAccountNumber ?? b.displayName);
                  if (b.currency) setCurrency(b.currency);
                }}
                className="w-full flex items-center gap-3 p-3 bg-bg-secondary border border-bg-border rounded-xl hover:border-accent/40 hover:bg-bg-hover transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{b.displayName}</p>
                  <p className="text-xs text-text-muted truncate">
                    {b.vpxAccountNumber ?? b.email ?? ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setStep(2)}
        disabled={!resolvedUser}
        aria-disabled={!resolvedUser}
        className={cn(
          'btn-primary w-full',
          !resolvedUser && 'opacity-50 cursor-not-allowed'
        )}
      >
        Next <CheckCircle2 className="w-4 h-4 ml-1" />
      </button>
    </div>
  );

  // ── Step 2: Amount ────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Recipient summary */}
      {resolvedUser && (
        <div className="flex items-center gap-3 p-3 bg-bg-secondary border border-bg-border rounded-xl">
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{resolvedUser.displayName}</p>
            <p className="text-xs text-text-muted">{resolvedUser.vpxAccountNumber}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="transfer-amount">
          Amount
        </label>
        <div className="flex gap-3">
          <input
            id="transfer-amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input flex-1 font-mono text-lg"
            aria-label="Transfer amount"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input w-24"
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="transfer-note">
          Note <span className="text-text-muted">(optional)</span>
        </label>
        <input
          id="transfer-note"
          type="text"
          placeholder="What's this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          maxLength={100}
        />
      </div>

      {/* Fee summary */}
      <div className="p-4 bg-bg-secondary border border-bg-border rounded-xl space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Transfer fee</span>
          <span className="text-success font-medium">Free</span>
        </div>
        <div className="flex justify-between border-t border-bg-border pt-2">
          <span className="text-white font-semibold">Total to debit</span>
          <span className="text-white font-bold">
            {amount ? formatCurrency(amount, currency) : '—'}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          disabled={!amount || Number(amount) <= 0}
          aria-disabled={!amount || Number(amount) <= 0}
          className={cn('btn-primary flex-1', (!amount || Number(amount) <= 0) && 'opacity-50 cursor-not-allowed')}
        >
          Continue <Lock className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );

  // ── Step 3: PIN ───────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Transfer summary */}
      <div className="p-4 bg-bg-secondary border border-bg-border rounded-xl space-y-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Transfer Summary</p>
        <div className="flex justify-between">
          <span className="text-text-secondary">To</span>
          <span className="text-white font-medium">{resolvedUser?.displayName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Amount</span>
          <span className="text-accent font-bold">{formatCurrency(amount, currency)}</span>
        </div>
        {note && (
          <div className="flex justify-between">
            <span className="text-text-secondary">Note</span>
            <span className="text-white truncate max-w-[180px]">{note}</span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2 text-center" htmlFor="transfer-pin">
          Enter your Transaction PIN
        </label>
        <input
          id="transfer-pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          minLength={4}
          maxLength={6}
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="input text-center text-2xl tracking-[0.5em] font-mono"
          autoFocus
          aria-label="Transaction PIN"
        />
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={() => transferMutation.mutate()}
          disabled={pin.length < 4 || transferMutation.isPending}
          aria-disabled={pin.length < 4 || transferMutation.isPending}
          className={cn('btn-primary flex-1', (pin.length < 4 || transferMutation.isPending) && 'opacity-50 cursor-not-allowed')}
        >
          {transferMutation.isPending ? (
            <Spinner size="sm" />
          ) : (
            <>
              <Send className="w-4 h-4" /> Confirm & Send
            </>
          )}
        </button>
      </div>
    </div>
  );

  // ── Step 4: Success ───────────────────────────────────────────────────────
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-4"
    >
      <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
        <PartyPopper className="w-10 h-10 text-success" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Transfer Successful!</h3>
        <p className="text-text-secondary text-sm">
          {formatCurrency(amount, currency)} sent to {resolvedUser?.displayName}
        </p>
      </div>
      {result?.reference && (
        <div className="p-3 bg-bg-secondary border border-bg-border rounded-xl">
          <p className="text-xs text-text-muted mb-1">Transaction Reference</p>
          <p className="font-mono text-accent text-sm">{result.reference}</p>
        </div>
      )}
      {!result?.reference && (result?.transactionId ?? result?.id) && (
        <div className="p-3 bg-bg-secondary border border-bg-border rounded-xl">
          <p className="text-xs text-text-muted mb-1">Transaction ID</p>
          <p className="font-mono text-accent text-sm">{result?.transactionId ?? result?.id}</p>
        </div>
      )}
      <div className="flex gap-3">
        <button type="button" onClick={resetFlow} className="btn-secondary flex-1">
          New Transfer
        </button>
        <a href="/dashboard/transactions" className="btn-primary flex-1 inline-flex items-center justify-center gap-2">
          <ExternalLink className="w-4 h-4" /> View Transactions
        </a>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="relative rounded-[2rem] overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0D1525 0%, #080E1C 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Decorative top-right glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-7">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-7 pb-6 border-b border-white/6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-white">Send Money</h2>
              <p className="text-sm text-text-muted">Instant · Zero fees · VOPayX users</p>
            </div>
          </div>

          {/* Step indicator */}
          {step < 4 && <StepIndicator step={step} />}

          {/* Steps */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 1 ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <QrScannerModal onResult={handleQrResult} onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Exported page ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function TransfersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TransferFlowInner />
    </QueryClientProvider>
  );
}
