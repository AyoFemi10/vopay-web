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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FileText, Download, RefreshCw, FilePlus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatementRequest {
  id: string;
  fromDate: string;
  toDate: string;
  currency: string;
  format: 'PDF' | 'CSV';
  status: 'GENERATING' | 'READY' | 'FAILED';
  downloadUrl?: string | null;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['All', 'NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

const STATUS_VARIANT: Record<StatementRequest['status'], 'yellow' | 'green' | 'red'> = {
  GENERATING: 'yellow',
  READY:      'green',
  FAILED:     'red',
};

// ─── Inner Page ───────────────────────────────────────────────────────────────

function StatementsInner() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    fromDate: '',
    toDate: '',
    currency: 'All',
    format: 'PDF' as 'PDF' | 'CSV',
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery<StatementRequest[]>({
    queryKey: ['statements'],
    queryFn: async () => {
      const res = await apiClient.get('/statements');
      return (res.data.data ?? res.data) as StatementRequest[];
    },
    retry: false,
  });

  const statements = isError ? [] : (data ?? []);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {
        fromDate: form.fromDate,
        toDate: form.toDate,
        format: form.format,
      };
      if (form.currency !== 'All') payload.currency = form.currency;
      const res = await apiClient.post('/statements', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Statement generation started');
      queryClient.invalidateQueries({ queryKey: ['statements'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to generate statement';
      toast.error(msg);
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromDate || !form.toDate) {
      toast.error('From and To dates are required');
      return;
    }
    if (form.fromDate > form.toDate) {
      toast.error('From date must be before To date');
      return;
    }
    generateMutation.mutate();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-accent" /> Statements
        </h2>
        <p className="text-text-muted text-sm mt-1">Generate and download account statements</p>
      </div>

      {/* Generate Form */}
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FilePlus className="w-4 h-4 text-accent" /> Generate Statement
        </h3>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stmt-from" className="block text-sm font-medium text-text-secondary mb-1.5">
                From Date <span className="text-error">*</span>
              </label>
              <input
                id="stmt-from"
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label htmlFor="stmt-to" className="block text-sm font-medium text-text-secondary mb-1.5">
                To Date <span className="text-error">*</span>
              </label>
              <input
                id="stmt-to"
                type="date"
                value={form.toDate}
                onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                className="input w-full"
                required
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="stmt-currency" className="block text-sm font-medium text-text-secondary mb-1.5">Currency</label>
              <select
                id="stmt-currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input"
                style={{ minWidth: '110px' }}
              >
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary mb-2">Format</p>
              <div className="flex gap-4">
                {(['PDF', 'CSV'] as const).map((fmt) => (
                  <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="stmt-format"
                      value={fmt}
                      checked={form.format === fmt}
                      onChange={() => setForm({ ...form, format: fmt })}
                      className="accent-accent"
                    />
                    <span className={cn(
                      'text-sm font-semibold',
                      form.format === fmt ? 'text-white' : 'text-text-secondary'
                    )}>{fmt}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="btn-primary ml-auto"
            >
              {generateMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <><FilePlus className="w-4 h-4" /> Generate</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Statement History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" /> Statement History
          </h3>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh statements"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner size="lg" />
            <p className="text-text-secondary text-sm">Loading statements…</p>
          </div>
        ) : statements.length === 0 ? (
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 text-center py-14 px-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-text-secondary font-semibold">No statements yet</p>
            <p className="text-text-muted text-sm mt-1">Generated statements will appear here.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Date Range</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Currency</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Format</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Download</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((stmt, i) => (
                  <motion.tr
                    key={stmt.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors"
                  >
                    <td className="px-5 py-4 text-white whitespace-nowrap">
                      {format(new Date(stmt.fromDate), 'MMM d, yyyy')} – {format(new Date(stmt.toDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">{stmt.currency}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 text-text-secondary text-xs font-semibold">
                        {stmt.format}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_VARIANT[stmt.status]}>{stmt.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                      {format(new Date(stmt.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      {stmt.status === 'READY' && stmt.downloadUrl ? (
                        <a
                          href={stmt.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-accent hover:underline text-sm font-semibold"
                          aria-label={`Download statement from ${stmt.fromDate}`}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function StatementsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatementsInner />
    </QueryClientProvider>
  );
}
