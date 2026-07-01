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
import { useAdminMfa } from '@/app/admin/layout';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  FileCheck,
  RefreshCw,
  CheckCircle,
  XCircle,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KycSubmission {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  documentType: string;
  status: string;
  submittedAt: string;
  note?: string | null;
}

interface KycResponse {
  submissions: KycSubmission[];
  total: number;
}

// ─── Action Modal (approve / reject with note) ────────────────────────────────

function ActionModal({
  submission,
  action,
  onClose,
  onConfirm,
  loading,
}: {
  submission: KycSubmission;
  action: 'approve' | 'reject';
  onClose: () => void;
  onConfirm: (note: string) => void;
  loading: boolean;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-md space-y-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-action-title"
      >
        <h3 id="kyc-action-title" className="text-lg font-semibold text-white capitalize">
          {action} KYC Submission
        </h3>
        <p className="text-text-secondary text-sm">
          {action === 'approve'
            ? `Approve the ${submission.documentType} document for ${submission.userName ?? submission.userId}?`
            : `Reject the ${submission.documentType} document for ${submission.userName ?? submission.userId}?`}
        </p>
        <div>
          <label htmlFor="kyc-note" className="block text-sm font-medium text-text-secondary mb-1.5">
            Note {action === 'reject' && <span className="text-error">*</span>}
          </label>
          <textarea
            id="kyc-note"
            rows={3}
            placeholder="Add a note for this decision…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input resize-none"
          />
        </div>
        <p className="text-xs text-warning flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> MFA code will be required
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading || (action === 'reject' && !note.trim())}
            className={action === 'approve' ? 'btn-success flex-1' : 'btn-danger flex-1'}
          >
            {loading ? (
              <Spinner size="sm" />
            ) : action === 'approve' ? (
              <><CheckCircle className="w-4 h-4" /> Approve</>
            ) : (
              <><XCircle className="w-4 h-4" /> Reject</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

const LIMIT = 20;

const STATUS_BADGE: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
  PENDING: 'yellow',
  SUBMITTED: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
};

function AdminKycInner() {
  const queryClient = useQueryClient();
  const { requireTotp } = useAdminMfa();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<{
    submission: KycSubmission;
    action: 'approve' | 'reject';
  } | null>(null);

  // ── Fetch submissions ────────────────────────────────────────────────────
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-kyc', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (statusFilter) params.set('status', statusFilter);
      const res = await apiClient.get(`/admin/kyc?${params.toString()}`);
      return res.data.data as KycResponse;
    },
  });

  const submissions = data?.submissions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Approve mutation ─────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ id, note, mfaToken }: { id: string; note: string; mfaToken: string }) => {
      const res = await apiClient.patch(
        `/admin/kyc/${id}/approve`,
        { note },
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('KYC submission approved');
      setModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to approve KYC';
      toast.error(msg);
    },
  });

  // ── Reject mutation ──────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: async ({ id, note, mfaToken }: { id: string; note: string; mfaToken: string }) => {
      const res = await apiClient.patch(
        `/admin/kyc/${id}/reject`,
        { note },
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('KYC submission rejected');
      setModal(null);
      queryClient.invalidateQueries({ queryKey: ['admin-kyc'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to reject KYC';
      toast.error(msg);
    },
  });

  const handleActionConfirm = (note: string) => {
    if (!modal) return;
    const { submission, action } = modal;
    requireTotp((mfaToken) => {
      if (action === 'approve') {
        approveMutation.mutate({ id: submission.id, note, mfaToken });
      } else {
        rejectMutation.mutate({ id: submission.id, note, mfaToken });
      }
    });
  };

  const isMutating = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-accent" /> KYC Queue
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} submissions</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="kyc-status-filter" className="block text-xs font-medium text-text-secondary mb-1.5">
            Status
          </label>
          <select
            id="kyc-status-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading KYC queue…</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="card text-center py-20">
          <FileCheck className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No KYC submissions found</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Document Type</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Submitted</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub, i) => (
                <motion.tr
                  key={sub.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white text-sm">{sub.userName ?? '—'}</p>
                    <p className="text-xs text-text-muted">{sub.userEmail ?? sub.userId}</p>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{sub.documentType}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE[sub.status] ?? 'gray'}>{sub.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {format(new Date(sub.submittedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    {(sub.status === 'PENDING' || sub.status === 'SUBMITTED') && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ submission: sub, action: 'approve' })}
                          disabled={isMutating}
                          className="btn-success btn-sm flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                          <Lock className="w-3 h-3 text-warning ml-0.5" />
                        </button>
                        <button
                          onClick={() => setModal({ submission: sub, action: 'reject' })}
                          disabled={isMutating}
                          className="btn-danger btn-sm flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                          <Lock className="w-3 h-3 text-warning ml-0.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages} · {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary btn-sm disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <AnimatePresence>
        {modal && (
          <ActionModal
            submission={modal.submission}
            action={modal.action}
            onClose={() => setModal(null)}
            onConfirm={handleActionConfirm}
            loading={isMutating}
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

export default function AdminKycPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminKycInner />
    </QueryClientProvider>
  );
}
