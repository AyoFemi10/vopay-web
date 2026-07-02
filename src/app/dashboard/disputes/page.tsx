'use client';

import { useRef, useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Plus,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
type DisputeReason =
  | 'UNAUTHORIZED_CHARGE'
  | 'DUPLICATE_CHARGE'
  | 'ITEM_NOT_RECEIVED'
  | 'INCORRECT_AMOUNT'
  | 'OTHER';

interface Dispute {
  id: string;
  transactionId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  amount?: number;
  currency?: string;
  createdAt: string;
  evidenceCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<DisputeStatus, 'yellow' | 'green' | 'gray'> = {
  OPEN:         'yellow',
  UNDER_REVIEW: 'yellow',
  RESOLVED:     'green',
  CLOSED:       'gray',
};

const REASON_LABELS: Record<DisputeReason, string> = {
  UNAUTHORIZED_CHARGE: 'Unauthorized Charge',
  DUPLICATE_CHARGE:    'Duplicate Charge',
  ITEM_NOT_RECEIVED:   'Item Not Received',
  INCORRECT_AMOUNT:    'Incorrect Amount',
  OTHER:               'Other',
};

const REASONS: DisputeReason[] = [
  'UNAUTHORIZED_CHARGE',
  'DUPLICATE_CHARGE',
  'ITEM_NOT_RECEIVED',
  'INCORRECT_AMOUNT',
  'OTHER',
];

// ─── Open Dispute Modal ───────────────────────────────────────────────────────

function OpenDisputeModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    transactionId: '',
    reason:        'UNAUTHORIZED_CHARGE' as DisputeReason,
    description:   '',
  });
  const [files, setFiles] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('transactionId', form.transactionId);
      fd.append('reason',        form.reason);
      fd.append('description',   form.description);
      files.forEach((file) => fd.append('evidence', file));

      const res = await apiClient.post('/disputes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Dispute opened successfully');
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to open dispute';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.transactionId.trim()) {
      toast.error('Transaction ID is required');
      return;
    }
    if (form.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }
    mutation.mutate();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
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
        aria-labelledby="dispute-modal-title"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="dispute-modal-title" className="text-lg font-semibold text-white">
            Open Dispute
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
          {/* Transaction ID */}
          <div>
            <label htmlFor="dispute-txn-id" className="block text-sm font-medium text-text-secondary mb-1.5">
              Transaction ID <span className="text-error">*</span>
            </label>
            <input
              id="dispute-txn-id"
              type="text"
              placeholder="Enter transaction ID"
              value={form.transactionId}
              onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
              className="input w-full"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="dispute-reason" className="block text-sm font-medium text-text-secondary mb-1.5">
              Reason <span className="text-error">*</span>
            </label>
            <select
              id="dispute-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value as DisputeReason })}
              className="input w-full"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="dispute-desc" className="block text-sm font-medium text-text-secondary mb-1.5">
              Description <span className="text-error">*</span>
              <span className="ml-2 text-text-muted font-normal">(min 20 chars)</span>
            </label>
            <textarea
              id="dispute-desc"
              rows={4}
              placeholder="Describe the issue in detail…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full resize-none"
              minLength={20}
              required
            />
            <p className={cn(
              'text-xs mt-1',
              form.description.length >= 20 ? 'text-text-muted' : 'text-warning'
            )}>
              {form.description.length}/20 minimum
            </p>
          </div>

          {/* Evidence upload */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Evidence files (optional)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-text-secondary hover:text-white hover:border-white/30 transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              Click to upload images or PDFs
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload evidence files"
            />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, i) => (
                  <li key={i} className="flex items-center justify-between text-xs text-text-secondary bg-white/5 rounded-lg px-3 py-2">
                    <span className="truncate mr-2">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-text-muted hover:text-error transition-colors shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? <Spinner size="sm" /> : <><ShieldAlert className="w-4 h-4" /> Submit Dispute</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function DisputesInner() {
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<Dispute[]>({
    queryKey: ['disputes'],
    queryFn: async () => {
      const res = await apiClient.get('/disputes');
      return (res.data.data ?? res.data) as Dispute[];
    },
    retry: false,
  });

  const disputes = isError ? [] : (data ?? []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-accent" /> Disputes
          </h2>
          <p className="text-text-muted text-sm mt-1">
            {disputes.length} dispute{disputes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh disputes"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Open Dispute
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading disputes…</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 text-center py-20 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold">No disputes found</p>
          <p className="text-text-muted text-sm mt-1">
            Open a dispute if you believe a charge is incorrect.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-5">
            <Plus className="w-4 h-4" /> Open Dispute
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Dispute ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Transaction ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Reason</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute, i) => (
                <motion.tr
                  key={dispute.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                    {dispute.id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                    {dispute.transactionId.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 text-white">
                    {REASON_LABELS[dispute.reason] ?? dispute.reason}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[dispute.status] ?? 'gray'}>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && <OpenDisputeModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function DisputesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DisputesInner />
    </QueryClientProvider>
  );
}
