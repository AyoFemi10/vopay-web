'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus,
  RefreshCw,
  FileText,
  Send,
  Eye,
  Building2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface Invoice {
  id: string;
  invoiceNumber: string;
  recipientEmail: string;
  recipientName?: string | null;
  total: string;
  subtotal: string;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const STATUS_BADGE: Record<InvoiceStatus, 'gray' | 'blue' | 'green' | 'red' | 'yellow'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

// ─── Inner component ──────────────────────────────────────────────────────────

function InvoicesInner() {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('');

  // Business guard
  if (activeProfile && activeProfile.type !== 'BUSINESS') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-white">Business Profiles Only</h3>
          <p className="text-text-secondary text-sm">
            This feature is available for Business profiles only. Switch to a Business
            profile or create one to access invoices.
          </p>
          <Link href="/dashboard/settings" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Create a Business Profile
          </Link>
        </div>
      </div>
    );
  }

  const profileId = activeProfile?.id;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', profileId, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (profileId) params.set('profileId', profileId);
      if (activeTab) params.set('status', activeTab);
      const res = await apiClient.get(`/invoices?${params.toString()}`);
      return (res.data.data ?? []) as Invoice[];
    },
    enabled: !!profileId,
  });

  const invoices = data ?? [];

  const sendMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await apiClient.post(`/invoices/${invoiceId}/send`, {
        profileId,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invoice sent to recipient');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send invoice';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Invoices</h2>
          <p className="text-text-muted text-sm mt-1">
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/dashboard/invoices/new" className="btn-primary">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar bg-bg-secondary rounded-xl p-1 border border-bg-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === tab.value
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-white hover:bg-bg-hover'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading invoices…</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">No invoices found</p>
          <Link href="/dashboard/invoices/new" className="btn-primary btn-sm inline-flex mt-4">
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Invoice #</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Recipient</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Total</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Due Date</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice, i) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className={cn(
                    'hover:bg-bg-hover/40 transition-colors',
                    i !== invoices.length - 1 && 'border-b border-bg-border/50'
                  )}
                >
                  <td className="px-5 py-4 font-mono text-accent text-xs">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white font-medium truncate max-w-[160px]">
                      {invoice.recipientName ?? invoice.recipientEmail}
                    </p>
                    <p className="text-text-muted text-xs">{invoice.recipientEmail}</p>
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-5 py-4 text-text-secondary">
                    {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_BADGE[invoice.status] ?? 'gray'}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {invoice.status === 'DRAFT' && (
                        <button
                          onClick={() => sendMutation.mutate(invoice.id)}
                          disabled={sendMutation.isPending}
                          className="btn-primary btn-sm"
                          title="Send invoice"
                        >
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      )}
                      <Link
                        href={`/dashboard/invoices/${invoice.id}`}
                        className="btn-secondary btn-sm"
                        title="View invoice"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Exported page ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function InvoicesPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <InvoicesInner />
    </QueryClientProvider>
  );
}
