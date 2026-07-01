'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ArrowLeft,
  Building2,
  Plus,
  Send,
  XCircle,
  Download,
  FileText,
  User,
  Calendar,
  Hash,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface Invoice {
  id: string;
  invoiceNumber?: string;
  number?: string;
  businessProfileId: string;
  recipientEmail: string;
  recipientName?: string | null;
  currency: string;
  subtotal: string;
  tax: string;
  total: string;
  status: InvoiceStatus;
  dueDate: string;
  paymentLink?: string | null;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
  receipt?: { id: string } | null;
  profile?: { displayName: string; businessName?: string | null };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<InvoiceStatus, 'gray' | 'blue' | 'green' | 'red' | 'yellow'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

// ─── Inner component ──────────────────────────────────────────────────────────

function InvoiceDetailInner() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);

  // ── Business guard ──────────────────────────────────────────────────────────
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
            profile or create one to view invoices.
          </p>
          <Link href="/dashboard/settings" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Create a Business Profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Fetch invoice ───────────────────────────────────────────────────────────
  const { data: invoice, isLoading, isError } = useQuery<Invoice>({
    queryKey: ['invoice', id, activeProfile?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeProfile?.id) params.set('profileId', activeProfile.id);
      const res = await apiClient.get(`/invoices/${id}?${params.toString()}`);
      return res.data.data as Invoice;
    },
    enabled: !!id && !!activeProfile?.id,
  });

  // ── Send mutation ───────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/invoices/${id}/send`, {
        profileId: activeProfile?.id,
      });
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['invoice', id] });
      const previous = queryClient.getQueryData<Invoice>(['invoice', id, activeProfile?.id]);
      queryClient.setQueryData<Invoice>(['invoice', id, activeProfile?.id], (old) =>
        old ? { ...old, status: 'SENT' } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['invoice', id, activeProfile?.id], context.previous);
      }
      const msg = (_err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to send invoice';
      toast.error(msg);
    },
    onSuccess: () => {
      toast.success('Invoice sent to recipient');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // ── Cancel mutation ─────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/invoices/${id}`, { status: 'CANCELLED' });
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['invoice', id] });
      const previous = queryClient.getQueryData<Invoice>(['invoice', id, activeProfile?.id]);
      queryClient.setQueryData<Invoice>(['invoice', id, activeProfile?.id], (old) =>
        old ? { ...old, status: 'CANCELLED' } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['invoice', id, activeProfile?.id], context.previous);
      }
      const msg = (_err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cancel invoice';
      toast.error(msg);
    },
    onSuccess: () => {
      toast.success('Invoice cancelled');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onSettled: () => setCancelling(false),
  });

  // ── Receipt download ────────────────────────────────────────────────────────
  const handleReceiptDownload = (receiptId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://vopay-api-7f4903ec07cd.herokuapp.com/api';
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const url = normalizedBase.endsWith('/api')
      ? `${normalizedBase}/receipts/${receiptId}/pdf`
      : `${normalizedBase}/api/receipts/${receiptId}/pdf`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading invoice…</p>
      </div>
    );
  }

  // ── Error / not found ───────────────────────────────────────────────────────
  if (isError || !invoice) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/invoices"
            className="w-9 h-9 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h2 className="text-2xl font-bold text-white">Invoice Not Found</h2>
        </div>
        <div className="card text-center py-16">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-4" />
          <p className="text-text-secondary">
            This invoice could not be found or you don&apos;t have access to it.
          </p>
          <Link href="/dashboard/invoices" className="btn-secondary btn-sm inline-flex mt-4">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNumber = invoice.invoiceNumber ?? invoice.number ?? '—';
  const isOverdue = invoice.status === 'OVERDUE' || (
    invoice.status === 'SENT' && new Date(invoice.dueDate) < new Date()
  );

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/invoices"
            className="w-9 h-9 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">Invoice</h2>
            <p className="text-text-muted text-sm font-mono">{invoiceNumber}</p>
          </div>
        </div>
        <Badge variant={STATUS_BADGE[invoice.status] ?? 'gray'} className="text-sm px-3 py-1.5">
          {invoice.status}
        </Badge>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5"
      >
        {/* Overdue warning */}
        {isOverdue && invoice.status !== 'OVERDUE' && (
          <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            This invoice was due on {format(new Date(invoice.dueDate), 'MMM d, yyyy')} and is overdue.
          </div>
        )}

        {/* Meta info */}
        <div className="card grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Invoice #</p>
            <p className="text-sm font-mono text-accent">{invoiceNumber}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Created</p>
            <p className="text-sm text-white">{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Due Date</p>
            <p className={cn('text-sm', isOverdue ? 'text-error' : 'text-white')}>
              {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Currency</p>
            <p className="text-sm text-white">{invoice.currency}</p>
          </div>
        </div>

        {/* Recipient */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-accent" /> Recipient
          </h3>
          <div className="flex flex-col gap-1">
            {invoice.recipientName && (
              <p className="text-white font-medium">{invoice.recipientName}</p>
            )}
            <p className="text-text-secondary text-sm">{invoice.recipientEmail}</p>
          </div>
        </div>

        {/* Line items */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-accent" /> Line Items
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Description</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted text-right">Qty</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted text-right">Unit Price</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/50">
                {invoice.items.map((item) => {
                  const lineTotal = Number(item.quantity) * Number(item.unitPrice);
                  return (
                    <tr key={item.id} className="hover:bg-bg-hover/30 transition-colors">
                      <td className="py-3 text-white">{item.description}</td>
                      <td className="py-3 text-text-secondary text-right">{Number(item.quantity)}</td>
                      <td className="py-3 text-text-secondary text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 text-white font-medium text-right">
                        {formatCurrency(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-bg-border pt-4 flex flex-col items-end gap-2 text-sm">
            <div className="flex justify-between w-52">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-white font-medium">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between w-52">
                <span className="text-text-muted">Tax</span>
                <span className="text-white font-medium">
                  {formatCurrency(invoice.tax, invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between w-52 pt-2 border-t border-bg-border">
              <span className="text-white font-semibold">Total</span>
              <span className="text-accent font-bold text-base">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 justify-end">
          {invoice.status === 'DRAFT' && (
            <button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending}
              className={cn('btn-primary', sendMutation.isPending && 'opacity-70 cursor-not-allowed')}
            >
              {sendMutation.isPending ? <Spinner size="sm" /> : <><Send className="w-4 h-4" /> Send Invoice</>}
            </button>
          )}

          {(invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
            <button
              onClick={() => {
                setCancelling(true);
                cancelMutation.mutate();
              }}
              disabled={cancelling || cancelMutation.isPending}
              className={cn('btn-secondary text-error border-error/30 hover:bg-error/10', (cancelling || cancelMutation.isPending) && 'opacity-70 cursor-not-allowed')}
            >
              {cancelMutation.isPending ? <Spinner size="sm" /> : <><XCircle className="w-4 h-4" /> Mark as Cancelled</>}
            </button>
          )}

          {invoice.status === 'PAID' && invoice.receipt?.id && (
            <button
              onClick={() => handleReceiptDownload(invoice.receipt!.id)}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" /> Download Receipt
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Exported page — wraps with its own QueryClient ──────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function InvoiceDetailPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceDetailInner />
    </QueryClientProvider>
  );
}
