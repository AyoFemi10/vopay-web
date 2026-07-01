'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Decimal from 'decimal.js';
import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Building2,
  FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'GHS', 'ZAR'];

const emptyLine = (): LineItem => ({
  id: nanoid(8),
  description: '',
  quantity: '1',
  unitPrice: '',
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewInvoicePage() {
  const router = useRouter();
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    recipientEmail: '',
    recipientName: '',
    currency: 'USD',
    dueDate: '',
    tax: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

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
            profile or create one to create invoices.
          </p>
          <Link href="/dashboard/settings" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Create a Business Profile
          </Link>
        </div>
      </div>
    );
  }

  // ── Line item math ──────────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((acc, item) => {
    const qty = new Decimal(item.quantity || '0');
    const price = new Decimal(item.unitPrice || '0');
    return acc.plus(qty.times(price));
  }, new Decimal(0));

  const taxAmount = form.tax
    ? subtotal.times(new Decimal(form.tax).div(100))
    : new Decimal(0);

  const total = subtotal.plus(taxAmount);

  // ── Line item handlers ──────────────────────────────────────────────────────
  const addLine = () => setLineItems((prev) => [...prev, emptyLine()]);

  const removeLine = (id: string) =>
    setLineItems((prev) => prev.filter((l) => l.id !== id));

  const updateLine = useCallback(
    (id: string, field: keyof Omit<LineItem, 'id'>, value: string) => {
      setLineItems((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
      );
    },
    []
  );

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeProfile) {
      toast.error('No active profile');
      return;
    }

    const validItems = lineItems.filter(
      (l) => l.description.trim() && Number(l.quantity) > 0 && Number(l.unitPrice) > 0
    );

    if (validItems.length === 0) {
      toast.error('Add at least one valid line item');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/invoices', {
        businessProfileId: activeProfile.id,
        recipientEmail: form.recipientEmail,
        recipientName: form.recipientName || undefined,
        currency: form.currency,
        dueDate: form.dueDate,
        tax: form.tax ? Number(form.tax) : undefined,
        items: validItems.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
        idempotencyKey: nanoid(),
      });

      if (res.data.success) {
        toast.success('Invoice created');
        router.push(`/dashboard/invoices/${res.data.data.id}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create invoice';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/invoices"
          className="w-9 h-9 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">New Invoice</h2>
          <p className="text-text-muted text-sm mt-1">Create and send an invoice to a client</p>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Recipient details */}
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" /> Recipient
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="recipient-email">
                Email <span className="text-error">*</span>
              </label>
              <input
                id="recipient-email"
                type="email"
                placeholder="client@example.com"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="recipient-name">
                Name (optional)
              </label>
              <input
                id="recipient-name"
                type="text"
                placeholder="Acme Corp"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Invoice settings */}
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-white">Invoice Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="inv-currency">
                Currency
              </label>
              <select
                id="inv-currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="inv-due">
                Due Date <span className="text-error">*</span>
              </label>
              <input
                id="inv-due"
                type="date"
                value={form.dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="inv-tax">
                Tax % (optional)
              </label>
              <input
                id="inv-tax"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card space-y-4">
          <h3 className="text-base font-semibold text-white">Line Items</h3>

          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_120px_40px] gap-3 text-xs font-semibold uppercase tracking-wider text-text-muted px-1">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span />
          </div>

          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_40px] gap-3 items-center"
              >
                <input
                  type="text"
                  placeholder={`Item ${idx + 1} description`}
                  value={item.description}
                  onChange={(e) => updateLine(item.id, 'description', e.target.value)}
                  className="input"
                  aria-label="Item description"
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => updateLine(item.id, 'quantity', e.target.value)}
                  className="input text-center"
                  aria-label="Quantity"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={item.unitPrice}
                  onChange={(e) => updateLine(item.id, 'unitPrice', e.target.value)}
                  className="input"
                  aria-label="Unit price"
                />
                <button
                  type="button"
                  onClick={() => removeLine(item.id)}
                  disabled={lineItems.length === 1}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Remove line item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLine}
            className="btn-secondary btn-sm w-full"
          >
            <Plus className="w-4 h-4" /> Add Line Item
          </button>

          {/* Totals */}
          <div className="divider" />
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <div className="flex justify-between w-48">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-white font-medium">
                {formatCurrency(subtotal.toFixed(2), form.currency)}
              </span>
            </div>
            {form.tax && Number(form.tax) > 0 && (
              <div className="flex justify-between w-48">
                <span className="text-text-muted">Tax ({form.tax}%)</span>
                <span className="text-white font-medium">
                  {formatCurrency(taxAmount.toFixed(2), form.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between w-48 pt-1 border-t border-bg-border">
              <span className="text-white font-semibold">Total</span>
              <span className="text-accent font-bold text-base">
                {formatCurrency(total.toFixed(2), form.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/invoices" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={cn('btn-primary', loading && 'opacity-70 cursor-not-allowed')}
          >
            {loading ? <Spinner size="sm" /> : <><FileText className="w-4 h-4" /> Create Invoice</>}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
