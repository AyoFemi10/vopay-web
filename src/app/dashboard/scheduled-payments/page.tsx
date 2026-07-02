'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CalendarClock,
  Plus,
  Pause,
  Play,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';

interface ScheduledPayment {
  id: string;
  recipientIdentifier: string;
  amount: string;
  currency: string;
  frequency: ScheduleFrequency;
  nextRunAt: string;
  status: ScheduleStatus;
  description?: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

const FREQUENCIES: ScheduleFrequency[] = [
  'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY',
];

const STATUS_VARIANT: Record<ScheduleStatus, 'green' | 'yellow' | 'gray'> = {
  ACTIVE:    'green',
  PAUSED:    'yellow',
  CANCELLED: 'gray',
  COMPLETED: 'gray',
};

// ─── New Schedule Modal ───────────────────────────────────────────────────────

function NewScheduleModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    recipientIdentifier: '',
    amount: '',
    currency: 'USD',
    frequency: 'MONTHLY' as ScheduleFrequency,
    startDate: '',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/scheduled-payments', {
        recipientIdentifier: form.recipientIdentifier,
        amount: form.amount,
        currency: form.currency,
        frequency: form.frequency,
        startDate: form.startDate || undefined,
        description: form.description || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Scheduled payment created');
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create scheduled payment';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientIdentifier.trim()) {
      toast.error('Recipient is required');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Valid amount is required');
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
        className="w-full max-w-md rounded-2xl bg-[#0D1525] border border-white/5 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-schedule-title"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="new-schedule-title" className="text-lg font-semibold text-white">
            New Scheduled Payment
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient */}
          <div>
            <label htmlFor="sched-recipient" className="block text-sm font-medium text-text-secondary mb-1.5">
              Recipient <span className="text-error">*</span>
            </label>
            <input
              id="sched-recipient"
              type="text"
              placeholder="@username, VPX123, or email@example.com"
              value={form.recipientIdentifier}
              onChange={(e) => setForm({ ...form, recipientIdentifier: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* Amount + Currency */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="sched-amount" className="block text-sm font-medium text-text-secondary mb-1.5">
                Amount <span className="text-error">*</span>
              </label>
              <input
                id="sched-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="sched-currency" className="block text-sm font-medium text-text-secondary mb-1.5">
                Currency
              </label>
              <select
                id="sched-currency"
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

          {/* Frequency */}
          <div>
            <label htmlFor="sched-frequency" className="block text-sm font-medium text-text-secondary mb-1.5">
              Frequency
            </label>
            <select
              id="sched-frequency"
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as ScheduleFrequency })}
              className="input w-full"
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>{f.charAt(0) + f.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="sched-start" className="block text-sm font-medium text-text-secondary mb-1.5">
              Start Date
            </label>
            <input
              id="sched-start"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="sched-desc" className="block text-sm font-medium text-text-secondary mb-1.5">
              Description <span className="text-text-muted">(optional)</span>
            </label>
            <textarea
              id="sched-desc"
              rows={2}
              placeholder="What is this payment for?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <><CalendarClock className="w-4 h-4" /> Schedule</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Confirm Cancel Dialog ────────────────────────────────────────────────────

function ConfirmCancelDialog({
  onConfirm,
  onClose,
  isPending,
}: {
  onConfirm: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl bg-[#0D1525] border border-white/5 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-cancel-title"
      >
        <h3 id="confirm-cancel-title" className="text-lg font-semibold text-white mb-2">
          Cancel Scheduled Payment
        </h3>
        <p className="text-text-muted text-sm mb-6">
          This will permanently cancel the scheduled payment. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isPending} className="btn-secondary flex-1">
            Keep it
          </button>
          <button onClick={onConfirm} disabled={isPending} className="btn-danger flex-1">
            {isPending ? <Spinner size="sm" /> : <><Trash2 className="w-4 h-4" /> Cancel Payment</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function ScheduledPaymentsInner() {
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ScheduledPayment[]>({
    queryKey: ['scheduled-payments'],
    queryFn: async () => {
      const res = await apiClient.get('/scheduled-payments');
      return (res.data.data ?? res.data) as ScheduledPayment[];
    },
    retry: false,
  });

  const payments = isError ? [] : (data ?? []);

  const pauseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/scheduled-payments/${id}/pause`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment paused');
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
    },
    onError: () => toast.error('Failed to pause payment'),
  });

  const resumeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/scheduled-payments/${id}/resume`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment resumed');
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
    },
    onError: () => toast.error('Failed to resume payment'),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/scheduled-payments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment cancelled');
      queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
      setConfirmCancelId(null);
    },
    onError: () => {
      toast.error('Failed to cancel payment');
      setConfirmCancelId(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-accent" /> Scheduled Payments
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {payments.length} schedule{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh scheduled payments"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading scheduled payments…</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 text-center py-20 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold">No scheduled payments</p>
          <p className="text-text-muted text-sm mt-1">
            Set up recurring payments to automate transfers.
          </p>
          <button onClick={() => setShowNew(true)} className="btn-primary mt-5">
            <Plus className="w-4 h-4" /> New Schedule
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment, i) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="rounded-2xl bg-[#0D1525] border border-white/5 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: Details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-white truncate">{payment.recipientIdentifier}</p>
                    <Badge variant={STATUS_VARIANT[payment.status]}>{payment.status}</Badge>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 text-text-secondary text-xs font-semibold">
                      {payment.frequency.charAt(0) + payment.frequency.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  {payment.description && (
                    <p className="text-text-muted text-sm truncate">{payment.description}</p>
                  )}
                  <p className="text-xs text-text-muted">
                    Next run: {format(new Date(payment.nextRunAt), 'MMM d, yyyy')}
                    {' · '}
                    Created {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>

                {/* Right: Actions */}
                {(payment.status === 'ACTIVE' || payment.status === 'PAUSED') && (
                  <div className="flex items-center gap-2 shrink-0">
                    {payment.status === 'ACTIVE' ? (
                      <button
                        onClick={() => pauseMutation.mutate(payment.id)}
                        disabled={pauseMutation.isPending}
                        className="btn-secondary btn-sm"
                        aria-label={`Pause payment to ${payment.recipientIdentifier}`}
                      >
                        {pauseMutation.isPending ? (
                          <Spinner size="sm" />
                        ) : (
                          <><Pause className="w-3.5 h-3.5" /> Pause</>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => resumeMutation.mutate(payment.id)}
                        disabled={resumeMutation.isPending}
                        className="btn-primary btn-sm"
                        aria-label={`Resume payment to ${payment.recipientIdentifier}`}
                      >
                        {resumeMutation.isPending ? (
                          <Spinner size="sm" />
                        ) : (
                          <><Play className="w-3.5 h-3.5" /> Resume</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmCancelId(payment.id)}
                      className="btn-danger btn-sm"
                      aria-label={`Cancel payment to ${payment.recipientIdentifier}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showNew && <NewScheduleModal onClose={() => setShowNew(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {confirmCancelId && (
          <ConfirmCancelDialog
            isPending={cancelMutation.isPending}
            onConfirm={() => cancelMutation.mutate(confirmCancelId)}
            onClose={() => setConfirmCancelId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function ScheduledPaymentsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ScheduledPaymentsInner />
    </QueryClientProvider>
  );
}
