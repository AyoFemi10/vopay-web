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
import { useAdminMfa } from '../layout';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  RefreshCw,
  Search,
  CheckCircle,
  RefreshCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

interface AdminDispute {
  id: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  amount: number;
  currency: string;
  createdAt: string;
}

interface AdminDisputesResponse {
  disputes: AdminDispute[];
  total: number;
  page: number;
  limit: number;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<DisputeStatus, 'yellow' | 'green' | 'gray'> = {
  OPEN:         'yellow',
  UNDER_REVIEW: 'yellow',
  RESOLVED:     'green',
  CLOSED:       'gray',
};

const PAGE_LIMIT = 20;

// ─── Inner Page ───────────────────────────────────────────────────────────────

function AdminDisputesInner() {
  const { requireTotp } = useAdminMfa();
  const queryClient = useQueryClient();

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    status:   '',
    search:   '',
    dateFrom: '',
    dateTo:   '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);

  // ── Query ─────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminDisputesResponse>({
    queryKey: ['admin-disputes', appliedFilters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page',  String(page));
      params.set('limit', String(PAGE_LIMIT));
      if (appliedFilters.status)   params.set('status',   appliedFilters.status);
      if (appliedFilters.search)   params.set('search',   appliedFilters.search);
      if (appliedFilters.dateFrom) params.set('dateFrom', appliedFilters.dateFrom);
      if (appliedFilters.dateTo)   params.set('dateTo',   appliedFilters.dateTo);

      const res = await apiClient.get(`/admin/disputes?${params.toString()}`);
      return res.data.data as AdminDisputesResponse;
    },
    retry: false,
  });

  const disputes   = isError ? [] : (data?.disputes ?? []);
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // ── Resolve mutation ──────────────────────────────────────────────────────────
  const resolveMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.patch(`/admin/disputes/${id}/resolve`, { mfaToken });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Dispute resolved');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
    onError: () => {
      toast.error('Failed to resolve dispute');
    },
  });

  // ── Refund mutation ───────────────────────────────────────────────────────────
  const refundMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.post(`/admin/disputes/${id}/refund`, { mfaToken });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Refund issued');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
    onError: () => {
      toast.error('Failed to issue refund');
    },
  });

  // ── Review mutation ───────────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.patch(`/admin/disputes/${id}/status`, {
        status: 'UNDER_REVIEW',
        mfaToken,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Dispute moved to Under Review');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
    },
    onError: () => {
      toast.error('Failed to update dispute status');
    },
  });

  // ── MFA-gated helpers ─────────────────────────────────────────────────────────
  const handleResolve = (id: string) => {
    requireTotp((mfaToken) => resolveMutation.mutate({ id, mfaToken }));
  };

  const handleRefund = (id: string) => {
    requireTotp((mfaToken) => refundMutation.mutate({ id, mfaToken }));
  };

  const handleReview = (id: string) => {
    requireTotp((mfaToken) => reviewMutation.mutate({ id, mfaToken }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const isActioning =
    resolveMutation.isPending || refundMutation.isPending || reviewMutation.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-accent" /> Disputes Queue
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} dispute{total !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh disputes queue"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="card flex flex-wrap gap-3 items-end">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input text-sm"
            style={{ minWidth: '140px' }}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Email, reason, transaction…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={handleKeyDown}
              className="input pl-9 text-sm w-full"
            />
          </div>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="input text-sm"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="input text-sm"
          />
        </div>

        <button onClick={handleSearch} className="btn-primary self-end">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading disputes…</p>
        </div>
      ) : disputes.length === 0 ? (
        <div className="card text-center py-20">
          <ShieldAlert className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No disputes found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Dispute ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Transaction ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">User Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Reason</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute, i) => (
                <motion.tr
                  key={dispute.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                    {dispute.id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                    {dispute.transactionId.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{dispute.userEmail}</td>
                  <td className="px-5 py-4 text-white max-w-[150px]">
                    <span className="truncate block">{dispute.reason.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[dispute.status] ?? 'gray'}>
                      {dispute.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-white font-semibold tabular-nums whitespace-nowrap">
                    {dispute.currency} {dispute.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(dispute.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {/* Review — only for OPEN */}
                      {dispute.status === 'OPEN' && (
                        <button
                          onClick={() => handleReview(dispute.id)}
                          disabled={isActioning}
                          className="btn-secondary btn-sm text-xs flex items-center gap-1"
                          aria-label={`Start review for dispute ${dispute.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </button>
                      )}

                      {/* Resolve — for OPEN or UNDER_REVIEW */}
                      {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
                        <button
                          onClick={() => handleResolve(dispute.id)}
                          disabled={isActioning}
                          className="btn-secondary btn-sm text-xs flex items-center gap-1"
                          aria-label={`Resolve dispute ${dispute.id}`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Resolve
                        </button>
                      )}

                      {/* Refund — always available */}
                      <button
                        onClick={() => handleRefund(dispute.id)}
                        disabled={isActioning}
                        className="btn-secondary btn-sm text-xs flex items-center gap-1"
                        aria-label={`Issue refund for dispute ${dispute.id}`}
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Refund
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="btn-secondary btn-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
              className="btn-secondary btn-sm"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminDisputesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDisputesInner />
    </QueryClientProvider>
  );
}
