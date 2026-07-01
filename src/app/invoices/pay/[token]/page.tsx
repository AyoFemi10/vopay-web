'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useQuery,
  useMutation,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  User,
  Calendar,
  Hash,
  FileText,
  ArrowRight,
  Download,
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
  recipientEmail: string;
  recipientName?: string | null;
  currency: string;
  subtotal: string;
  tax: string;
  total: string;
  status: InvoiceStatus;
  dueDate: string;
  paymentLink?: string | null;
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

const normalizeApiUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL || 'https://vopay-api-7f4903ec07cd.herokuapp.com/api'
);

// ─── Public API client (no auth header) ──────────────────────────────────────

const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Inner component ──────────────────────────────────────────────────────────

function PublicInvoicePayInner() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  // ── Fetch invoice by token (public, no auth) ────────────────────────────────
  const {
    data: invoice,
    isLoading,
    isError,
    error,
  } = useQuery<Invoice>({
    queryKey: ['public-invoice', token],
    queryFn: async () => {
      const res = await publicApi.get(`/invoices/pay/${token}`);
      return res.data.data as Invoice;
    },
    enabled: !!token,
    retry: false,
  });

  // ── Pay mutation (auth required at click time) ──────────────────────────────
  const payMutation = useMutation({
    mutationFn: async () => {
      // Attach auth token for the payment call
      const accessToken = Cookies.get('accessToken');
      const res = await axios.post(
        `${API_URL}/invoices/pay/${token}/complete`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          withCredentials: true,
        }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Payment successful!');
      // Reload to show PAID state
      window.location.reload();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Payment failed. Please try again.';
      toast.error(msg);
    },
  });

  const handlePayNow = () => {
    const accessToken = Cookies.get('accessToken');
    if (!accessToken) {
      router.push(`/auth/login?redirect=/invoices/pay/${token}`);
      return;
    }
    payMutation.mutate();
  };

  const handleReceiptDownload = (receiptId: string) => {
    const url = `${API_URL}/receipts/${receiptId}/pdf`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading invoice…</p>
        </div>
      </div>
    );
  }

  // ── Error / invalid token ───────────────────────────────────────────────────
  if (isError || !invoice) {
    const errMsg =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
    return (
      <PublicPageShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-error" />
          </div>
          <h2 className="text-xl font-bold text-white">Invoice Not Found</h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            {errMsg ??
              'This invoice link is invalid or has expired. Please contact the sender for a new link.'}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-accent text-sm hover:underline">
            Go to VOPayX <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </PublicPageShell>
    );
  }

  // ── Draft or Cancelled ──────────────────────────────────────────────────────
  if (invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') {
    return (
      <PublicPageShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-bg-secondary flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-text-muted" />
          </div>
          <h2 className="text-xl font-bold text-white">Invoice Not Available</h2>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            {invoice.status === 'CANCELLED'
              ? 'This invoice has been cancelled by the sender.'
              : 'This invoice is not yet ready for payment. Please contact the sender.'}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-accent text-sm hover:underline">
            Go to VOPayX <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </PublicPageShell>
    );
  }

  // ── Paid ────────────────────────────────────────────────────────────────────
  if (invoice.status === 'PAID') {
    return (
      <PublicPageShell>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Paid confirmation banner */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-white">Invoice Paid</h2>
            <p className="text-text-secondary text-sm">
              This invoice has been paid in full. Thank you!
            </p>
          </div>

          <InvoiceSummary invoice={invoice} />

          {invoice.receipt?.id && (
            <button
              onClick={() => handleReceiptDownload(invoice.receipt!.id)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bg-secondary border border-bg-border text-sm text-text-secondary hover:text-white hover:bg-bg-hover transition-all"
            >
              <Download className="w-4 h-4" /> Download Receipt
            </button>
          )}
        </motion.div>
      </PublicPageShell>
    );
  }

  // ── SENT or OVERDUE (payable) ───────────────────────────────────────────────
  const invoiceNumber = invoice.invoiceNumber ?? invoice.number;
  const isOverdue = invoice.status === 'OVERDUE';

  return (
    <PublicPageShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Invoice</p>
            {invoiceNumber && (
              <p className="text-sm font-mono text-accent font-medium">{invoiceNumber}</p>
            )}
          </div>
          <Badge variant={STATUS_BADGE[invoice.status] ?? 'gray'}>
            {invoice.status}
          </Badge>
        </div>

        {/* Overdue warning */}
        {isOverdue && (
          <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            This invoice is overdue. Payment was due on{' '}
            {format(new Date(invoice.dueDate), 'MMM d, yyyy')}.
          </div>
        )}

        {/* From */}
        {invoice.profile && (
          <div className="space-y-1">
            <p className="text-xs text-text-muted uppercase tracking-wider">From</p>
            <p className="text-sm font-medium text-white">
              {invoice.profile.businessName ?? invoice.profile.displayName}
            </p>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-bg-secondary border border-bg-border p-3 space-y-0.5">
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Recipient
            </p>
            <p className="text-white font-medium truncate">
              {invoice.recipientName ?? invoice.recipientEmail}
            </p>
            {invoice.recipientName && (
              <p className="text-text-muted text-xs truncate">{invoice.recipientEmail}</p>
            )}
          </div>
          <div className="rounded-xl bg-bg-secondary border border-bg-border p-3 space-y-0.5">
            <p className="text-xs text-text-muted flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Due Date
            </p>
            <p className={cn('font-medium', isOverdue ? 'text-error' : 'text-white')}>
              {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="rounded-xl bg-bg-secondary border border-bg-border overflow-hidden">
          <div className="px-4 py-3 border-b border-bg-border flex items-center gap-2">
            <Hash className="w-4 h-4 text-accent" />
            <p className="text-sm font-semibold text-white">Line Items</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Qty
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Unit Price
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/50">
                {invoice.items.map((item) => {
                  const lineTotal = Number(item.quantity) * Number(item.unitPrice);
                  return (
                    <tr key={item.id} className="hover:bg-bg-hover/30 transition-colors">
                      <td className="px-4 py-3 text-white">{item.description}</td>
                      <td className="px-4 py-3 text-text-secondary text-right">
                        {Number(item.quantity)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-right">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-white font-medium text-right">
                        {formatCurrency(lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t border-bg-border px-4 py-4 flex flex-col items-end gap-1.5 text-sm">
            <div className="flex justify-between w-48">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-white font-medium">
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </span>
            </div>
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between w-48">
                <span className="text-text-muted">Tax</span>
                <span className="text-white font-medium">
                  {formatCurrency(invoice.tax, invoice.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between w-48 pt-2 border-t border-bg-border">
              <span className="text-white font-semibold">Total</span>
              <span className="text-accent font-bold text-base">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Pay Now CTA */}
        <button
          onClick={handlePayNow}
          disabled={payMutation.isPending}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all',
            'bg-gradient-to-r from-accent to-accent-light text-white shadow-lg shadow-accent/20',
            'hover:shadow-xl hover:shadow-accent/30 hover:scale-[1.01]',
            payMutation.isPending && 'opacity-70 cursor-not-allowed scale-100'
          )}
        >
          {payMutation.isPending ? (
            <Spinner size="sm" />
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay {formatCurrency(invoice.total, invoice.currency)} Now
            </>
          )}
        </button>

        <p className="text-center text-xs text-text-muted">
          You will be asked to sign in if you are not already authenticated.
        </p>
      </motion.div>
    </PublicPageShell>
  );
}

// ─── Reusable invoice summary (used on PAID state) ────────────────────────────

function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  const invoiceNumber = invoice.invoiceNumber ?? invoice.number;
  return (
    <div className="rounded-xl bg-bg-secondary border border-bg-border p-4 space-y-3 text-sm">
      {invoiceNumber && (
        <div className="flex justify-between">
          <span className="text-text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Invoice #
          </span>
          <span className="font-mono text-accent text-xs">{invoiceNumber}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-text-muted">Recipient</span>
        <span className="text-white font-medium">
          {invoice.recipientName ?? invoice.recipientEmail}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-text-muted">Currency</span>
        <span className="text-white">{invoice.currency}</span>
      </div>
      <div className="flex justify-between border-t border-bg-border pt-3">
        <span className="text-white font-semibold">Total Paid</span>
        <span className="text-success font-bold">
          {formatCurrency(invoice.total, invoice.currency)}
        </span>
      </div>
    </div>
  );
}

// ─── Page shell — centered card on dark bg with VOPayX branding ───────────────

function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Branding header */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-lg shadow-accent/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black font-display tracking-tight text-white group-hover:text-accent-light transition-colors">
              VOPayX
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-bg-card border border-bg-border shadow-2xl p-6 sm:p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted">
          Secured by{' '}
          <Link href="/" className="text-accent hover:underline">
            VOPayX
          </Link>{' '}
          · Global Payments Without Borders
        </p>
      </div>
    </div>
  );
}

// ─── Exported page — wraps with its own QueryClient ──────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
});

export default function PublicInvoicePayPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <PublicInvoicePayInner />
    </QueryClientProvider>
  );
}
