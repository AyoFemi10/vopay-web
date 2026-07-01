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
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Plus,
  RefreshCw,
  Code2,
  Webhook,
  Trash2,
  ShieldAlert,
  Info,
  Copy,
  Check,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_EVENT_TYPES = [
  'transfer.completed',
  'deposit.confirmed',
  'payment_request.fulfilled',
  'invoice.paid',
  'withdrawal.completed',
  'fx.converted',
] as const;

const MAX_ENDPOINTS = 10;

// ─── Signing Secret reveal modal ──────────────────────────────────────────────

function SecretRevealModal({
  secret,
  onDismiss,
}: {
  secret: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy — please copy manually');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-lg space-y-5"
      >
        {/* Warning banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-warning font-semibold text-sm">
              This signing secret will NOT be shown again
            </p>
            <p className="text-text-secondary text-xs mt-0.5">
              Copy it now and store it securely. Use this secret to verify webhook
              signatures in your server. Once you dismiss this dialog, it cannot be
              retrieved.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Webhook signing secret</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm text-accent bg-bg-secondary border border-bg-border rounded-xl px-4 py-3 truncate select-all">
              {secret}
            </code>
            <button
              onClick={handleCopy}
              className={cn(
                'shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
                copied
                  ? 'bg-success/10 border-success/20 text-success'
                  : 'bg-bg-secondary border-bg-border text-text-secondary hover:text-white hover:border-white/20'
              )}
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="btn-primary w-full"
          disabled={!copied}
          title={!copied ? 'Copy the secret first before dismissing' : undefined}
        >
          I&apos;ve copied this secret
        </button>
        {!copied && (
          <p className="text-center text-xs text-text-muted">
            Copy the secret above to enable the dismiss button
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Register Endpoint Modal ──────────────────────────────────────────────────

function RegisterEndpointModal({
  onClose,
  onCreated,
  endpointCount,
}: {
  onClose: () => void;
  onCreated: (signingSecret: string) => void;
  endpointCount: number;
}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [urlError, setUrlError] = useState('');

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const validateUrl = (value: string) => {
    if (!value) {
      setUrlError('URL is required');
      return false;
    }
    if (!value.startsWith('https://')) {
      setUrlError('URL must start with https://');
      return false;
    }
    try {
      new URL(value);
      setUrlError('');
      return true;
    } catch {
      setUrlError('Enter a valid URL');
      return false;
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/developer/webhooks', {
        url,
        events: selectedEvents,
      });
      return res.data;
    },
    onSuccess: (data) => {
      const secret = data?.data?.signingSecret ?? data?.signingSecret ?? '';
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      onCreated(secret);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to register webhook endpoint';
      toast.error(msg);
    },
  });

  const handleSubmit = () => {
    if (!validateUrl(url)) return;
    if (selectedEvents.length === 0) {
      toast.error('Select at least one event type');
      return;
    }
    mutation.mutate();
  };

  const atLimit = endpointCount >= MAX_ENDPOINTS;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-md space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Register Webhook Endpoint</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {atLimit && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-sm text-error">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            You&apos;ve reached the {MAX_ENDPOINTS}-endpoint limit. Delete an endpoint to add a new one.
          </div>
        )}

        <div>
          <label
            className="block text-sm font-medium text-text-secondary mb-1.5"
            htmlFor="webhook-url"
          >
            Endpoint URL <span className="text-error">*</span>
          </label>
          <input
            id="webhook-url"
            type="url"
            placeholder="https://yourserver.com/webhooks/vopay"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (urlError) validateUrl(e.target.value);
            }}
            onBlur={() => validateUrl(url)}
            className={cn('input', urlError && 'border-error/50 focus:border-error')}
            disabled={atLimit}
          />
          {urlError && <p className="mt-1 text-xs text-error">{urlError}</p>}
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">
            Event types <span className="text-error">*</span>
          </p>
          <div className="space-y-2">
            {ALL_EVENT_TYPES.map((event) => (
              <label
                key={event}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all select-none',
                  selectedEvents.includes(event)
                    ? 'border-accent/40 bg-accent/5 text-white'
                    : 'border-bg-border bg-bg-secondary text-text-secondary hover:border-white/20 hover:text-white',
                  atLimit && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(event)}
                  onChange={() => !atLimit && toggleEvent(event)}
                  className="accent-accent w-4 h-4 shrink-0"
                  disabled={atLimit}
                />
                <code className="text-xs font-mono">{event}</code>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending || atLimit}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? <Spinner size="sm" /> : <><Webhook className="w-4 h-4" /> Register</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteConfirmModal({
  endpoint,
  onClose,
  onConfirm,
  isPending,
}: {
  endpoint: WebhookEndpoint;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-sm space-y-5"
      >
        <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6 text-error" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-1">Delete Endpoint?</h3>
          <p className="text-text-secondary text-sm">
            This will permanently remove the webhook endpoint:
          </p>
          <code className="text-xs text-text-muted font-mono block mt-2 break-all">
            {endpoint.url}
          </code>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="btn-danger flex-1"
          >
            {isPending ? <Spinner size="sm" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page (inner) ────────────────────────────────────────────────────────

function WebhooksInner() {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();

  const [showRegister, setShowRegister] = useState(false);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookEndpoint | null>(null);

  // Developer profile guard
  if (activeProfile && activeProfile.type !== 'DEVELOPER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto">
            <Code2 className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-white">Developer Profiles Only</h3>
          <p className="text-text-secondary text-sm">
            Webhook management requires a Developer profile. Switch to your Developer profile
            or create one to access this section.
          </p>
          <a href="/dashboard/settings" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Create a Developer Profile
          </a>
        </div>
      </div>
    );
  }

  // ── Fetch endpoints ─────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['webhook-endpoints'],
    queryFn: async () => {
      const res = await apiClient.get('/developer/webhooks');
      return (res.data?.data ?? res.data ?? []) as WebhookEndpoint[];
    },
  });

  const endpoints = data ?? [];

  // ── Delete mutation ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (endpointId: string) => {
      const res = await apiClient.delete(`/developer/webhooks/${endpointId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Webhook endpoint deleted');
      queryClient.invalidateQueries({ queryKey: ['webhook-endpoints'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to delete webhook endpoint';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Webhook Endpoints</h2>
          <p className="text-text-muted text-sm mt-1">
            Register endpoints to receive real-time event notifications
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
          <button
            onClick={() => setShowRegister(true)}
            className="btn-primary"
            disabled={endpoints.length >= MAX_ENDPOINTS}
          >
            <Plus className="w-4 h-4" /> Register Endpoint
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-secondary border border-bg-border">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          <span className="text-white font-medium">Up to {MAX_ENDPOINTS} endpoints</span> per
          profile. Each endpoint receives a unique signing secret to verify payload authenticity.
          {endpoints.length > 0 && (
            <span className="ml-2 text-text-muted">
              ({endpoints.length}/{MAX_ENDPOINTS} used)
            </span>
          )}
        </p>
      </div>

      {/* Endpoints list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading webhook endpoints…</p>
        </div>
      ) : endpoints.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Webhook className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">No webhook endpoints yet</p>
          <p className="text-text-muted text-sm mt-1">
            Register an endpoint to start receiving events
          </p>
          <button onClick={() => setShowRegister(true)} className="btn-primary btn-sm mt-4">
            Register your first endpoint
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {endpoints.map((endpoint, i) => (
              <motion.div
                key={endpoint.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="card space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={endpoint.isActive ? 'green' : 'gray'}>
                        {endpoint.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-text-muted text-xs">
                        Registered {format(new Date(endpoint.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <code className="font-mono text-sm text-accent break-all">
                      {endpoint.url}
                    </code>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(endpoint)}
                    className="btn-danger btn-sm shrink-0"
                    title="Delete endpoint"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

                {endpoint.events.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-bg-border">
                    {endpoint.events.map((event) => (
                      <code
                        key={event}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-bg-secondary border border-bg-border text-xs font-mono text-text-secondary"
                      >
                        {event}
                      </code>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Register Endpoint Modal */}
      <AnimatePresence>
        {showRegister && (
          <RegisterEndpointModal
            onClose={() => setShowRegister(false)}
            onCreated={(secret) => {
              setShowRegister(false);
              if (secret) setRevealSecret(secret);
              else toast.success('Webhook endpoint registered');
            }}
            endpointCount={endpoints.length}
          />
        )}
      </AnimatePresence>

      {/* Signing Secret Reveal Modal */}
      <AnimatePresence>
        {revealSecret && (
          <SecretRevealModal
            secret={revealSecret}
            onDismiss={() => setRevealSecret(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            endpoint={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
            isPending={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Exported page ────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function WebhooksPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <WebhooksInner />
    </QueryClientProvider>
  );
}
