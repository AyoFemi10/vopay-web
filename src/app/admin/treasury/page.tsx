'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Landmark,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ArrowDownToLine,
  Percent,
  Settings,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminMfa } from '../layout';
import type { AdminRole } from '@/types/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurrencyReserve {
  currency: string;
  currentBalance: number;
  minimumReserve: number;
  customerFunds: number;
  healthPct: number;
}

interface TreasuryData {
  reserves: CurrencyReserve[];
  totalReservesUsd: number;
  totalCustomerFundsUsd: number;
  totalProviderPendingUsd: number;
  platformProfitMargin: number;
}

interface ReserveConfig {
  currency: string;
  minimumReserve: number;
}

// ─── Allowed roles for config edits ─────────────────────────────────────────

const CONFIG_ALLOWED_ROLES: AdminRole[] = ['ADMINISTRATOR', 'SUPER_ADMINISTRATOR'];

// ─── Health bar ──────────────────────────────────────────────────────────────

function HealthBar({ current, minimum }: { current: number; minimum: number }) {
  const healthPct = minimum > 0 ? Math.min(100, (current / minimum) * 100) : 100;
  const barColor =
    healthPct >= 80 ? 'bg-success' : healthPct >= 50 ? 'bg-warning' : 'bg-error';
  const badgeVariant =
    healthPct >= 80 ? 'green' : healthPct >= 50 ? 'yellow' : 'red';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">
          {current.toLocaleString(undefined, { maximumFractionDigits: 2 })} /{' '}
          {minimum.toLocaleString(undefined, { maximumFractionDigits: 2 })} min
        </span>
        <Badge variant={badgeVariant}>{healthPct.toFixed(0)}%</Badge>
      </div>
      <div className="h-2 bg-bg-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${healthPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── KPI card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-bold text-white truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Reserve Config Modal ─────────────────────────────────────────────────────

function ReserveConfigModal({
  reserves,
  onClose,
  onSave,
  isSaving,
}: {
  reserves: CurrencyReserve[];
  onClose: () => void;
  onSave: (configs: ReserveConfig[]) => void;
  isSaving: boolean;
}) {
  const [configs, setConfigs] = useState<ReserveConfig[]>(
    reserves.map((r) => ({ currency: r.currency, minimumReserve: r.minimumReserve }))
  );

  const updateConfig = (currency: string, value: string) => {
    const num = parseFloat(value);
    setConfigs((prev) =>
      prev.map((c) => (c.currency === currency ? { ...c, minimumReserve: isNaN(num) ? 0 : num } : c))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserve-config-title"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-accent" />
            </div>
            <h3 id="reserve-config-title" className="text-lg font-semibold text-white">
              Edit Reserve Thresholds
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-white hover:bg-bg-hover transition-all"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {configs.map((c) => (
            <div key={c.currency} className="flex items-center gap-4">
              <span className="w-12 text-sm font-semibold text-white">{c.currency}</span>
              <div className="flex-1">
                <label htmlFor={`reserve-${c.currency}`} className="sr-only">
                  Minimum reserve for {c.currency}
                </label>
                <input
                  id={`reserve-${c.currency}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={c.minimumReserve}
                  onChange={(e) => updateConfig(c.currency, e.target.value)}
                  className="input w-full"
                  aria-label={`Minimum reserve for ${c.currency}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={() => onSave(configs)}
            disabled={isSaving}
            className="btn-primary flex-1"
          >
            {isSaving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function AdminTreasuryInner() {
  const { user } = useAuth();
  const { requireTotp } = useAdminMfa();
  const [showConfigModal, setShowConfigModal] = useState(false);

  const canEditConfig =
    user?.adminRole != null && CONFIG_ALLOWED_ROLES.includes(user.adminRole as AdminRole);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<TreasuryData>({
    queryKey: ['admin-treasury'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/treasury');
      return res.data.data as TreasuryData;
    },
    retry: 1,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (payload: { configs: ReserveConfig[]; mfaToken: string }) => {
      const res = await apiClient.patch('/admin/treasury/config', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Reserve thresholds updated');
      setShowConfigModal(false);
      refetch();
    },
    onError: () => {
      toast.error('Failed to update reserve thresholds');
    },
  });

  const handleSaveConfig = (configs: ReserveConfig[]) => {
    requireTotp((totpCode) => {
      updateConfigMutation.mutate({ configs, mfaToken: totpCode });
    });
  };

  const fmt = (val: number) =>
    val.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-accent" /> Treasury
          </h2>
          <p className="text-text-muted text-sm mt-1">Reserve health and platform financials</p>
        </div>
        <div className="flex items-center gap-3">
          {canEditConfig && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Settings className="w-4 h-4" /> Edit Thresholds
            </button>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh treasury data"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Access guard for non-finance roles */}
      {user?.adminRole === 'SUPPORT_AGENT' && (
        <div className="card flex items-center gap-4 border-warning/30 bg-warning/5">
          <AlertTriangle className="w-6 h-6 text-warning shrink-0" />
          <p className="text-warning text-sm font-medium">
            Treasury data is restricted. Contact your administrator for access.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading treasury data…</p>
        </div>
      )}

      {/* Error / not available */}
      {isError && !isLoading && (
        <div className="card text-center py-20">
          <Landmark className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium mb-2">Treasury data unavailable</p>
          <p className="text-text-muted text-sm">The treasury API endpoint is not reachable right now.</p>
          <button onClick={() => refetch()} className="btn-secondary mt-6 mx-auto flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}

      {data && !isLoading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Total Reserves"
              value={fmt(data.totalReservesUsd)}
              icon={Landmark}
              color="bg-accent/10 text-accent"
            />
            <KpiCard
              label="Customer Funds"
              value={fmt(data.totalCustomerFundsUsd)}
              icon={DollarSign}
              color="bg-success/10 text-success"
            />
            <KpiCard
              label="Provider Pending"
              value={fmt(data.totalProviderPendingUsd)}
              icon={ArrowDownToLine}
              color="bg-warning/10 text-warning"
            />
            <KpiCard
              label="Profit Margin"
              value={`${data.platformProfitMargin.toFixed(2)}%`}
              icon={Percent}
              color="bg-blue-500/10 text-blue-400"
            />
          </div>

          {/* Per-currency reserve health */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" /> Reserve Health by Currency
            </h3>
            {data.reserves.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-text-secondary">No reserve data available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.reserves.map((r, i) => (
                  <motion.div
                    key={r.currency}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.06, 0.4) }}
                    className="card space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-white">{r.currency}</span>
                      <span className="text-xs text-text-muted">
                        Cust. funds: {r.customerFunds.toLocaleString()}
                      </span>
                    </div>
                    <HealthBar current={r.currentBalance} minimum={r.minimumReserve} />
                    <p className="text-xs text-text-muted">
                      Current balance:{' '}
                      <span className="text-text-secondary font-medium">
                        {r.currentBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Reserve Config Modal */}
      <AnimatePresence>
        {showConfigModal && data && (
          <ReserveConfigModal
            reserves={data.reserves}
            onClose={() => setShowConfigModal(false)}
            onSave={handleSaveConfig}
            isSaving={updateConfigMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminTreasuryPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminTreasuryInner />
    </QueryClientProvider>
  );
}
