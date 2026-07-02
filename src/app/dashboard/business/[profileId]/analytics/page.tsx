'use client';

import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { use } from 'react';
import { apiClient } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Receipt,
  Users,
  DollarSign,
  RefreshCw,
  Activity,
  AlertCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface InvoiceFunnelItem {
  status: string;
  count: number;
}

interface TopCustomer {
  name: string;
  totalPaid: number;
  invoiceCount: number;
}

interface BusinessAnalytics {
  totalRevenue30d: number;
  invoiceCount30d: number;
  paidInvoices: number;
  pendingInvoices: number;
  currency: string;
  revenueByMonth: RevenuePoint[];
  invoiceFunnel: InvoiceFunnelItem[];
  topCustomers: TopCustomer[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_DATA: BusinessAnalytics = {
  totalRevenue30d: 0,
  invoiceCount30d: 0,
  paidInvoices: 0,
  pendingInvoices: 0,
  currency: 'NGN',
  revenueByMonth: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ].map((m) => ({ month: m, revenue: 0 })),
  invoiceFunnel: [
    { status: 'DRAFT', count: 0 },
    { status: 'SENT', count: 0 },
    { status: 'PAID', count: 0 },
  ],
  topCustomers: [],
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
};

const FUNNEL_COLORS: Record<string, string> = {
  DRAFT: '#6B7280',
  SENT: '#3B82F6',
  PAID: '#10B981',
  OVERDUE: '#EF4444',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1A2436] border border-white/10 px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-text-secondary">
        Revenue: <span className="text-emerald-400 font-bold">{formatCurrency(payload[0].value, 'NGN')}</span>
      </p>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 flex flex-col gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
        <Icon className={cn('w-5 h-5', iconColor)} />
      </div>
      <div>
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white font-black text-xl font-display leading-none">{value}</p>
        {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function BusinessAnalyticsInner({ profileId }: { profileId: string }) {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<BusinessAnalytics>({
    queryKey: ['business-analytics', profileId],
    queryFn: async () => {
      const res = await apiClient.get(`/analytics/business?profileId=${profileId}`);
      return res.data.data as BusinessAnalytics;
    },
    retry: false,
  });

  const analytics = isError ? MOCK_DATA : (data ?? MOCK_DATA);

  const paidPct =
    analytics.invoiceCount30d > 0
      ? Math.round((analytics.paidInvoices / analytics.invoiceCount30d) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm animate-pulse">Loading business analytics…</p>
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
          <h1 className="text-2xl font-display font-black text-white">Business Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">Revenue, invoices &amp; customer insights</p>
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

      {/* ── Error notice ─────────────────────────────────────────────── */}
      {isError && (
        <motion.div variants={stagger.item}>
          <div className="rounded-xl bg-warning/5 border border-warning/20 px-4 py-3 text-sm text-warning flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            Business analytics endpoint not yet available — showing placeholder data.
          </div>
        </motion.div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue (30d)"
          value={formatCurrency(analytics.totalRevenue30d, analytics.currency)}
          sub="Last 30 days"
          icon={DollarSign}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/15"
        />
        <StatCard
          label="Invoices (30d)"
          value={String(analytics.invoiceCount30d)}
          sub="Last 30 days"
          icon={Receipt}
          iconColor="text-accent"
          iconBg="bg-accent/15"
        />
        <StatCard
          label="Paid Invoices"
          value={String(analytics.paidInvoices)}
          sub={`${paidPct}% conversion`}
          icon={TrendingUp}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/15"
        />
        <StatCard
          label="Pending Invoices"
          value={String(analytics.pendingInvoices)}
          sub="Awaiting payment"
          icon={AlertCircle}
          iconColor="text-yellow-400"
          iconBg="bg-yellow-500/15"
        />
      </motion.div>

      {/* ── Revenue Chart ─────────────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">Monthly Revenue</h3>
            <p className="text-text-muted text-xs mt-0.5">Last 12 months</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics.revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Invoice Funnel + Top Customers ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Invoice Status Funnel */}
        <motion.div variants={stagger.item}>
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 h-full">
            <div className="mb-4">
              <h3 className="font-bold text-white text-base">Invoice Conversion Funnel</h3>
              <p className="text-text-muted text-xs mt-0.5">DRAFT → SENT → PAID</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={analytics.invoiceFunnel}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 20, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="status"
                  tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#1A2436', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                  itemStyle={{ color: '#9CA3AF' }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  fill="#3B82F6"
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {analytics.invoiceFunnel.map((item) => (
                <div key={item.status} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: FUNNEL_COLORS[item.status] ?? '#6B7280' }}
                  />
                  <span className="text-text-secondary">{item.status}</span>
                  <span className="text-white font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Customers */}
        <motion.div variants={stagger.item}>
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden h-full">
            <div className="px-5 pt-5 pb-3">
              <h3 className="font-bold text-white text-base">Top Customers</h3>
              <p className="text-text-muted text-xs mt-0.5">By total payment value</p>
            </div>

            {analytics.topCustomers.length === 0 ? (
              <div className="flex flex-col items-center py-14 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <Users className="w-6 h-6 text-text-muted" />
                </div>
                <p className="text-text-secondary font-semibold text-sm">No customer data yet</p>
                <p className="text-text-muted text-xs">Customer analytics will appear after payments are received</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Total Paid</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {analytics.topCustomers.map((customer, i) => (
                      <tr
                        key={i}
                        className="hover:bg-white/[0.025] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-xs font-bold text-accent uppercase shrink-0">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="text-white font-medium truncate max-w-[160px]">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-emerald-400 font-bold">
                            {formatCurrency(customer.totalPaid, analytics.currency)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Badge variant="gray">{customer.invoiceCount}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default function BusinessAnalyticsPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = use(params);
  return (
    <QueryClientProvider client={queryClient}>
      <BusinessAnalyticsInner profileId={profileId} />
    </QueryClientProvider>
  );
}
