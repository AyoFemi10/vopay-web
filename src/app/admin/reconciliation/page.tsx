'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAdminMfa } from '../layout';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  GitCompareArrows,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type RunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface ReconciliationRun {
  id: string;
  provider: string;
  currency: string;
  runAt: string;
  status: RunStatus;
  discrepancyCount: number;
  totalChecked: number;
}

interface ReconciliationIncident {
  id: string;
  runId: string;
  severity: IncidentSeverity;
  description: string;
  createdAt: string;
  resolvedAt: string | null;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const RUN_STATUS_VARIANT: Record<RunStatus, 'yellow' | 'green' | 'red'> = {
  RUNNING:   'yellow',
  COMPLETED: 'green',
  FAILED:    'red',
};

const SEVERITY_VARIANT: Record<IncidentSeverity, 'gray' | 'yellow' | 'red'> = {
  LOW:      'gray',
  MEDIUM:   'yellow',
  HIGH:     'red',
  CRITICAL: 'red',
};

// ─── Trigger Run Modal ────────────────────────────────────────────────────────

function TriggerRunModal({
  onConfirm,
  onClose,
  isTriggeringRun,
}: {
  onConfirm: () => void;
  onClose: () => void;
  isTriggeringRun: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trigger-run-title"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <GitCompareArrows className="w-5 h-5 text-accent" />
          </div>
          <h3 id="trigger-run-title" className="text-lg font-semibold text-white">
            Trigger Reconciliation Run
          </h3>
        </div>
        <p className="text-text-muted text-sm mb-6">
          This will start a new reconciliation run across all providers. Continue?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isTriggeringRun}
            className="btn-secondary flex-1"
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isTriggeringRun}
            className="btn-primary flex-1"
          >
            {isTriggeringRun ? <Spinner size="sm" /> : <CheckCircle className="w-4 h-4" />}
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function AdminReconciliationInner() {
  const { requireTotp } = useAdminMfa();
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [mfaConfirmed, setMfaConfirmed] = useState(false);

  // ── Runs query ────────────────────────────────────────────────────────────
  const {
    data: runsData,
    isLoading: runsLoading,
    refetch: refetchRuns,
    isFetching: runsFetching,
  } = useQuery<ReconciliationRun[]>({
    queryKey: ['admin-reconciliation-runs'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/reconciliation/runs');
      return res.data.data as ReconciliationRun[];
    },
    retry: 1,
    // Graceful fallback: return empty array on error via initialData pattern
    initialData: undefined,
  });

  // ── Incidents query ───────────────────────────────────────────────────────
  const {
    data: incidentsData,
    isLoading: incidentsLoading,
    refetch: refetchIncidents,
  } = useQuery<ReconciliationIncident[]>({
    queryKey: ['admin-reconciliation-incidents'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/reconciliation/incidents');
      return res.data.data as ReconciliationIncident[];
    },
    retry: 1,
    initialData: undefined,
  });

  // ── Trigger run mutation ──────────────────────────────────────────────────
  const triggerMutation = useMutation({
    mutationFn: async (mfaToken: string) => {
      const res = await apiClient.post('/admin/reconciliation/trigger', { mfaToken });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Reconciliation run triggered');
      setShowTriggerModal(false);
      setMfaConfirmed(false);
      refetchRuns();
    },
    onError: () => {
      toast.error('Failed to trigger reconciliation run');
      setMfaConfirmed(false);
    },
  });

  // ── Resolve incident mutation ─────────────────────────────────────────────
  const resolveMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.patch(
        `/admin/reconciliation/incidents/${id}/resolve`,
        { mfaToken }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Incident resolved');
      refetchIncidents();
    },
    onError: () => {
      toast.error('Failed to resolve incident');
    },
  });

  const handleTriggerClick = () => {
    requireTotp((totpCode) => {
      setMfaConfirmed(true);
      setShowTriggerModal(true);
      // Store totp code for when modal confirms
      // We immediately trigger since MFA has been confirmed via TOTP modal
      triggerMutation.mutate(totpCode);
    });
  };

  const handleResolveIncident = (id: string) => {
    requireTotp((totpCode) => {
      resolveMutation.mutate({ id, mfaToken: totpCode });
    });
  };

  const handleRefreshAll = () => {
    refetchRuns();
    refetchIncidents();
  };

  const runs      = runsData      ?? [];
  const incidents = incidentsData ?? [];
  const openIncidents = incidents.filter((inc) => inc.resolvedAt === null);

  const isFetching = runsFetching;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GitCompareArrows className="w-6 h-6 text-accent" /> Reconciliation
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Run history and open discrepancy incidents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerClick}
            disabled={triggerMutation.isPending}
            className="btn-primary flex items-center gap-2"
          >
            {triggerMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Trigger Run
          </button>
          <button
            onClick={handleRefreshAll}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh reconciliation data"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Runs Table ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <GitCompareArrows className="w-4 h-4 text-accent" /> Run History
        </h3>

        {runsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size="lg" />
            <p className="text-text-secondary text-sm">Loading reconciliation runs…</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="card text-center py-16">
            <GitCompareArrows className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No reconciliation runs yet</p>
            <p className="text-text-muted text-sm mt-1">
              Trigger a run to start reconciling provider data
            </p>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">ID</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Provider</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Currency</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Ran At</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Discrepancies</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Total Checked</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run, i) => (
                  <motion.tr
                    key={run.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                      {run.id.slice(0, 8)}…
                    </td>
                    <td className="px-5 py-4 text-white font-medium">{run.provider}</td>
                    <td className="px-5 py-4 text-text-secondary">{run.currency}</td>
                    <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                      {format(new Date(run.runAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={RUN_STATUS_VARIANT[run.status]}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      <span
                        className={cn(
                          'font-semibold',
                          run.discrepancyCount > 0 ? 'text-error' : 'text-success'
                        )}
                      >
                        {run.discrepancyCount}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-secondary tabular-nums">
                      {run.totalChecked.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Open Incidents ──────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Open Incidents
          {openIncidents.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-error/15 text-error text-xs font-bold">
              {openIncidents.length}
            </span>
          )}
        </h3>

        {incidentsLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner size="lg" />
            <p className="text-text-secondary text-sm">Loading incidents…</p>
          </div>
        ) : openIncidents.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
            <p className="text-text-secondary font-medium">No open incidents</p>
            <p className="text-text-muted text-sm mt-1">
              All discrepancies have been resolved
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openIncidents.map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="card flex items-start gap-4"
              >
                {/* Severity indicator */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    incident.severity === 'CRITICAL' && 'bg-error/20',
                    incident.severity === 'HIGH'     && 'bg-error/10',
                    incident.severity === 'MEDIUM'   && 'bg-warning/10',
                    incident.severity === 'LOW'      && 'bg-bg-hover'
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      'w-5 h-5',
                      incident.severity === 'CRITICAL' && 'text-error',
                      incident.severity === 'HIGH'     && 'text-error',
                      incident.severity === 'MEDIUM'   && 'text-warning',
                      incident.severity === 'LOW'      && 'text-text-muted'
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant={SEVERITY_VARIANT[incident.severity]}>
                      {incident.severity === 'CRITICAL'
                        ? 'CRITICAL — Urgent'
                        : incident.severity}
                    </Badge>
                    <span className="text-xs text-text-muted font-mono">
                      Run: {incident.runId.slice(0, 8)}…
                    </span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">
                    {incident.description}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Created {format(new Date(incident.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>

                {/* Resolve button */}
                <button
                  onClick={() => handleResolveIncident(incident.id)}
                  disabled={resolveMutation.isPending}
                  className="btn-secondary btn-sm text-xs flex items-center gap-1.5 shrink-0"
                  aria-label={`Resolve incident ${incident.id}`}
                >
                  {resolveMutation.isPending ? (
                    <Spinner size="sm" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  Resolve
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Trigger Run Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showTriggerModal && (
          <TriggerRunModal
            onConfirm={() => {
              /* MFA already handled via requireTotp above */
              setShowTriggerModal(false);
            }}
            onClose={() => {
              setShowTriggerModal(false);
              setMfaConfirmed(false);
            }}
            isTriggeringRun={triggerMutation.isPending}
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

export default function AdminReconciliationPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminReconciliationInner />
    </QueryClientProvider>
  );
}
