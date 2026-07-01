'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAdminMfa } from '@/app/admin/layout';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FraudEvent {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  score: number;
  action: string;
  transactionId?: string | null;
  createdAt: string;
  status?: string;
}

interface RiskEventsResponse {
  events: FraudEvent[];
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreBadge(score: number): 'green' | 'yellow' | 'red' {
  if (score < 40) return 'green';
  if (score < 70) return 'yellow';
  return 'red';
}

// ─── Inner page ───────────────────────────────────────────────────────────────

const LIMIT = 20;

function AdminRiskEventsInner() {
  const queryClient = useQueryClient();
  const { requireTotp } = useAdminMfa();

  const [page, setPage] = useState(1);

  // ── Fetch risk events ────────────────────────────────────────────────────
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-risk-events', page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      const res = await apiClient.get(`/admin/risk-events?${params.toString()}`);
      return res.data.data as RiskEventsResponse;
    },
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  // ── Release mutation ─────────────────────────────────────────────────────
  const releaseMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.post(
        `/admin/risk-events/${id}/release`,
        {},
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Risk event released');
      queryClient.invalidateQueries({ queryKey: ['admin-risk-events'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to release event';
      toast.error(msg);
    },
  });

  // ── Escalate mutation ────────────────────────────────────────────────────
  const escalateMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.post(
        `/admin/risk-events/${id}/escalate`,
        {},
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Risk event escalated');
      queryClient.invalidateQueries({ queryKey: ['admin-risk-events'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to escalate event';
      toast.error(msg);
    },
  });

  const isMutating = releaseMutation.isPending || escalateMutation.isPending;

  const handleRelease = (id: string) => {
    requireTotp((mfaToken) => releaseMutation.mutate({ id, mfaToken }));
  };

  const handleEscalate = (id: string) => {
    requireTotp((mfaToken) => escalateMutation.mutate({ id, mfaToken }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-error" /> Risk Events
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} events</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading risk events…</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-20">
          <AlertTriangle className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No risk events found</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">User</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Score</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Action</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Transaction ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <motion.tr
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white text-sm">{event.userName ?? '—'}</p>
                    <p className="text-xs text-text-muted">{event.userEmail ?? event.userId}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={scoreBadge(event.score)}>
                      {event.score}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{event.action}</td>
                  <td className="px-5 py-4">
                    {event.transactionId ? (
                      <code className="text-xs font-mono text-accent bg-bg-secondary px-2 py-0.5 rounded">
                        {event.transactionId.slice(0, 12)}…
                      </code>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {format(new Date(event.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRelease(event.id)}
                        disabled={isMutating}
                        className="btn-success btn-sm flex items-center gap-1"
                        aria-label={`Release event ${event.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Release
                        <Lock className="w-3 h-3 text-warning ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleEscalate(event.id)}
                        disabled={isMutating}
                        className="btn-danger btn-sm flex items-center gap-1"
                        aria-label={`Escalate event ${event.id}`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Escalate
                        <Lock className="w-3 h-3 text-warning ml-0.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages} · {total} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary px-2">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary btn-sm disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminRiskEventsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminRiskEventsInner />
    </QueryClientProvider>
  );
}
