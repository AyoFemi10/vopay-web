'use client';

import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Users,
  ArrowLeftRight,
  Wallet,
  RefreshCw,
  Activity,
  FileCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Lock,
  TrendingUp,
} from 'lucide-react';

// ─── Role Gate ────────────────────────────────────────────────────────────────

const ALLOWED_ROLES = ['FINANCE_TEAM', 'ADMINISTRATOR', 'SUPER_ADMINISTRATOR'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TxVolumePoint {
  day: string;
  volume: number;
  count: number;
}

interface PlatformKpis {
  totalUsers: number;
  totalTransactions30d: number;
  totalVolume30d: number;
  activeWallets: number;
  volumeCurrency: string;
  txVolumeTrend: TxVolumePoint[];
}

interface KycQueueStats {
  pendingReviews: number;
  avgReviewTimeHours: number;
  approvedToday: number;
  rejectedToday: number;
}

interface FraudAlerts {
  openEvents: number;
  frozenAccounts: number;
  resolvedLast7d: number;
  highSeverity: number;
}

interface AdminAnalytics {
  platform: PlatformKpis;
  kycQueue: KycQueueStats;
  fraud: FraudAlerts;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const DAYS_30 = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

const MOCK_DATA: AdminAnalytics = {
  platform: {
    totalUsers: 0,
    totalTransactions30d: 0,
    totalVolume30d: 0,
    activeWallets: 0,
    volumeCurrency: 'USD',
    txVolumeTrend: DAYS_30.map((day) => ({ day, volume: 0, count: 0 })),
  },
  kycQueue: {
    pendingReviews: 0,
    avgReviewTimeHours: 0,
    approvedToday: 0,
    rejectedToday: 0,
  },
  fraud: {
    openEvents: 0,
    frozenAccounts: 0,
    resolvedLast7d: 0,
    highSeverity: 0,
  },
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
  alert,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 flex flex-col gap-3',
        alert
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-[#0D1525] border-white/5'
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div>
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <p className={cn('font-black text-xl font-display leading-none', alert ? 'text-red-400' : 'text-white')}>
          {value}
        </p>
        {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function VolumeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1A2436] border border-white/10 px-3 py-2 text-sm shadow-xl space-y-1">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-text-secondary">
          {p.name === 'volume' ? 'Volume' : 'Txns'}:{' '}
          <span className="text-accent font-bold">
            {p.name === 'volume' ? formatCurrency(p.value, 'USD') : p.value.toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function AdminAnalyticsInner() {
  const { user } = useAuth();

  // Role gate
  const hasAccess = user?.adminRole && ALLOWED_ROLES.includes(user.adminRole);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminAnalytics>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/admin');
      return res.data.data as AdminAnalytics;
    },
    retry: false,
    enabled: !!hasAccess,
  });

  // ── Role gate UI ────────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Access Restricted</h2>
          <p className="text-text-secondary text-sm max-w-sm">
            This page requires a Finance Team, Administrator, or Super Administrator role. Your current
            role ({user?.adminRole?.replace(/_/g, ' ') ?? 'Unknown'}) does not have access.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm animate-pulse">Loading platform analytics…</p>
      </div>
    );
  }

  const analytics = isError ? MOCK_DATA : (data ?? MOCK_DATA);
  const { platform, kycQueue, fraud } = analytics;

  return (
    <motion.div
      className="space-y-6 pb-16"
      variants={stagger.container}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-white">Platform Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">KPIs, KYC queue &amp; fraud overview</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          aria-label="Refresh admin analytics"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </motion.div>

      {/* ── Error notice ─────────────────────────────────────────────── */}
      {isError && (
        <motion.div variants={stagger.item}>
          <div className="rounded-xl bg-warning/5 border border-warning/20 px-4 py-3 text-sm text-warning flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            Admin analytics endpoint not yet available — showing placeholder data.
          </div>
        </motion.div>
      )}

      {/* ── Platform KPIs ────────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Platform KPIs</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={platform.totalUsers.toLocaleString()}
            sub="All time"
            icon={Users}
            iconColor="text-accent"
            iconBg="bg-accent/15"
          />
          <StatCard
            label="Transactions (30d)"
            value={platform.totalTransactions30d.toLocaleString()}
            sub="Last 30 days"
            icon={ArrowLeftRight}
            iconColor="text-blue-400"
            iconBg="bg-blue-500/15"
          />
          <StatCard
            label="Volume (30d)"
            value={formatCurrency(platform.totalVolume30d, platform.volumeCurrency || 'USD')}
            sub="Last 30 days"
            icon={TrendingUp}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/15"
          />
          <StatCard
            label="Active Wallets"
            value={platform.activeWallets.toLocaleString()}
            sub="With recent activity"
            icon={Wallet}
            iconColor="text-purple-400"
            iconBg="bg-purple-500/15"
          />
        </div>
      </motion.div>

      {/* ── Transaction Volume Trend ──────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Transaction Volume Trend</h3>
            <p className="text-text-muted text-xs mt-0.5">Last 30 days — daily volume (USD)</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={platform.txVolumeTrend}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="adminVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#6B7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={55}
                tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
              />
              <Tooltip content={<VolumeTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#adminVolumeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── KYC Queue + Fraud Alerts ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* KYC Queue depth */}
        <motion.div variants={stagger.item}>
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">KYC Queue Depth</h3>
                <p className="text-text-muted text-xs mt-0.5">Pending identity verifications</p>
              </div>
            </div>

            {/* Pending reviews highlight */}
            <div className="flex items-center justify-between mb-5 p-4 rounded-xl bg-blue-500/8 border border-blue-500/15">
              <div>
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">
                  Pending Reviews
                </p>
                <p className="text-4xl font-black font-display text-white leading-none">
                  {kycQueue.pendingReviews.toLocaleString()}
                </p>
              </div>
              {kycQueue.pendingReviews > 50 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  High Queue
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-muted" />
                  <p className="text-text-muted text-[10px] uppercase tracking-wider">Avg Review</p>
                </div>
                <p className="text-white font-bold text-sm">
                  {kycQueue.avgReviewTimeHours > 0
                    ? `${kycQueue.avgReviewTimeHours.toFixed(1)}h`
                    : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/15 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-text-muted text-[10px] uppercase tracking-wider">Approved</p>
                </div>
                <p className="text-emerald-400 font-bold text-sm">{kycQueue.approvedToday}</p>
                <p className="text-text-muted text-[10px]">today</p>
              </div>
              <div className="rounded-xl bg-red-500/10 border border-red-500/15 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <p className="text-text-muted text-[10px] uppercase tracking-wider">Rejected</p>
                </div>
                <p className="text-red-400 font-bold text-sm">{kycQueue.rejectedToday}</p>
                <p className="text-text-muted text-[10px]">today</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fraud Alerts */}
        <motion.div variants={stagger.item}>
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 h-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Fraud Alerts</h3>
                <p className="text-text-muted text-xs mt-0.5">Active risk events &amp; frozen accounts</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard
                label="Open Events"
                value={String(fraud.openEvents)}
                sub="Requires review"
                icon={AlertTriangle}
                iconColor="text-yellow-400"
                iconBg="bg-yellow-500/15"
                alert={fraud.openEvents > 10}
              />
              <StatCard
                label="Frozen Accounts"
                value={String(fraud.frozenAccounts)}
                sub="Currently frozen"
                icon={Lock}
                iconColor="text-red-400"
                iconBg="bg-red-500/15"
                alert={fraud.frozenAccounts > 0}
              />
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.04] border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-text-secondary text-sm">Resolved in last 7 days</span>
              </div>
              <span className="text-white font-bold text-sm">{fraud.resolvedLast7d}</span>
            </div>

            {fraud.highSeverity > 0 && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <p className="text-red-400 font-semibold text-sm">
                    {fraud.highSeverity} high-severity event{fraud.highSeverity !== 1 ? 's' : ''} open
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">Immediate review recommended</p>
                </div>
                <Badge variant="red" className="ml-auto shrink-0">
                  Urgent
                </Badge>
              </div>
            )}

            {fraud.openEvents === 0 && fraud.frozenAccounts === 0 && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                No active fraud events — platform is clear.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function AdminAnalyticsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAnalyticsInner />
    </QueryClientProvider>
  );
}
