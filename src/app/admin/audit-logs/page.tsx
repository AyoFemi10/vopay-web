'use client';

import { useState } from 'react';
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ScrollText,
  RefreshCw,
  Search,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

// ─── Insufficient permissions card ───────────────────────────────────────────

function InsufficientPermissions() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card max-w-md text-center space-y-4">
        <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-error" />
        </div>
        <h3 className="text-xl font-bold text-white">Insufficient Permissions</h3>
        <p className="text-text-secondary text-sm">
          Audit logs are restricted to <span className="text-white font-semibold">ADMINISTRATOR</span> and{' '}
          <span className="text-white font-semibold">SUPER_ADMINISTRATOR</span> roles.
        </p>
        <p className="text-text-muted text-xs">
          Contact a Super Administrator to request elevated access.
        </p>
      </div>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

const LIMIT = 20;

const ALLOWED_ROLES = ['ADMINISTRATOR', 'SUPER_ADMINISTRATOR'];

function AdminAuditLogsInner() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    action,
    entityType,
    fromDate,
    toDate,
  });

  const hasAccess = user?.adminRole && ALLOWED_ROLES.includes(user.adminRole);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit-logs', page, appliedFilters],
    enabled: !!hasAccess,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (appliedFilters.action) params.set('action', appliedFilters.action);
      if (appliedFilters.entityType) params.set('entityType', appliedFilters.entityType);
      if (appliedFilters.fromDate) params.set('fromDate', appliedFilters.fromDate);
      if (appliedFilters.toDate) params.set('toDate', appliedFilters.toDate);
      const res = await apiClient.get(`/admin/audit-logs?${params.toString()}`);
      return res.data.data as AuditLogsResponse;
    },
  });

  if (!hasAccess) {
    return <InsufficientPermissions />;
  }

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const applyFilters = () => {
    setAppliedFilters({ action, entityType, fromDate, toDate });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-accent" /> Audit Logs
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} log entries</p>
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

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="audit-action" className="block text-xs font-medium text-text-secondary mb-1.5">
            Action
          </label>
          <input
            id="audit-action"
            type="text"
            placeholder="e.g. USER_FREEZE"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="audit-entity" className="block text-xs font-medium text-text-secondary mb-1.5">
            Entity Type
          </label>
          <input
            id="audit-entity"
            type="text"
            placeholder="e.g. USER, TRANSACTION"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="audit-from" className="block text-xs font-medium text-text-secondary mb-1.5">
            From Date
          </label>
          <input
            id="audit-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="audit-to" className="block text-xs font-medium text-text-secondary mb-1.5">
            To Date
          </label>
          <input
            id="audit-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input"
          />
        </div>
        <button onClick={applyFilters} className="btn-primary flex items-center gap-2">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading audit logs…</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-20">
          <ScrollText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No audit log entries found</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actor</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Action</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Entity</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">IP Address</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white text-sm">{log.actorName ?? '—'}</p>
                    <p className="text-xs text-text-muted">{log.actorEmail ?? log.actorId}</p>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs font-mono text-accent bg-bg-secondary px-2 py-0.5 rounded">
                      {log.action}
                    </code>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-text-secondary text-sm">{log.entityType}</p>
                    {log.entityId && (
                      <p className="text-xs text-text-muted font-mono">
                        {log.entityId.slice(0, 12)}…
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-text-secondary font-mono text-xs">
                    {log.ipAddress ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')}
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

export default function AdminAuditLogsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuditLogsInner />
    </QueryClientProvider>
  );
}
