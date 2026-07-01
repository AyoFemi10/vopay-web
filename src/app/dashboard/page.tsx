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
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeftRight,
  CreditCard,
  Zap,
  Bell,
  TrendingUp,
  TrendingDown,
  Wallet,
  Repeat2,
  QrCode,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

// ─── animation presets ────────────────────────────────────────────────────────
const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } },
  item: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const statusVariant: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  COMPLETED: 'green', PENDING: 'yellow', PROCESSING: 'yellow',
  FAILED: 'red', REVERSED: 'red', CANCELLED: 'gray',
};

const CURRENCY_FLAGS: Record<string, string> = {
  NGN: '🇳🇬', USD: '🇺🇸', GBP: '🇬🇧', EUR: '🇪🇺',
  KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦',
};

const CARD_GRADIENTS = [
  'from-[#1E3A8A] via-[#1D4ED8] to-[#3B82F6]',
  'from-[#065F46] via-[#059669] to-[#10B981]',
  'from-[#581C87] via-[#7E22CE] to-[#A855F7]',
  'from-[#92400E] via-[#B45309] to-[#F59E0B]',
];

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickAction({
  icon: Icon, label, href, color, bg,
}: {
  icon: React.ElementType; label: string; href: string; color: string; bg: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -3, scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="flex flex-col items-center gap-2.5 cursor-pointer group"
      >
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.3)] border border-white/8',
          bg, 'group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
        )}>
          <Icon className={cn('w-6 h-6', color)} />
        </div>
        <span className="text-xs font-bold text-text-secondary group-hover:text-white transition-colors tracking-wide">{label}</span>
      </motion.div>
    </Link>
  );
}

// ─── Mini Wallet Card ─────────────────────────────────────────────────────────
function WalletCard({ wallet, idx, hideBalance }: { wallet: WalletData; idx: number; hideBalance: boolean }) {
  const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
  return (
    <Link href={`/dashboard/wallets/${wallet.currency.toLowerCase()}`}>
      <motion.div
        whileHover={{ scale: 1.03, rotateY: 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'relative h-44 rounded-[1.75rem] p-5 flex flex-col justify-between overflow-hidden cursor-pointer',
          'bg-gradient-to-br', grad,
          'shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-white/15'
        )}
      >
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/8 to-transparent pointer-events-none" />
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{CURRENCY_FLAGS[wallet.currency] ?? '💰'}</span>
            <div>
              <p className="text-white font-bold text-base leading-none">{wallet.currency}</p>
              {wallet.isDefault && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/60">Default</span>
              )}
            </div>
          </div>
          {/* Chip */}
          <div className="w-7 h-5 rounded bg-gradient-to-br from-yellow-200/50 to-yellow-400/30 border border-yellow-200/20 shadow-inner" />
        </div>

        <div className="relative z-10">
          <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Balance</p>
          <p className="text-white font-black text-xl font-display tracking-tight leading-none">
            {hideBalance ? '•••••' : formatCurrency(wallet.balance, wallet.currency)}
          </p>
          {wallet.accountNumber && (
            <p className="text-white/40 text-[10px] font-mono tracking-widest mt-2">{wallet.accountNumber}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ tx, delay }: { tx: TransactionData; delay: number }) {
  const isCredit = ['DEPOSIT', 'REFUND'].includes(tx.type);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.025)' }}
      className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-transparent hover:border-white/5 transition-all cursor-pointer"
    >
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
        isCredit
          ? 'bg-success/15 text-success'
          : 'bg-white/5 border border-white/8 text-text-secondary'
      )}>
        {isCredit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white truncate">{tx.description || tx.type}</p>
        <p className="text-xs text-text-muted mt-0.5">{format(new Date(tx.createdAt), 'MMM d · h:mm a')}</p>
      </div>
      <div className="text-right flex flex-col items-end gap-1 shrink-0">
        <p className={cn('font-bold text-sm', isCredit ? 'text-success' : 'text-white')}>
          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
        </p>
        <Badge variant={statusVariant[tx.status] ?? 'gray'} className="text-[10px] py-0.5 px-2">
          {tx.status}
        </Badge>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [data, setData]             = useState<{ wallets: WalletData[]; recentTransactions: TransactionData[] } | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/dashboard');
      if (res.data.success) setData(res.data.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm animate-pulse">Loading your account…</p>
      </div>
    );
  }

  const totalUsd = data?.wallets.reduce((acc, w) => {
    const rate = w.currency === 'NGN' ? 1 / 1500 : w.currency === 'GBP' ? 1.27 : w.currency === 'EUR' ? 1.09 : 1;
    return acc + Number(w.balance) * rate;
  }, 0) ?? 0;

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      className="space-y-6 pb-16 max-w-[1400px]"
      variants={stagger.container}
      initial="hidden"
      animate="visible"
    >
      {/* ── Top greeting row ──────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium">{greeting} 👋</p>
          <h1 className="text-2xl font-display font-black text-white mt-0.5">
            {user?.firstName} {user?.lastName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all"
            title="Toggle balance visibility"
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchDashboard}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white relative hover:bg-white/10 transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-[#0A0A0A]" />
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── MAIN COLUMN ───────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Hero Balance Card */}
          <motion.div variants={stagger.item}>
            <div className="relative rounded-[2.5rem] overflow-hidden">
              {/* Multi-layer gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#0EA5E9]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5" />

              {/* Decorative blobs */}
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent-light/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/8 rounded-full blur-2xl pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 p-7 md:p-9">
                {/* Top row */}
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Total Portfolio</p>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={hideBalance ? 'hidden' : 'shown'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="text-4xl md:text-5xl font-black font-display text-white tracking-tight leading-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
                      >
                        {hideBalance ? '$ ••••••' : formatCurrency(totalUsd, 'USD')}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  {/* "Card" chip visual */}
                  <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-yellow-200/50 to-yellow-400/30 border border-yellow-200/20 shadow-inner hidden sm:block" />
                </div>

                {/* Stats strip */}
                <div className="flex gap-6 mb-8">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                      <TrendingUp className="w-3 h-3 text-success" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Income</p>
                      <p className="text-sm font-bold text-white">{data?.wallets.length ?? 0} wallets</p>
                    </div>
                  </div>
                  <div className="w-px bg-white/15" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center">
                      <TrendingDown className="w-3 h-3 text-error" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/50 uppercase tracking-wider">Transactions</p>
                      <p className="text-sm font-bold text-white">{data?.recentTransactions.length ?? 0} recent</p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  <Link href="/dashboard/wallets?action=deposit">
                    <motion.div
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    >
                      <Plus className="w-4 h-4" /> Add Money
                    </motion.div>
                  </Link>
                  <Link href="/dashboard/transfers?action=send">
                    <motion.div
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/25 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold hover:bg-black/35 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    >
                      <Send className="w-4 h-4" /> Send
                    </motion.div>
                  </Link>
                  <Link href="/dashboard/transfers?action=exchange">
                    <motion.div
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/25 backdrop-blur-sm border border-white/10 text-white text-sm font-semibold hover:bg-black/35 transition-colors cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
                    >
                      <Repeat2 className="w-4 h-4" /> Exchange
                    </motion.div>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions Row */}
          <motion.div variants={stagger.item}>
            <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-5">Quick Actions</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                <QuickAction icon={Send}           label="Send"      href="/dashboard/transfers?action=send"      color="text-accent"        bg="bg-accent/15" />
                <QuickAction icon={ArrowDownRight} label="Receive"   href="/dashboard/wallets?action=deposit"     color="text-success"       bg="bg-success/15" />
                <QuickAction icon={Repeat2}        label="Exchange"  href="/dashboard/transfers?action=exchange"  color="text-warning"       bg="bg-warning/15" />
                <QuickAction icon={CreditCard}     label="Cards"     href="/dashboard/wallets"                    color="text-purple-400"    bg="bg-purple-500/15" />
                <QuickAction icon={QrCode}         label="QR Pay"    href="/dashboard/transfers"                  color="text-pink-400"      bg="bg-pink-500/15" />
                <QuickAction icon={ArrowLeftRight} label="History"   href="/dashboard/transactions"               color="text-text-secondary" bg="bg-white/5" />
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div variants={stagger.item}>
            <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="font-bold text-white text-base">Recent Transactions</h3>
                <Link href="/dashboard/transactions" className="text-xs font-bold text-accent hover:text-accent-light transition-colors px-3 py-1.5 rounded-lg hover:bg-accent/10">
                  View all →
                </Link>
              </div>

              {!data?.recentTransactions?.length ? (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <ArrowLeftRight className="w-7 h-7 text-text-muted" />
                  </div>
                  <p className="text-text-secondary font-semibold">No transactions yet</p>
                  <p className="text-text-muted text-sm">Your activity will appear here</p>
                </div>
              ) : (
                <div className="px-2 pb-3 space-y-0.5">
                  {data.recentTransactions.slice(0, 6).map((tx, i) => (
                    <TxRow key={tx.id} tx={tx} delay={i * 0.04} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── SIDE COLUMN ───────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* My Cards / Wallets */}
          <motion.div variants={stagger.item}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">My Cards</p>
              <Link href="/dashboard/wallets" className="text-xs font-bold text-accent hover:underline">Manage</Link>
            </div>

            {data?.wallets.length ? (
              <div className="space-y-4">
                {data.wallets.slice(0, 3).map((w, i) => (
                  <WalletCard key={w.id} wallet={w} idx={i} hideBalance={hideBalance} />
                ))}
                {data.wallets.length > 3 && (
                  <Link href="/dashboard/wallets" className="block text-center text-sm text-accent hover:underline font-semibold py-2">
                    +{data.wallets.length - 3} more wallets
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-white/10 h-44 flex flex-col items-center justify-center gap-3 hover:border-accent/30 transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-semibold text-text-secondary group-hover:text-white transition-colors">No wallets yet</p>
              </div>
            )}
          </motion.div>

          {/* Upgrade / promo card */}
          <motion.div variants={stagger.item}>
            <div className="relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br from-[#0F172A] to-[#1E293B] border border-white/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-8 -mt-8 blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-bold text-white text-base mb-1.5">Upgrade to Business</h3>
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                  Unlock mass payouts, API access, and dedicated account management.
                </p>
                <Link href="/product" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-white bg-accent/10 hover:bg-accent/20 px-4 py-2 rounded-xl transition-all">
                  Learn more <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Verification reminder */}
          {!user?.isVerified && (
            <motion.div variants={stagger.item}>
              <div className="rounded-2xl bg-warning/5 border border-warning/20 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm mb-1">Verify your email</p>
                    <p className="text-xs text-text-secondary mb-3">Unlock full account features by verifying your email address.</p>
                    <Link href="/auth/verify" className="text-xs font-bold text-warning hover:text-white transition-colors">
                      Verify now →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
