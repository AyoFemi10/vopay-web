'use client';

import { useState } from 'react';
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminTransaction {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, 'yellow' | 'green' | 'red' | 'gray' | 'blue'> = {
  PENDING: 'yellow',
  PROCESSING: 'blue',
  COMPLETED: 'green',
  FAILED: 'red',
  REVERSED: 'gray',
  CANCELLED: 'gray',
};

const CURRENCIES = ['', 'NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS', 'ZAR'];

// ─── Inner page ───────────────────────────────────────────────────────────────

const LIMIT = 20;

function AdminTransactionsInner() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [currency, setCurrency] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ status, currency, fromDate, toDate });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-transactions', page, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (appliedFilters.status) params.set('status', appliedFilters.status);
      if (appliedFilters.currency) params.set('currency', appliedFilters.currency);
      if (appliedFilters.fromDate) params.set('fromDate', appliedFilters.fromDate);
      if (appliedFilters.toDate) params.set('toDate', appliedFilters.toDate);
      const res = await apiClient.get(`/admin/transactions?${params.toString()}`);
      return res.data.data as TransactionsResponse;
    },
  });

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const applyFilters = () => {
    setAppliedFilters({ status, currency, fromDate, toDate });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-accent" /> Transactions
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} total transactions</p>
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
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="txn-status" className="block text-xs font-medium text-text-secondary mb-1.5">
            Status
          </label>
          <select id="txn-status" value={status} onChange={(e) => setStatus(e.target.value)} className="input">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="REVERSED">Reversed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label htmlFor="txn-currency" className="block text-xs font-medium text-text-secondary mb-1.5">
            Currency
          </label>
          <select id="txn-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c || 'All currencies'}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="txn-from" className="block text-xs font-medium text-text-secondary mb-1.5">
            From Date
          </label>
          <input id="txn-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="txn-to" className="block text-xs font-medium text-text-secondary mb-1.5">
            To Date
          </label>
          <input id="txn-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
        </div>
        <button onClick={applyFilters} className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading transactions…</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card text-center py-20">
          <ArrowLeftRight className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No transactions found</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Currency</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, i) => (
                <motion.tr
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <code className="text-xs font-mono text-accent bg-bg-secondary px-2 py-0.5 rounded">
                      {txn.id.slice(0, 8)}…
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-white text-sm">{txn.userName ?? '—'}</p>
                    <p className="text-xs text-text-muted">{txn.userEmail ?? txn.userId}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">{txn.amount}</td>
                  <td className="px-5 py-4 text-text-secondary">{txn.currency}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE[txn.status] ?? 'gray'}>{txn.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {format(new Date(txn.createdAt), 'MMM d, yyyy')}
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

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminTransactionsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminTransactionsInner />
    </QueryClientProvider>
  );
}
