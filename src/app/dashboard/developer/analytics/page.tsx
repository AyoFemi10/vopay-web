'use client';

import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
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
  RefreshCw,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Webhook,
  BarChart3,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestVolumePoint {
  month: string;
  requests: number;
}

interface EndpointError {
  endpoint: string;
  errorRate: number;
  totalRequests: number;
  errorCount: number;
}

interface WebhookHealth {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number;
  pendingRetries: number;
}

interface DeveloperAnalytics {
  totalRequests30d: number;
  avgResponseTimeMs: number;
  errorRate30d: number;
  activeEndpoints: number;
  requestVolume: RequestVolumePoint[];
  endpointErrors: EndpointError[];
  webhookHealth: WebhookHealth;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MOCK_DATA: DeveloperAnalytics = {
  totalRequests30d: 0,
  avgResponseTimeMs: 0,
  errorRate30d: 0,
  activeEndpoints: 0,
  requestVolume: MONTHS.map((month) => ({ month, requests: 0 })),
  endpointErrors: [
    { endpoint: '/api/v1/transfers', errorRate: 0, totalRequests: 0, errorCount: 0 },
    { endpoint: '/api/v1/wallets',   errorRate: 0, totalRequests: 0, errorCount: 0 },
    { endpoint: '/api/v1/auth',      errorRate: 0, totalRequests: 0, errorCount: 0 },
    { endpoint: '/api/v1/webhooks',  errorRate: 0, totalRequests: 0, errorCount: 0 },
  ],
  webhookHealth: {
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    successRate: 0,
    pendingRetries: 0,
  },
};

const stagger = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  },
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function RequestTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#1A2436] border border-white/10 px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-text-secondary">
        Requests:{' '}
        <span className="text-accent font-bold">{payload[0].value.toLocaleString()}</span>
      </p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

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

// ─── Webhook Health Card ─────────────────────────────────────────────────────

function WebhookHealthCard({ health }: { health: WebhookHealth }) {
  const successPct = health.successRate;
  const isHealthy = successPct >= 95;
  const isWarning = successPct >= 80 && successPct < 95;

  return (
    <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-white text-base">Webhook Health</h3>
          <p className="text-text-muted text-xs mt-0.5">Delivery success indicators</p>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
            isHealthy
              ? 'bg-emerald-500/15 text-emerald-400'
              : isWarning
              ? 'bg-yellow-500/15 text-yellow-400'
              : 'bg-red-500/15 text-red-400'
          )}
        >
          {isHealthy ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          {isHealthy ? 'Healthy' : isWarning ? 'Degraded' : 'Critical'}
        </div>
      </div>

      {/* Success rate ring */}
      <div className="flex items-center justify-center py-4">
        <div className="relative w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={isHealthy ? '#10B981' : isWarning ? '#F59E0B' : '#EF4444'}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - successPct / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-white">{successPct.toFixed(0)}%</span>
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Success</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3 text-center">
          <p className="text-white font-bold text-base">{health.totalDeliveries.toLocaleString()}</p>
          <p className="text-text-muted text-[10px] mt-0.5 uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/15 p-3 text-center">
          <p className="text-emerald-400 font-bold text-base">{health.successfulDeliveries.toLocaleString()}</p>
          <p className="text-text-muted text-[10px] mt-0.5 uppercase tracking-wider">Success</p>
        </div>
        <div className="rounded-xl bg-red-500/10 border border-red-500/15 p-3 text-center">
          <p className="text-red-400 font-bold text-base">{health.failedDeliveries.toLocaleString()}</p>
          <p className="text-text-muted text-[10px] mt-0.5 uppercase tracking-wider">Failed</p>
        </div>
      </div>

      {health.pendingRetries > 0 && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {health.pendingRetries} delivery{health.pendingRetries !== 1 ? 'ies' : 'y'} pending retry
        </div>
      )}
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function DeveloperAnalyticsInner() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<DeveloperAnalytics>({
    queryKey: ['developer-analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/developer');
      return res.data.data as DeveloperAnalytics;
    },
    retry: false,
  });

  const analytics = isError ? MOCK_DATA : (data ?? MOCK_DATA);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm animate-pulse">Loading developer analytics…</p>
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
          <h1 className="text-2xl font-display font-black text-white">Developer Analytics</h1>
          <p className="text-text-muted text-sm mt-0.5">API usage, errors &amp; webhook health</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          aria-label="Refresh developer analytics"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </motion.div>

      {/* ── Error notice ─────────────────────────────────────────────── */}
      {isError && (
        <motion.div variants={stagger.item}>
          <div className="rounded-xl bg-warning/5 border border-warning/20 px-4 py-3 text-sm text-warning flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            Developer analytics endpoint not yet available — showing placeholder data.
          </div>
        </motion.div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Requests (30d)"
          value={analytics.totalRequests30d.toLocaleString()}
          sub="Last 30 days"
          icon={Zap}
          iconColor="text-accent"
          iconBg="bg-accent/15"
        />
        <StatCard
          label="Avg Response Time"
          value={analytics.avgResponseTimeMs > 0 ? `${analytics.avgResponseTimeMs}ms` : '—'}
          sub="Across all endpoints"
          icon={Activity}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/15"
        />
        <StatCard
          label="Error Rate (30d)"
          value={analytics.errorRate30d > 0 ? `${analytics.errorRate30d.toFixed(2)}%` : '0%'}
          sub="Last 30 days"
          icon={analytics.errorRate30d > 5 ? XCircle : CheckCircle2}
          iconColor={analytics.errorRate30d > 5 ? 'text-red-400' : 'text-emerald-400'}
          iconBg={analytics.errorRate30d > 5 ? 'bg-red-500/15' : 'bg-emerald-500/15'}
        />
        <StatCard
          label="Active Endpoints"
          value={String(analytics.activeEndpoints)}
          sub="Receiving traffic"
          icon={BarChart3}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/15"
        />
      </motion.div>

      {/* ── Request Volume Chart ─────────────────────────────────────── */}
      <motion.div variants={stagger.item}>
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">API Request Volume</h3>
            <p className="text-text-muted text-xs mt-0.5">Monthly request count over the last 12 months</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={analytics.requestVolume}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<RequestTooltip />} />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#requestGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Error Rate Table + Webhook Health ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Error rate by endpoint */}
        <motion.div variants={stagger.item}>
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden h-full">
            <div className="px-5 pt-5 pb-3">
              <h3 className="font-bold text-white text-base">Error Rate by Endpoint</h3>
              <p className="text-text-muted text-xs mt-0.5">Errors as a percentage of total requests</p>
            </div>

            {analytics.endpointErrors.length === 0 ? (
              <div className="flex flex-col items-center py-14 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-text-secondary font-semibold text-sm">No error data yet</p>
                <p className="text-text-muted text-xs">Error rates will appear as your API receives traffic</p>
              </div>
            ) : (
              <>
                {/* Horizontal bar chart */}
                <div className="px-5 pb-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                      data={analytics.endpointErrors}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 100, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.04)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: '#6B7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="endpoint"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={95}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{
                          background: '#1A2436',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: '#fff', fontWeight: 600 }}
                        formatter={(v: number) => [`${v.toFixed(2)}%`, 'Error Rate']}
                      />
                      <Bar dataKey="errorRate" radius={[0, 6, 6, 0]} fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detail table */}
                <div className="overflow-x-auto border-t border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Endpoint
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Requests
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Errors
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {analytics.endpointErrors.map((ep, i) => (
                        <tr
                          key={i}
                          className="hover:bg-white/[0.025] transition-colors"
                        >
                          <td className="px-5 py-3">
                            <code className="text-xs text-text-secondary font-mono">{ep.endpoint}</code>
                          </td>
                          <td className="px-5 py-3 text-right text-white font-medium text-xs">
                            {ep.totalRequests.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right text-red-400 font-medium text-xs">
                            {ep.errorCount.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Badge
                              variant={ep.errorRate > 5 ? 'red' : ep.errorRate > 1 ? 'yellow' : 'green'}
                              className="text-[10px]"
                            >
                              {ep.errorRate.toFixed(2)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Webhook health */}
        <motion.div variants={stagger.item}>
          <WebhookHealthCard health={analytics.webhookHealth} />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

export default function DeveloperAnalyticsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeveloperAnalyticsInner />
    </QueryClientProvider>
  );
}
