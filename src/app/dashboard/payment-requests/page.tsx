'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileStore } from '@/stores/profileStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Send,
  FileQuestion,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentRequestStatus = 'PENDING' | 'FULFILLED' | 'REJECTED' | 'EXPIRED';

interface PaymentRequest {
  id: string;
  status: PaymentRequestStatus;
  amount: string;
  currency: string;
  note?: string | null;
  createdAt: string;
  requestorProfileId: string;
  payerProfileId?: string | null;
  requestorProfile?: { displayName: string; username?: string | null };
  payerProfile?: { displayName: string; username?: string | null };
  payerUser?: { id: string; email: string; firstName: string; lastName: string };
  requestorUser?: { id: string; email: string; firstName: string; lastName: string };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Fulfilled', value: 'FULFILLED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Expired', value: 'EXPIRED' },
];

const STATUS_BADGE: Record<PaymentRequestStatus, 'yellow' | 'green' | 'red' | 'gray'> = {
  PENDING: 'yellow',
  FULFILLED: 'green',
  REJECTED: 'red',
  EXPIRED: 'gray',
};

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS', 'ZAR'];

// ─── PIN Modal ────────────────────────────────────────────────────────────────

function PinModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (pin: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }
    onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-sm"
      >
        <h3 className="text-lg font-semibold text-white mb-2">Enter your PIN</h3>
        <p className="text-text-muted text-sm mb-6">
          Confirm approval by entering your transaction PIN.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
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
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={loading || pin.length < 4} className="btn-primary flex-1">
              {loading ? <Spinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Confirm</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Create Request Modal ─────────────────────────────────────────────────────

function CreateRequestModal({
  onClose,
  activeProfileId,
}: {
  onClose: () => void;
  activeProfileId: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    payerIdentifier: '',
    amount: '',
    currency: 'USD',
    note: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/payment-requests', {
        requestorProfileId: activeProfileId,
        payerIdentifier: form.payerIdentifier,
        amount: form.amount,
        currency: form.currency,
        note: form.note || undefined,
        idempotencyKey: nanoid(),
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment request sent');
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create request';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.payerIdentifier || !form.amount) {
      toast.error('Payer and amount are required');
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-md"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Request Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="payer-id">
              Payer (username, VPX number, or email)
            </label>
            <input
              id="payer-id"
              type="text"
              placeholder="@username, VPX123, or email@example.com"
              value={form.payerIdentifier}
              onChange={(e) => setForm({ ...form, payerIdentifier: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="req-amount">
                Amount
              </label>
              <input
                id="req-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="req-currency">
                Currency
              </label>
              <select
                id="req-currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input"
                style={{ width: '90px' }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="req-note">
              Note (optional)
            </label>
            <textarea
              id="req-note"
              rows={2}
              placeholder="What is this payment for?"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? <Spinner size="sm" /> : <><Send className="w-4 h-4" /> Send Request</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page (inner, needs QueryClient in context) ─────────────────────────

function PaymentRequestsInner() {
  const { user } = useAuth();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('');
  const [pinModal, setPinModal] = useState<{ requestId: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payment-requests', activeTab],
    queryFn: async () => {
      const params = activeTab ? `?status=${activeTab}` : '';
      const res = await apiClient.get(`/payment-requests${params}`);
      return (res.data.data ?? []) as PaymentRequest[];
    },
  });

  const requests = data ?? [];

  // ── Approve mutation ────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ requestId, pin }: { requestId: string; pin: string }) => {
      const res = await apiClient.post(`/payment-requests/${requestId}/approve`, { pin });
      return res.data;
    },
    onMutate: async ({ requestId }) => {
      await queryClient.cancelQueries({ queryKey: ['payment-requests', activeTab] });
      const previous = queryClient.getQueryData<PaymentRequest[]>(['payment-requests', activeTab]);
      queryClient.setQueryData<PaymentRequest[]>(['payment-requests', activeTab], (old = []) =>
        old.map((r) => (r.id === requestId ? { ...r, status: 'FULFILLED' as PaymentRequestStatus } : r))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['payment-requests', activeTab], context.previous);
      }
      const msg = (_err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Approval failed';
      toast.error(msg);
    },
    onSuccess: () => {
      toast.success('Payment request approved');
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
    onSettled: () => {
      setPinModal(null);
    },
  });

  // ── Reject mutation ─────────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await apiClient.post(`/payment-requests/${requestId}/reject`);
      return res.data;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: ['payment-requests', activeTab] });
      const previous = queryClient.getQueryData<PaymentRequest[]>(['payment-requests', activeTab]);
      queryClient.setQueryData<PaymentRequest[]>(['payment-requests', activeTab], (old = []) =>
        old.map((r) => (r.id === requestId ? { ...r, status: 'REJECTED' as PaymentRequestStatus } : r))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['payment-requests', activeTab], context.previous);
      }
      const msg = (_err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Rejection failed';
      toast.error(msg);
    },
    onSuccess: () => {
      toast.success('Payment request rejected');
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });

  // ── Helper: is this an incoming request for the current user? ───────────────
  const isIncoming = (req: PaymentRequest) =>
    req.status === 'PENDING' &&
    (req.payerUser?.id === user?.id ||
      req.payerProfile?.displayName === activeProfile?.displayName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Payment Requests</h2>
          <p className="text-text-muted text-sm mt-1">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Request
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar bg-bg-secondary rounded-xl p-1 border border-bg-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.value
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-white hover:bg-bg-hover'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading payment requests…</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileQuestion className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">No payment requests found</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm mt-4">
            Create your first request
          </button>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          {requests.map((req, i) => {
            const incoming = isIncoming(req);
            const counterpart = incoming
              ? req.requestorProfile?.displayName ?? req.requestorUser?.email ?? 'Unknown'
              : req.payerProfile?.displayName ?? req.payerUser?.email ?? 'Unknown';

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-hover/40',
                  i !== requests.length - 1 && 'border-b border-bg-border/50'
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    incoming ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'
                  )}
                >
                  {incoming ? <Clock className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">
                    {incoming ? `From ${counterpart}` : `To ${counterpart}`}
                  </p>
                  {req.note && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{req.note}</p>
                  )}
                  <p className="text-xs text-text-muted mt-0.5">
                    {format(new Date(req.createdAt), 'MMM d, yyyy · h:mm a')}
                  </p>
                </div>

                {/* Amount + Status */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
                  <p className="font-semibold text-sm text-white">
                    {formatCurrency(req.amount, req.currency)}
                  </p>
                  <Badge variant={STATUS_BADGE[req.status] ?? 'gray'}>
                    {req.status}
                  </Badge>
                </div>

                {/* Actions for incoming pending */}
                {incoming && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setPinModal({ requestId: req.id })}
                      disabled={rejectMutation.isPending}
                      className="btn-success btn-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(req.id)}
                      disabled={rejectMutation.isPending}
                      className="btn-danger btn-sm"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* PIN Modal */}
      <AnimatePresence>
        {pinModal && (
          <PinModal
            loading={approveMutation.isPending}
            onClose={() => setPinModal(null)}
            onConfirm={(pin) =>
              approveMutation.mutate({ requestId: pinModal.requestId, pin })
            }
          />
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && activeProfile && (
          <CreateRequestModal
            activeProfileId={activeProfile.id}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Exported page — wraps with its own QueryClient ──────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function PaymentRequestsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaymentRequestsInner />
    </QueryClientProvider>
  );
}
