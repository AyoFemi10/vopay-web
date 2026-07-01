'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type { WalletData, TransactionData, TransactionStatus } from '@/types/shared';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Copy,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { BadgeVariant } from '@/components/ui/Badge';

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCY_FLAGS: Record<string, string> = {
  NGN: '🇳🇬',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
  KES: '🇰🇪',
  GHS: '🇬🇭',
  ZAR: '🇿🇦',
};

const CURRENCY_NAMES: Record<string, string> = {
  NGN: 'Nigerian Naira',
  USD: 'US Dollar',
  GBP: 'British Pound',
  EUR: 'Euro',
  KES: 'Kenyan Shilling',
  GHS: 'Ghanaian Cedi',
  ZAR: 'South African Rand',
};

const statusVariant: Record<TransactionStatus, BadgeVariant> = {
  COMPLETED: 'green',
  PENDING: 'yellow',
  PROCESSING: 'yellow',
  FAILED: 'red',
  REVERSED: 'red',
  CANCELLED: 'gray',
};

const CREDIT_TYPES = new Set(['DEPOSIT', 'REFUND']);

const PAGE_SIZE = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();

  const currencyParam = (params.currency as string).toUpperCase();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copied, setCopied] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Fetch wallet ────────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    try {
      const res = await apiClient.get('/wallets');
      if (res.data.success) {
        const match = (res.data.data as WalletData[]).find(
          (w) => w.currency === currencyParam
        );
        if (!match) {
          toast.error(`No ${currencyParam} wallet found`);
          router.push('/dashboard/wallets');
          return;
        }
        setWallet(match);
      }
    } catch {
      toast.error('Failed to load wallet');
    }
  }, [currencyParam, router]);

  // ── Fetch transactions (paginated) ──────────────────────────────────────────
  const fetchTransactions = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);

      try {
        const res = await apiClient.get('/transactions', {
          params: { currency: currencyParam, page: pageNum, limit: PAGE_SIZE },
        });

        if (res.data.success) {
          const fetched: TransactionData[] = res.data.data ?? [];
          setTransactions((prev) => (append ? [...prev, ...fetched] : fetched));
          setHasMore(fetched.length === PAGE_SIZE);
        }
      } catch {
        if (append) toast.error('Failed to load more transactions');
      } finally {
        if (append) setLoadingMore(false);
      }
    },
    [currencyParam]
  );

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoadingInitial(true);
      await Promise.all([fetchWallet(), fetchTransactions(1, false)]);
      setLoadingInitial(false);
    };
    init();
  }, [fetchWallet, fetchTransactions]);

  // ── IntersectionObserver for infinite scroll ────────────────────────────────
  useEffect(() => {
    if (loadingInitial) return;

    observerRef.current?.disconnect();

    if (!hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchTransactions(next, true);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadingInitial, hasMore, loadingMore, fetchTransactions]);

  // ── Copy account number ─────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!wallet?.accountNumber) return;
    navigator.clipboard.writeText(wallet.accountNumber);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading wallet…</p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push('/dashboard/wallets')}
        className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Wallets
      </button>

      {/* Wallet Header Card */}
      {wallet && (
        <motion.div
          className="relative rounded-2xl overflow-hidden p-7 bg-gradient-brand shadow-glow"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Decorative orbs */}
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4">
            {/* Currency identity */}
            <div className="flex items-center gap-3">
              <span className="text-4xl">{CURRENCY_FLAGS[currencyParam] ?? '💰'}</span>
              <div>
                <p className="text-white font-bold text-lg leading-tight">{currencyParam} Wallet</p>
                <p className="text-white/70 text-sm">{CURRENCY_NAMES[currencyParam] ?? currencyParam}</p>
              </div>
            </div>

            {/* Balance */}
            <div>
              <p className="text-white/70 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-black font-display text-white">
                {formatCurrency(wallet.balance, wallet.currency)}
              </p>
              {Number(wallet.lockedBalance) > 0 && (
                <p className="text-white/60 text-sm mt-1">
                  {formatCurrency(wallet.lockedBalance, wallet.currency)} locked
                </p>
              )}
            </div>

            {/* Account number */}
            {wallet.accountNumber && (
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5 w-fit">
                <p className="text-white/80 text-sm font-mono">{wallet.accountNumber}</p>
                <button
                  onClick={handleCopy}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label="Copy account number"
                >
                  {copied ? (
                    <CheckCheck className="w-4 h-4 text-green-300" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur transition-colors">
                <ArrowDownRight className="w-4 h-4" /> Deposit
              </button>
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold text-sm backdrop-blur transition-colors">
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {currencyParam} Transactions
          </h3>
          <button
            onClick={async () => {
              setPage(1);
              setHasMore(true);
              setLoadingInitial(true);
              await fetchTransactions(1, false);
              setLoadingInitial(false);
            }}
            className="w-9 h-9 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {transactions.length === 0 && !loadingInitial ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-bg-secondary flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium">No transactions yet</p>
            <p className="text-text-muted text-sm">
              Your {currencyParam} transaction history will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx, i) => {
              const isCredit = CREDIT_TYPES.has(tx.type);
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-bg-hover transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                        isCredit
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      )}
                    >
                      {isCredit ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-white truncate">
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0 ml-4">
                    <p className={cn('font-semibold text-sm', isCredit ? 'text-success' : 'text-white')}>
                      {isCredit ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <Badge variant={statusVariant[tx.status] ?? 'gray'}>
                      {tx.status}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {loadingMore && <Spinner size="sm" />}
              {!hasMore && transactions.length > 0 && (
                <p className="text-text-muted text-xs">You've reached the end</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
