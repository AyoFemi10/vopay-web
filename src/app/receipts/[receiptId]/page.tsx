'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Receipt {
  receiptId: string;
  senderVpxAccountNumber: string;
  receiverVpxAccountNumber: string;
  currency: string;
  timestamp: string;
  qrData: string;
  valid?: boolean;
}

// ─── Public API fetch (no auth) ───────────────────────────────────────────────

/**
 * Build the base API URL the same way lib/api.ts does:
 * strip trailing slashes, then ensure it ends with /api.
 */
const normalizeApiUrl = (url: string) => {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const PUBLIC_API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL ||
  'https://vopay-api-7f4903ec07cd.herokuapp.com/api'
);

async function fetchReceipt(receiptId: string): Promise<Receipt> {
  const res = await fetch(`${PUBLIC_API_URL}/receipts/${receiptId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Receipt not found or invalid');
  }

  const json = await res.json();
  return (json?.data ?? json) as Receipt;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReceiptVerificationPage() {
  const params = useParams();
  const receiptId = params?.receiptId as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptId) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    fetchReceipt(receiptId)
      .then((data) => {
        if (!cancelled) {
          setReceipt(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Receipt Invalid or Expired');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [receiptId]);

  const isValid = receipt ? (receipt.valid !== false) : false;

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top branding bar */}
      <header className="border-b border-bg-border bg-bg-surface">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">VOPayX</p>
            <p className="text-text-muted text-xs mt-0.5">Receipt Verification</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {isLoading ? (
            /* Loading state */
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <Spinner size="lg" />
              <p className="text-text-secondary text-sm">Verifying receipt…</p>
            </div>
          ) : error ? (
            /* Error state */
            <div className="rounded-2xl border border-error/20 bg-error/5 p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Receipt Invalid or Expired</h1>
                <p className="text-text-secondary text-sm mt-2">
                  This receipt could not be verified. It may have expired, been tampered with,
                  or never existed.
                </p>
              </div>
              <code className="block text-xs text-text-muted font-mono bg-bg-secondary rounded-lg px-3 py-2">
                ID: {receiptId}
              </code>
            </div>
          ) : receipt ? (
            /* Receipt card */
            <div className="rounded-2xl border border-bg-border bg-bg-surface shadow-xl overflow-hidden">
              {/* Status header */}
              <div
                className={
                  isValid
                    ? 'bg-success/10 border-b border-success/20 px-6 py-5 flex items-center gap-3'
                    : 'bg-error/10 border-b border-error/20 px-6 py-5 flex items-center gap-3'
                }
              >
                {isValid ? (
                  <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-error shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-white text-base">
                    {isValid ? 'Transaction Verified' : 'Transaction Invalid'}
                  </p>
                  <p className="text-text-secondary text-xs mt-0.5">
                    {isValid
                      ? 'This receipt is authentic and unmodified'
                      : 'This receipt could not be authenticated'}
                  </p>
                </div>
                <Badge variant={isValid ? 'green' : 'red'}>
                  {isValid ? '✓ Verified' : '✗ Invalid'}
                </Badge>
              </div>

              {/* Receipt details */}
              <div className="px-6 py-5 space-y-4">
                <ReceiptField
                  label="Receipt ID"
                  value={receipt.receiptId}
                  mono
                />
                <ReceiptField
                  label="Sender VPX Account"
                  value={receipt.senderVpxAccountNumber}
                  mono
                />
                <ReceiptField
                  label="Receiver VPX Account"
                  value={receipt.receiverVpxAccountNumber}
                  mono
                />
                <ReceiptField
                  label="Currency"
                  value={receipt.currency}
                />
                <ReceiptField
                  label="Timestamp"
                  value={format(new Date(receipt.timestamp), "PPpp")}
                />
              </div>

              {/* QR Code */}
              {receipt.qrData && (
                <div className="px-6 pb-6 flex flex-col items-center gap-3">
                  <div className="w-full border-t border-bg-border mb-2" />
                  <p className="text-xs text-text-muted font-medium uppercase tracking-wider self-start">
                    Verification QR Code
                  </p>
                  <div className="w-48 h-48 rounded-xl overflow-hidden border border-bg-border bg-white p-2 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(receipt.qrData)}`}
                      alt="Receipt QR code"
                      width={176}
                      height={176}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-text-muted text-center max-w-xs">
                    Scan this QR code to independently verify this receipt on the VOPayX platform
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Footer note */}
          <p className="text-center text-xs text-text-muted mt-6">
            Powered by{' '}
            <span className="text-accent font-medium">VOPayX</span>
            {' '}· Secure payment infrastructure
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Receipt field row ────────────────────────────────────────────────────────

function ReceiptField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</p>
      {mono ? (
        <code className="font-mono text-sm text-white break-all">{value}</code>
      ) : (
        <p className="text-sm text-white">{value}</p>
      )}
    </div>
  );
}
