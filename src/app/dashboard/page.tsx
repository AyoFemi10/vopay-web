'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { WalletData, TransactionData } from '@/types/shared';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeftRight,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
};

const statusVariant: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  COMPLETED: 'green',
  PENDING: 'yellow',
  PROCESSING: 'yellow',
  FAILED: 'red',
  REVERSED: 'red',
  CANCELLED: 'gray',
};

export default function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [data, setData] = useState<{
    wallets: WalletData[];
    recentTransactions: TransactionData[];
  } | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/dashboard');
      if (res.data.success) setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  const totalBalanceUsd = data?.wallets.reduce((acc, w) => {
    const rate = w.currency === 'NGN' ? 1 / 1500 : w.currency === 'GBP' ? 1.27 : w.currency === 'EUR' ? 1.09 : 1;
    return acc + Number(w.balance) * rate;
  }, 0) ?? 0;

  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
      variants={stagger.container}
      initial="hidden"
      animate="visible"
    >
      {/* ─── MAIN COLUMN ─────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-6 lg:space-y-8">

        {/* Hero Balance Card */}
        <motion.div variants={stagger.item}>
          <div className="relative rounded-2xl overflow-hidden p-7 bg-gradient-brand shadow-glow">
            {/* Decorative orbs */}
            <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-accent/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/80 text-sm font-medium">Estimated Total Balance (USD)</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHideBalance(!hideBalance)}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Toggle balance visibility"
                  >
                    {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={fetchDashboard}
                    className="text-white/60 hover:text-white transition-colors"
                    aria-label="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <motion.h2
                className="text-4xl md:text-5xl font-black font-display tracking-tight mb-8 text-white"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {hideBalance ? '••••••' : formatCurrency(totalBalanceUsd, 'USD')}
              </motion.h2>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/wallets?action=deposit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm backdrop-blur transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Money
                </Link>
                <Link
                  href="/dashboard/transfers?action=send"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold text-sm backdrop-blur transition-colors"
                >
                  <Send className="w-4 h-4" /> Send Money
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={stagger.item} className="card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Recent Transactions
            </h3>
            <Link
              href="/dashboard/transactions"
              className="text-sm font-medium text-accent hover:text-accent-light transition-colors"
            >
              View all →
            </Link>
          </div>

          {!data?.recentTransactions?.length ? (
            <div className="text-center py-16 flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center">
                <ArrowLeftRight className="w-7 h-7 text-text-muted" />
              </div>
              <p className="text-text-secondary">No transactions yet.</p>
              <Link href="/dashboard/wallets?action=deposit" className="btn-primary btn-sm mt-1">
                Make your first deposit
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.recentTransactions.map((tx, i) => {
                const isCredit = ['DEPOSIT', 'REFUND'].includes(tx.type);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-bg-hover transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110',
                          isCredit ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                        )}
                      >
                        {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className={cn('font-semibold', isCredit ? 'text-success' : 'text-white')}>
                        {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <Badge variant={statusVariant[tx.status] ?? 'gray'}>
                        {tx.status}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ─── SIDE COLUMN ──────────────────────────────────────────── */}
      <div className="space-y-6 lg:space-y-8">

        {/* Wallets */}
        <motion.div variants={stagger.item} className="card">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-semibold">Your Wallets</h3>
            <Link
              href="/dashboard/wallets"
              className="text-xs font-medium text-accent hover:text-accent-light transition-colors"
            >
              Manage →
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {data?.wallets.map((wallet) => (
              <Link
                href={`/dashboard/wallets/${wallet.currency.toLowerCase()}`}
                key={wallet.id}
                className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-accent/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-primary border border-bg-border flex items-center justify-center font-bold text-xs text-accent group-hover:bg-accent/10 transition-colors">
                    {wallet.currency}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{wallet.currency} Wallet</p>
                    <p className="text-xs text-text-muted">{wallet.isDefault ? '✦ Default' : 'Active'}</p>
                  </div>
                </div>
                <p className="font-semibold text-white">
                  {hideBalance ? '••••' : formatCurrency(wallet.balance, wallet.currency)}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={stagger.item} className="card">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Deposit', icon: ArrowDownRight, href: '/dashboard/wallets?action=deposit' },
              { label: 'Send',    icon: Send,           href: '/dashboard/transfers?action=send' },
              { label: 'Exchange', icon: ArrowLeftRight, href: '/dashboard/transfers?action=exchange' },
              { label: 'History', icon: TrendingUp,     href: '/dashboard/transactions' },
            ].map(({ label, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-bg-secondary border border-bg-border hover:border-accent/50 hover:bg-accent/5 transition-all text-sm font-medium text-text-secondary hover:text-accent group"
              >
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
