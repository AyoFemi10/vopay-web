'use client';

import { use, useState } from 'react';
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
  CheckCircle,
  XCircle,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
type ApprovalType   = 'BULK_PAYOUT' | 'PAYROLL' | 'LARGE_TRANSFER' | 'OTHER';

interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  amount: string;
  currency: string;
  requestedBy: string;
  status: ApprovalStatus;
  description?: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<ApprovalStatus, 'yellow' | 'green' | 'red' | 'gray'> = {
  PENDING:  'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  EXPIRED:  'gray',
};

const TYPE_LABELS: Record<ApprovalType, string> = {
  BULK_PAYOUT:    'Bulk Payout',
  PAYROLL:        'Payroll',
  LARGE_TRANSFER: 'Large Transfer',
  OTHER:          'Other',
};

// ─── PIN Modal ─────────────────────────────────────────────────────────────────

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
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
      >
        <h3 id="pin-modal-title" className="text-lg font-semibold text-white mb-2">
          Enter your PIN
        </h3>
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
            className="input text-center text-2xl tracking-[0.5em] font-mono w-full"
            autoFocus
            aria-label="Transaction PIN"
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="btn-primary flex-1"
            >
              {loading ? <Spinner size="sm" /> : <><CheckCircle className="w-4 h-4" /> Confirm</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function ApprovalsInner({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient();
  const [pinModal, setPinModal] = useState<{ approvalId: string } | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ApprovalRequest[]>({
    queryKey: ['business-approvals', profileId],
    queryFn: async () => {
      const res = await apiClient.get(`/business/approvals?profileId=${profileId}`);
      return (res.data.data ?? res.data) as ApprovalRequest[];
    },
    retry: false,
  });

  const approvals = isError ? [] : (data ?? []);

  // ── Approve ─────────────────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ id, pin }: { id: string; pin: string }) => {
      const res = await apiClient.post(`/business/approvals/${id}/approve`, { pin });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Approval granted');
      queryClient.invalidateQueries({ queryKey: ['business-approvals', profileId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Approval failed';
      toast.error(msg);
    },
    onSettled: () => {
      setPinModal(null);
    },
  });

  // ── Reject ──────────────────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post(`/business/approvals/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['business-approvals', profileId] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Rejection failed';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-accent" /> Pending Approvals
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Profile: <span className="font-mono text-xs">{profileId}</span>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh approvals"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading approvals…</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 text-center py-20 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold">No approval requests</p>
          <p className="text-text-muted text-sm mt-1">
            Pending approval requests for this profile will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="rounded-2xl bg-[#0D1525] border border-white/5 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left — details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="gray">
                      {TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                    <Badge variant={STATUS_VARIANT[item.status] ?? 'gray'}>
                      {item.status}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-sm text-white leading-relaxed">{item.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-text-muted">
                    <span>
                      Amount:{' '}
                      <span className="text-white font-semibold">
                        {item.currency} {Number(item.amount).toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Requested by:{' '}
                      <span className="text-text-secondary">{item.requestedBy}</span>
                    </span>
                    <span>
                      {format(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                </div>

                {/* Right — actions for PENDING */}
                {item.status === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setPinModal({ approvalId: item.id })}
                      disabled={rejectMutation.isPending}
                      className="btn-success btn-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(item.id)}
                      disabled={rejectMutation.isPending}
                      className="btn-danger btn-sm"
                    >
                      {rejectMutation.isPending ? (
                        <Spinner size="sm" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PIN Modal */}
      <AnimatePresence>
        {pinModal && (
          <PinModal
            loading={approveMutation.isPending}
            onClose={() => setPinModal(null)}
            onConfirm={(pin) =>
              approveMutation.mutate({ id: pinModal.approvalId, pin })
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wrapper with params ──────────────────────────────────────────────────────

function ApprovalsPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  return <ApprovalsInner profileId={profileId} />;
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function BusinessApprovalsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ApprovalsPage params={params} />
    </QueryClientProvider>
  );
}
