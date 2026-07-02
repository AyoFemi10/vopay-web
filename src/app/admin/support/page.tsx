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
import { useAdminMfa } from '../layout';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  RefreshCw,
  Search,
  UserCheck,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus   = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface AdminTicket {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string | null;
  userId: string;
  userEmail: string;
  createdAt: string;
}

interface AdminTicketsResponse {
  tickets: AdminTicket[];
  total: number;
  page: number;
  limit: number;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<TicketStatus, 'yellow' | 'green' | 'gray'> = {
  OPEN:        'yellow',
  IN_PROGRESS: 'yellow',
  RESOLVED:    'green',
  CLOSED:      'gray',
};

const PRIORITY_VARIANT: Record<TicketPriority, 'gray' | 'yellow' | 'red'> = {
  LOW:    'gray',
  MEDIUM: 'yellow',
  HIGH:   'red',
  URGENT: 'red',
};

const PAGE_LIMIT = 20;

// ─── Inner Page ───────────────────────────────────────────────────────────────

function AdminSupportInner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    status:    '',
    priority:  '',
    search:    '',
    dateFrom:  '',
    dateTo:    '',
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);

  // ── Query ─────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminTicketsResponse>({
    queryKey: ['admin-support-tickets', appliedFilters, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page',  String(page));
      params.set('limit', String(PAGE_LIMIT));
      if (appliedFilters.status)   params.set('status',   appliedFilters.status);
      if (appliedFilters.priority) params.set('priority', appliedFilters.priority);
      if (appliedFilters.search)   params.set('search',   appliedFilters.search);
      if (appliedFilters.dateFrom) params.set('dateFrom', appliedFilters.dateFrom);
      if (appliedFilters.dateTo)   params.set('dateTo',   appliedFilters.dateTo);

      const res = await apiClient.get(`/admin/support/tickets?${params.toString()}`);
      return res.data.data as AdminTicketsResponse;
    },
    retry: false,
  });

  const tickets    = isError ? [] : (data?.tickets ?? []);
  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  // ── Assign mutation ───────────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await apiClient.patch(`/admin/support/tickets/${ticketId}/assign`, {
        agentId: user?.id,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ticket assigned to you');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: () => {
      toast.error('Failed to assign ticket');
    },
  });

  // ── Escalate mutation ─────────────────────────────────────────────────────────
  const escalateMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await apiClient.patch(`/admin/support/tickets/${ticketId}/escalate`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Ticket escalated');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: () => {
      toast.error('Failed to escalate ticket');
    },
  });

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const isActioning = assignMutation.isPending || escalateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-accent" /> Support Queue
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} ticket{total !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh support queue"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="card flex flex-wrap gap-3 items-end">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input text-sm"
            style={{ minWidth: '130px' }}
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="input text-sm"
            style={{ minWidth: '130px' }}
          >
            <option value="">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Subject or email…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyDown={handleKeyDown}
              className="input pl-9 text-sm w-full"
            />
          </div>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            className="input text-sm"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="input text-sm"
          />
        </div>

        <button onClick={handleSearch} className="btn-primary self-end">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading tickets…</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card text-center py-20">
          <MessageSquare className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No tickets found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">ID</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Subject</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">User Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Priority</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Assignee</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket, i) => (
                <motion.tr
                  key={ticket.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-xs text-text-secondary">
                    {ticket.id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-4 text-white max-w-[200px]">
                    <span className="truncate block">{ticket.subject}</span>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{ticket.userEmail}</td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[ticket.status] ?? 'gray'}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? 'gray'}>
                      {ticket.priority}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {ticket.assignee ?? <span className="text-text-muted italic">Unassigned</span>}
                  </td>
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => assignMutation.mutate(ticket.id)}
                        disabled={isActioning}
                        className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
                        aria-label={`Assign ticket ${ticket.id} to me`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Assign to me
                      </button>
                      <button
                        onClick={() => escalateMutation.mutate(ticket.id)}
                        disabled={isActioning}
                        className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
                        aria-label={`Escalate ticket ${ticket.id}`}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        Escalate
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="btn-secondary btn-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
              className="btn-secondary btn-sm"
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

export default function AdminSupportPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminSupportInner />
    </QueryClientProvider>
  );
}
