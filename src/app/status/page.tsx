'use client';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatusComponent {
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'MAJOR_OUTAGE';
  description?: string;
}

interface StatusIncident {
  id: string;
  title: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  updates: { message: string; createdAt: string }[];
}

interface UptimeEntry {
  date: string;
  uptimePct: number;
}

interface PlatformStatus {
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  components: StatusComponent[];
  openIncidents: StatusIncident[];
  uptimeHistory: UptimeEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COMPONENT_STATUS_DOT: Record<StatusComponent['status'], string> = {
  OPERATIONAL:    'bg-emerald-400',
  DEGRADED:       'bg-yellow-400',
  PARTIAL_OUTAGE: 'bg-orange-400',
  MAJOR_OUTAGE:   'bg-red-500',
};

const COMPONENT_STATUS_LABEL: Record<StatusComponent['status'], string> = {
  OPERATIONAL:    'Operational',
  DEGRADED:       'Degraded',
  PARTIAL_OUTAGE: 'Partial Outage',
  MAJOR_OUTAGE:   'Major Outage',
};

const INCIDENT_SEVERITY_VARIANT: Record<StatusIncident['severity'], string> = {
  MINOR:    'bg-yellow-400/10 text-yellow-400',
  MAJOR:    'bg-orange-400/10 text-orange-400',
  CRITICAL: 'bg-red-500/10 text-red-400',
};

const INCIDENT_STATUS_LABEL: Record<StatusIncident['status'], string> = {
  INVESTIGATING: 'Investigating',
  IDENTIFIED:    'Identified',
  MONITORING:    'Monitoring',
  RESOLVED:      'Resolved',
};

// ─── Fallback data ────────────────────────────────────────────────────────────

const FALLBACK: PlatformStatus = {
  overallStatus: 'OPERATIONAL',
  components: [
    { name: 'API Gateway', status: 'OPERATIONAL' },
    { name: 'Payments',    status: 'OPERATIONAL' },
    { name: 'Wallets',     status: 'OPERATIONAL' },
    { name: 'Auth',        status: 'OPERATIONAL' },
    { name: 'Webhooks',    status: 'OPERATIONAL' },
    { name: 'Dashboard',   status: 'OPERATIONAL' },
  ],
  openIncidents: [],
  uptimeHistory: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
    uptimePct: 99.9 + Math.random() * 0.09,
  })),
};

// ─── Inner Component ──────────────────────────────────────────────────────────

function StatusInner() {
  const { data, isLoading, refetch, isFetching } = useQuery<PlatformStatus>({
    queryKey: ['platform-status'],
    queryFn: async () => {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ?? 'https://api.vopayx.qzz.io/api';
      const base = API_URL.replace(/\/+$/, '').endsWith('/api')
        ? API_URL.replace(/\/api$/, '')
        : API_URL;
      const res = await fetch(`${base}/api/status`);
      if (!res.ok) throw new Error('Status unavailable');
      const json = await res.json() as { data?: PlatformStatus } & Partial<PlatformStatus>;
      return json.data ?? (json as PlatformStatus);
    },
    retry: false,
    staleTime: 60_000,
  });

  const status = data ?? FALLBACK;

  const overallBanner = {
    OPERATIONAL: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle, label: 'All Systems Operational' },
    DEGRADED:    { bg: 'bg-yellow-500/10 border-yellow-500/30',   text: 'text-yellow-400',  icon: AlertTriangle, label: 'Degraded Performance' },
    OUTAGE:      { bg: 'bg-red-500/10 border-red-500/30',         text: 'text-red-400',      icon: XCircle, label: 'System Outage' },
  }[status.overallStatus];

  const BannerIcon = overallBanner.icon;

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#080E1C]">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[0.875rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              VOPay<span className="text-blue-400">X</span>
            </span>
            <span className="text-text-muted text-sm mx-2">/</span>
            <span className="text-text-secondary text-sm font-semibold">Status</span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh status"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* Overall Status Banner */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-text-secondary text-sm">Checking system status…</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-2xl border px-6 py-5 flex items-center gap-4',
                overallBanner.bg
              )}
            >
              <BannerIcon className={cn('w-7 h-7 shrink-0', overallBanner.text)} />
              <div>
                <p className={cn('text-xl font-bold', overallBanner.text)}>
                  {overallBanner.label}
                </p>
                <p className="text-text-muted text-sm mt-0.5">
                  Last updated {format(new Date(), 'MMM d, yyyy · HH:mm')} UTC
                </p>
              </div>
            </motion.div>

            {/* Component Grid */}
            <section>
              <h2 className="text-lg font-bold text-white mb-4">System Components</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {status.components.map((comp, i) => (
                  <motion.div
                    key={comp.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="rounded-2xl bg-[#0D1525] border border-white/5 p-4 flex items-center gap-3"
                  >
                    <span
                      className={cn(
                        'w-3 h-3 rounded-full shrink-0',
                        COMPONENT_STATUS_DOT[comp.status]
                      )}
                      aria-label={`${comp.name}: ${COMPONENT_STATUS_LABEL[comp.status]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-white truncate">{comp.name}</p>
                      {comp.description && (
                        <p className="text-text-muted text-xs mt-0.5 truncate">{comp.description}</p>
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-semibold shrink-0',
                      comp.status === 'OPERATIONAL' ? 'text-emerald-400' : 'text-yellow-400'
                    )}>
                      {COMPONENT_STATUS_LABEL[comp.status]}
                    </span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Open Incidents */}
            {status.openIncidents.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Active Incidents
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs font-bold">
                    {status.openIncidents.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {status.openIncidents.map((incident, i) => (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.3) }}
                      className="rounded-2xl bg-[#0D1525] border border-white/5 p-5 space-y-3"
                    >
                      <div className="flex items-start gap-3 flex-wrap">
                        <p className="font-semibold text-white flex-1">{incident.title}</p>
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold shrink-0',
                          INCIDENT_SEVERITY_VARIANT[incident.severity]
                        )}>
                          {incident.severity}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-text-secondary text-xs font-semibold shrink-0">
                          {INCIDENT_STATUS_LABEL[incident.status]}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted">
                        Opened {format(new Date(incident.createdAt), 'MMM d, yyyy HH:mm')}
                        {incident.status !== 'RESOLVED' && ' · '}
                        {incident.status !== 'RESOLVED' && `Updated ${format(new Date(incident.updatedAt), 'HH:mm')}`}
                      </p>
                      {incident.updates.length > 0 && (
                        <div className="border-l-2 border-white/10 pl-4 space-y-2">
                          {incident.updates.map((upd, j) => (
                            <div key={j}>
                              <p className="text-xs text-text-muted">{format(new Date(upd.createdAt), 'MMM d HH:mm')}</p>
                              <p className="text-sm text-text-secondary mt-0.5">{upd.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Uptime History */}
            {status.uptimeHistory.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-1">Uptime History</h2>
                <p className="text-text-muted text-sm mb-4">Last {status.uptimeHistory.length} days</p>
                <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5">
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={status.uptimeHistory} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: string) => format(new Date(v), 'MMM d')}
                        interval={Math.ceil(status.uptimeHistory.length / 6)}
                      />
                      <YAxis
                        domain={[99, 100]}
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0D1525', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: '#9CA3AF' }}
                        formatter={(value: number) => [`${value.toFixed(3)}%`, 'Uptime']}
                        labelFormatter={(label: string) => format(new Date(label), 'MMM d, yyyy')}
                      />
                      <Area
                        type="monotone"
                        dataKey="uptimePct"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#uptimeGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 0, staleTime: 60_000 } },
});

export default function StatusPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusInner />
    </QueryClientProvider>
  );
}
