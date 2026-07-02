'use client';

import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { Chart } from '@/components/ui/Chart';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3,
  Activity,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrendPoint {
  month: string;
  income: number;
  spending: number;
}

interface CurrencyShare {
  currency: string;
  balance: number;
  balanceUsd: number;
}

interface RecentActivity {
  id: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  description: string | null;
  createdAt: string;
}

interface PersonalAnalytics {
  totalBalance: number;
  totalBalanceCurrency: string;
  inflow30d: number;
  outflow30d: number;
  txCount30d: number;
  trend: TrendPoint[];
  currencyDistribution: CurrencyShare[];
  recentActivity: RecentActivity[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
};

const statusVariant: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  COMPLETED: 'green',
  PENDING: 'yellow',
  PROCESSING: 'yellow',
  FAILED: 'red',
  REVERSED: 'red',
  CANCELLED: 'gray',
};

// ─── Mock fallback data (used when API not yet available) ─────────────────────

const MOCK_DATA: PersonalAnalytics = {
  totalBalance: 0,
  totalBalanceCurrency: 'USD',
  inflow30d: 0,
  outflow30d: 0,
  txCount30d: 0,
  trend: [
    { month: 'Jan', income: 0, spending: 0 },
    { month: 'Feb', income: 0, spending: 0 },
    { month: 'Mar', income: 0, spending: 0 },
    { month: 'Apr', income: 0, spending: 0 },
    { month: 'May', income: 0, spending: 0 },
    { month: 'Jun', income: 0, spending: 0 },
    { month: 'Jul', income: 0, spending: 0 },
    { month: 'Aug', income: 0, spending: 0 },
    { month: 'Sep', income: 0, spending: 0 },
    { month: 'Oct', income: 0, spending: 0 },
    { month: 'Nov', income: 0, spending: 0 },
    { month: 'Dec', income: 0, spending: 0 },
  ],
  currencyDistribution: [],
  recentActivity: [],
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
      <div>
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-black text-xl font-display leading-none">{value}</p>
        {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────

interface PiePayloadItem {
  name: string;
  value: number;
  payload: CurrencyShare;
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: PiePayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl bg-[#1A2436] border border-white/10 px-3 py-2 text-sm shadow-xl">
      <p className="font-bold text-white">{item.name}</p>
      <p className="text-text-secondary">{formatCurrency(item.value, item.name)}</p>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function PersonalAnalyticsInner() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<PersonalAnalytics>({
    queryKey: ['personal-analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/personal');
      return res.data.data as PersonalAnalytics;
    },
    // If the endpoint doesn't exist yet, fall back to empty mock data gracefully
    retry: false,
  });

  const analytics = isError ? MOCK_DATA : (data ?? MOCK_DATA);

  // Map trend data to Chart component format (income series)
  const incomeChartData = analytics.trend.map((t) => ({ name: t.month, value: t.income }));
  const spendingChartData = analytics.trend.map((t) => ({ name: t.month, value: t.spending }));

  // Map currency distribution to recharts format
  const pieData = analytics.currencyDistribution.map((c) => ({
    name: c.currency,
    value: c.balanceUsd,
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm animate-pulse">Loading analytics…</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 pb-16 max-w-[1400px]"
      variants={stagger.container}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-white">Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {user?.firstName}&apos;s financial overview
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          aria-label="Refresh analytics"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </motion.div>

      {/* ── Error notice ────────────────────────────────────────────── */}
      {isError && (
        <motion.div variants={stagger.item}>
          <div className="rounded-xl bg-warning/5 border border-warning/20 px-4 py-3 text-sm text-warning flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            Analytics endpoint not yet available — showing placeholder data.
          </div>
        </motion.div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(analytics.totalBalance, analytics.totalBalanceCurrency || 'USD')}
          icon={Wallet}
          iconColor="text-accent"
          iconBg="bg-accent/15"
        />
        <StatCard
          label="30d Inflow"
          value={formatCurrency(analytics.inflow30d, 'USD')}
          sub="Last 30 days"
          icon={ArrowDownRight}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
          trend="up"
        />
        <StatCard
          label="30d Outflow"
          value={formatCurrency(analytics.outflow30d, 'USD')}
          sub="Last 30 days"
          icon={ArrowUpRight}
          iconColor="text-red-400"
          iconBg="bg-red-500/15"
          trend="down"
        />
        <StatCard
          label="Transactions"
          value={String(analytics.txCount30d)}
          sub="Last 30 days"
          icon={BarChart3}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15"
        />
      </motion.div>

      {/* ── Charts Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Income trend */}
        <motion.div variants={stagger.item} className="xl:col-span-2">
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Income vs Spending</h3>
                <p className="text-text-muted text-xs mt-0.5">Last 12 months</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent inline-block" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Spending
                </span>
              </div>
            </div>

            {/* Income chart */}
            <div className="mb-2">
              <Chart data={incomeChartData} color="#3B82F6" height={130} />
            </div>
            {/* Spending chart */}
            <Chart data={spendingChartData} color="#EF4444" height={130} />
          </div>
        </motion.div>

        {/* Currency distribution */}
        <motion.div variants={stagger.item}>
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 h-full">
            <h3 className="font-bold text-white text-base mb-1">Currency Distribution</h3>
            <p className="text-text-muted text-xs mb-4">Wallet balances by currency (USD)</p>

            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-text-secondary text-sm font-medium">No wallet data</p>
                <p className="text-text-muted text-xs text-center">Add funds to your wallets to see distribution</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="mt-3 space-y-2">
                  {analytics.currencyDistribution.map((c, i) => (
                    <div key={c.currency} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-text-secondary font-medium">{c.currency}</span>
                      </div>
                      <span className="text-white font-semibold">
                        {formatCurrency(c.balance, c.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Recent Activity ──────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <h3 className="font-bold text-white text-base">Recent Activity</h3>
            <p className="text-text-muted text-xs mt-0.5">Your latest transactions</p>
          </div>

          {analytics.recentActivity.length === 0 ? (
            <div className="flex flex-col items-center py-14 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                <Activity className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-text-secondary font-semibold text-sm">No recent activity</p>
              <p className="text-text-muted text-xs">Your transactions will appear here</p>
            </div>
          ) : (
            <div className="px-2 pb-3 divide-y divide-white/5">
              {analytics.recentActivity.map((item) => {
                const isCredit = ['DEPOSIT', 'REFUND'].includes(item.type);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3.5 px-3 py-3.5 hover:bg-white/[0.025] rounded-xl transition-colors"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/5 border border-white/8 text-text-secondary'
                      )}
                    >
                      {isCredit ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">
                        {item.description ?? item.type}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {format(new Date(item.createdAt), 'MMM d · h:mm a')}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1 shrink-0">
                      <p
                        className={cn(
                          'font-bold text-sm',
                          isCredit ? 'text-emerald-400' : 'text-white'
                        )}
                      >
                        {isCredit ? '+' : '-'}
                        {formatCurrency(item.amount, item.currency)}
                      </p>
                      <Badge variant={statusVariant[item.status] ?? 'gray'} className="text-[10px] py-0.5 px-2">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function PersonalAnalyticsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <PersonalAnalyticsInner />
    </QueryClientProvider>
  );
}
