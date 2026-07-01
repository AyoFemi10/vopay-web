'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kycTier: number;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

// ─── Inner page ───────────────────────────────────────────────────────────────

const LIMIT = 20;

function AdminUsersInner() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', page, status, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(LIMIT));
      if (status) params.set('status', status);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      return res.data.data as UsersResponse;
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const applyFilters = () => setPage(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Users
          </h2>
          <p className="text-text-muted text-sm mt-1">{total} total users</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh users"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="status-filter" className="block text-xs font-medium text-text-secondary mb-1.5">
            Status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="from-date" className="block text-xs font-medium text-text-secondary mb-1.5">
            From Date
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="to-date" className="block text-xs font-medium text-text-secondary mb-1.5">
            To Date
          </label>
          <input
            id="to-date"
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
          <p className="text-text-secondary text-sm">Loading users…</p>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-20">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No users found</p>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Name</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">KYC Tier</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  onClick={() => router.push(`/admin/users/${u.id}`)}
                  className="cursor-pointer hover:bg-bg-hover/40 transition-colors border-b border-bg-border/50 last:border-0"
                >
                  <td className="px-5 py-4 font-medium text-white">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">{u.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant="blue">Tier {u.kycTier ?? 0}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={u.isActive ? 'green' : 'red'}>
                      {u.isActive ? 'Active' : 'Frozen'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
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
            <span className="text-sm text-text-secondary px-2">
              {page}
            </span>
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

export default function AdminUsersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminUsersInner />
    </QueryClientProvider>
  );
}
