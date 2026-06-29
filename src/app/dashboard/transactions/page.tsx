'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TransactionData } from '@/types/shared';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  COMPLETED: 'green',
  PENDING: 'yellow',
  PROCESSING: 'yellow',
  FAILED: 'red',
  REVERSED: 'red',
  CANCELLED: 'gray',
};

const TYPE_ICON: Record<string, React.FC<{ className?: string }>> = {
  DEPOSIT:    ArrowDownRight,
  WITHDRAWAL: ArrowUpRight,
  TRANSFER:   ArrowUpRight,
  REFUND:     ArrowDownRight,
  EXCHANGE:   TrendingUp,
  FEE:        ArrowUpRight,
};

const ALL_TYPES = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'EXCHANGE', 'REFUND', 'FEE'];
const ALL_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filtered, setFiltered] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transactions?limit=50');
      if (res.data.success) {
        setTransactions(res.data.data);
        setFiltered(res.data.data);
      }
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  useEffect(() => {
    let result = transactions;
    if (typeFilter !== 'ALL') result = result.filter((t) => t.type === typeFilter);
    if (statusFilter !== 'ALL') result = result.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.reference.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false) ||
          t.type.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, typeFilter, statusFilter, transactions]);

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasFilters = search || typeFilter !== 'ALL' || statusFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transactions</h2>
          <p className="text-text-muted text-sm mt-1">
            {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'} found
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
              showFilters
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-bg-secondary border-bg-border text-text-secondary hover:text-white'
            )}
            title="Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={fetchTransactions}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder="Search by reference, type or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-11"
          id="tx-search"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card space-y-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Transaction Type</p>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    typeFilter === t
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover hover:text-white'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                    statusFilter === s
                      ? 'bg-accent text-white'
                      : 'bg-bg-secondary text-text-secondary hover:bg-bg-hover hover:text-white'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-error hover:underline">
              Clear all filters
            </button>
          )}
        </motion.div>
      )}

      {/* Transactions List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading transactions…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">No transactions found</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-accent text-sm hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          {filtered.map((tx, i) => {
            const isCredit = ['DEPOSIT', 'REFUND'].includes(tx.type);
            const Icon = TYPE_ICON[tx.type] ?? ArrowUpRight;

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={cn(
                  'flex items-center gap-4 px-5 py-4 transition-colors hover:bg-bg-hover/50',
                  i !== filtered.length - 1 && 'border-b border-bg-border/50'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    isCredit ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">
                    {tx.description || tx.type}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Ref: {tx.reference.slice(0, 16)}… · {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <p className={cn('font-semibold text-sm', isCredit ? 'text-success' : 'text-white')}>
                    {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <Badge variant={STATUS_VARIANT[tx.status] ?? 'gray'}>
                    {tx.status}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
