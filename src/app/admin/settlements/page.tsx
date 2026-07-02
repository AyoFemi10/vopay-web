'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
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
import {
  Landmark,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type SettlementStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RECONCILED';

interface Settlement {
  id: string;
  provider: string;
  currency: string;
  amount: number;
  status: SettlementStatus;
  createdAt: string;
}

interface SettlementsResponse {
  settlements: Settlement[];
  total: number;
  page: number;
  limit: number;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<SettlementStatus, 'yellow' | 'blue' | 'green' | 'red' | 'gray'> = {
  PENDING:    'yellow',
  PROCESSING: 'blue',
  COMPLETED:  'green',
  FAILED:     'red',
  RECONCILED: 'gray',
};

// ─── Inner page ───────────────────────────────────────────────────────────────

const LIMIT = 20;

function AdminSettlementsInner() {
  const { requireTotp } = useAdminMfa();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Applied filter state (separated so Search button triggers the query reset)
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery<SettlementsResponse>({
    queryKey: ['admin-settlements', page, appliedStatus, appliedFrom, appliedTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (appliedStatus) params.set('status', appliedStatus);
      if (appliedFrom)   params.set('fromDate', appliedFrom);
      if (appliedTo)     params.set('toDate', appliedTo);
      const res = await apiClient.get(`/admin/settlements?${params.toString()}`);
      return res.data.data as SettlementsResponse;
    },
    retry: 1,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      mfaToken,
    }: {
      id: string;
      status: SettlementStatus;
      mfaToken: string;
    }) => {
      const res = await apiClient.patch(`/admin/settlements/${id}/status`, {
        status,
        mfaToken,
      });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`Settlement marked as ${variables.status.toLowerCase()}`);
      refetch();
    },
    onError: () => {
      toast.error('Failed to update settlement status');
    },
  });

  const handleStatusTransition = (settlement: Settlement, nextStatus: SettlementStatus) => {
    requireTotp((totpCode) => {
      updateStatusMutation.mutate({
        id: settlement.id,
        status: nextStatus,
        mfaToken: totpCode,
      });
    });
  };

  const applyFilters = () => {
    setAppliedStatus(statusFilter);
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setPage(1);
  };

  const settlements = data?.settlements ?? [];
  const total       = data?.total ?? 0;
  const totalPages  = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-accent" /> Settlements
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} total records</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh settlements"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="status-filter" className="block text-xs font-medium text-text-secondary mb-1.5">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="RECONCILED">Reconciled</option>
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="from-date" className="block text-xs font-medium text-text-secondary mb-1.5">
            From Date
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="to-date" className="block text-xs font-medium text-text-secondary mb-1.5">
            To Date
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input"
          />
        </div>
        <button onClick={applyFilters} className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading settlements…</p>
        </div>
      ) : settlements.length === 0 ? (
        <div className="card text-center py-20">
          <Landmark className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No settlements found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Provider</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Currency</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                    {s.id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 text-white font-medium">{s.provider}</td>
                  <td className="px-5 py-4 text-text-secondary">{s.currency}</td>
                  <td className="px-5 py-4 text-white font-semibold tabular-nums">
                    {s.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[s.status]}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(s.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <SettlementActions
                      settlement={s}
                      isPending={updateStatusMutation.isPending}
                      onTransition={handleStatusTransition}
                    />
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
    </div>
  );
}

// ─── Settlement action buttons ────────────────────────────────────────────────

function SettlementActions({
  settlement,
  isPending,
  onTransition,
}: {
  settlement: Settlement;
  isPending: boolean;
  onTransition: (settlement: Settlement, next: SettlementStatus) => void;
}) {
  if (settlement.status === 'PENDING') {
    return (
      <button
        onClick={() => onTransition(settlement, 'PROCESSING')}
        disabled={isPending}
        className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
      >
        {isPending ? <Spinner size="sm" /> : null}
        Process
      </button>
    );
  }

  if (settlement.status === 'PROCESSING') {
    return (
      <button
        onClick={() => onTransition(settlement, 'COMPLETED')}
        disabled={isPending}
        className="btn-primary btn-sm text-xs flex items-center gap-1.5"
      >
        {isPending ? <Spinner size="sm" /> : null}
        Mark Complete
      </button>
    );
  }

  return <span className="text-xs text-text-muted">—</span>;
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminSettlementsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminSettlementsInner />
    </QueryClientProvider>
  );
}
