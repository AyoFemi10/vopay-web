'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { TransactionData } from '@/types/shared';
import {
  ArrowUpRight, ArrowDownRight, Search, Filter, RefreshCw,
  TrendingUp, X, ArrowLeftRight,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const STATUS_VARIANT: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  COMPLETED: 'green', PENDING: 'yellow', PROCESSING: 'yellow',
  FAILED: 'red', REVERSED: 'red', CANCELLED: 'gray',
};

const TYPE_ICON: Record<string, React.FC<{ className?: string }>> = {
  DEPOSIT: ArrowDownRight, WITHDRAWAL: ArrowUpRight, TRANSFER: ArrowUpRight,
  REFUND: ArrowDownRight, EXCHANGE: ArrowLeftRight, FEE: ArrowUpRight,
};

const TYPE_STYLE: Record<string, { color: string; bg: string }> = {
  DEPOSIT:    { color: 'text-success', bg: 'bg-success/12' },
  REFUND:     { color: 'text-success', bg: 'bg-success/12' },
  WITHDRAWAL: { color: 'text-error',   bg: 'bg-error/10' },
  TRANSFER:   { color: 'text-white',   bg: 'bg-white/6'  },
  EXCHANGE:   { color: 'text-accent',  bg: 'bg-accent/12' },
  FEE:        { color: 'text-warning', bg: 'bg-warning/10' },
};

const ALL_TYPES    = ['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'EXCHANGE', 'REFUND', 'FEE'];
const ALL_STATUSES = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];

// Group transactions by date
function groupByDate(txs: TransactionData[]) {
  const groups: Record<string, TransactionData[]> = {};
  txs.forEach((tx) => {
    const key = format(new Date(tx.createdAt), 'MMM d, yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  });
  return groups;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filtered, setFiltered]         = useState<TransactionData[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilters, setShowFilters]   = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/transactions?limit=50');
      if (res.data.success) { setTransactions(res.data.data); setFiltered(res.data.data); }
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
        (t) => t.reference.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false) || t.type.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, typeFilter, statusFilter, transactions]);

  const clearFilters = () => { setSearch(''); setTypeFilter('ALL'); setStatusFilter('ALL'); };
  const hasFilters = search || typeFilter !== 'ALL' || statusFilter !== 'ALL';
  const grouped = groupByDate(filtered);

  // Summary stats
  const totalCredits  = transactions.filter((t) => ['DEPOSIT', 'REFUND'].includes(t.type)).length;
  const totalDebits   = transactions.filter((t) => !['DEPOSIT', 'REFUND'].includes(t.type)).length;

  return (
    <div className="space-y-6 pb-12 max-w-[1400px]">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-black text-white">Transactions</h2>
          <p className="text-text-muted text-sm mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            {hasFilters ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all border',
              showFilters
                ? 'bg-accent/15 border-accent/30 text-accent'
                : 'bg-white/5 border-white/8 text-text-secondary hover:text-white hover:bg-white/10'
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={fetchTransactions}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total', value: transactions.length, color: 'text-white', bg: 'bg-white/6 border-white/10' },
          { label: 'Credits', value: totalCredits, color: 'text-success', bg: 'bg-success/8 border-success/20' },
          { label: 'Debits',  value: totalDebits,  color: 'text-error',   bg: 'bg-error/8 border-error/20'   },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('px-4 py-2 rounded-xl border text-sm font-bold', bg)}>
            <span className="text-text-muted font-medium mr-1.5">{label}</span>
            <span className={color}>{value}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Search by reference, description or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white/4 border border-white/8 text-white text-sm placeholder-text-muted/50 outline-none focus:border-accent/40 focus:bg-[#0F172A] transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/8 flex items-center justify-center text-text-muted hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl bg-white/3 border border-white/8 p-5 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Type</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_TYPES.map((t) => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all',
                        typeFilter === t
                          ? 'bg-accent text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                          : 'bg-white/5 border border-white/8 text-text-secondary hover:text-white'
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">Status</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-bold transition-all',
                        statusFilter === s
                          ? 'bg-accent text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]'
                          : 'bg-white/5 border border-white/8 text-text-secondary hover:text-white'
                      )}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-bold text-error hover:underline">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm animate-pulse">Loading history…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/3 border border-white/8 py-24 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-text-muted" />
          </div>
          <p className="font-bold text-white">No transactions found</p>
          <p className="text-text-muted text-sm">Try adjusting your search or filters</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-accent text-sm font-bold hover:underline mt-1">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              {/* Date label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{date}</span>
                <div className="flex-1 h-px bg-white/6" />
                <span className="text-xs text-text-muted">{txs.length} tx</span>
              </div>

              {/* Rows */}
              <div className="rounded-2xl bg-white/2 border border-white/6 overflow-hidden divide-y divide-white/4">
                {txs.map((tx, i) => {
                  const isCredit = ['DEPOSIT', 'REFUND'].includes(tx.type);
                  const Icon  = TYPE_ICON[tx.type] ?? ArrowUpRight;
                  const style = TYPE_STYLE[tx.type] ?? TYPE_STYLE.TRANSFER;
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.2) }}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
                      className="flex items-center gap-3.5 px-4 py-3.5 transition-all cursor-pointer"
                    >
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', style.bg)}>
                        <Icon className={cn('w-5 h-5', style.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{tx.description || tx.type}</p>
                        <p className="text-xs text-text-muted mt-0.5 font-medium">
                          <span className="hidden sm:inline">Ref: {tx.reference.slice(0, 10)}… · </span>
                          {format(new Date(tx.createdAt), 'h:mm a')}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                        <p className={cn('font-black text-sm tracking-tight', isCredit ? 'text-success' : 'text-white')}>
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                        </p>
                        <Badge variant={STATUS_VARIANT[tx.status] ?? 'gray'} className="text-[10px] py-0.5 px-2">
                          {tx.status}
                        </Badge>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
