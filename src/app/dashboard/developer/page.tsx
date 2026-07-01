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
  Key,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  ShieldAlert,
  Info,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  keyPrefix: string;
  environment: 'LIVE' | 'SANDBOX';
  label?: string | null;
  revokedAt?: string | null;
  createdAt: string;
}

// ─── Copy-once reveal modal ───────────────────────────────────────────────────

function KeyRevealModal({
  fullKey,
  onDismiss,
}: {
  fullKey: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullKey);
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
            <p className="text-warning font-semibold text-sm">This key will NOT be shown again</p>
            <p className="text-text-secondary text-xs mt-0.5">
              Copy it now and store it somewhere safe. Once you dismiss this dialog, the full key
              is gone forever — only the prefix will remain visible.
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Your new API key</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm text-accent bg-bg-secondary border border-bg-border rounded-xl px-4 py-3 truncate select-all">
              {fullKey}
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
          title={!copied ? "Copy the key first before dismissing" : undefined}
        >
          I've copied this key
        </button>
        {!copied && (
          <p className="text-center text-xs text-text-muted">
            Copy the key above to enable the dismiss button
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ─── Generate API Key Modal ───────────────────────────────────────────────────

function GenerateKeyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (fullKey: string) => void;
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [environment, setEnvironment] = useState<'LIVE' | 'SANDBOX'>('SANDBOX');

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/developer/api-keys', { label: label || undefined, environment });
      return res.data;
    },
    onSuccess: (data) => {
      const fullKey = data?.data?.key ?? data?.key ?? '';
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      onCreated(fullKey);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to generate API key';
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-md space-y-5"
      >
        <h3 className="text-lg font-semibold text-white">Generate API Key</h3>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5" htmlFor="key-label">
            Label <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id="key-label"
            type="text"
            placeholder="e.g. Production Server, CI/CD"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="input"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-text-secondary mb-2">Environment</p>
          <div className="flex gap-3">
            {(['SANDBOX', 'LIVE'] as const).map((env) => (
              <button
                key={env}
                type="button"
                onClick={() => setEnvironment(env)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all',
                  environment === env
                    ? env === 'LIVE'
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-bg-border bg-bg-secondary text-text-secondary hover:text-white hover:border-white/20'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    environment === env
                      ? env === 'LIVE' ? 'bg-success' : 'bg-accent'
                      : 'bg-text-muted'
                  )}
                />
                {env}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? <Spinner size="sm" /> : <><Key className="w-4 h-4" /> Generate</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page (inner) ────────────────────────────────────────────────────────

function DeveloperInner() {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();

  const [showGenerate, setShowGenerate] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);

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
            API key management requires a Developer profile. Switch to your Developer profile
            or create one to access this section.
          </p>
          <a href="/dashboard/settings" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Create a Developer Profile
          </a>
        </div>
      </div>
    );
  }

  // ── Fetch API keys ──────────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await apiClient.get('/developer/api-keys');
      return (res.data?.data ?? res.data ?? []) as ApiKey[];
    },
  });

  const apiKeys = data ?? [];

  // ── Rotate mutation ─────────────────────────────────────────────────────────
  const rotateMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiClient.post(`/developer/api-keys/${keyId}/rotate`);
      return res.data;
    },
    onSuccess: (data) => {
      const fullKey = data?.data?.key ?? data?.key ?? '';
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      if (fullKey) setRevealKey(fullKey);
      else toast.success('API key rotated');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to rotate API key';
      toast.error(msg);
    },
  });

  // ── Revoke mutation ─────────────────────────────────────────────────────────
  const revokeMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiClient.delete(`/developer/api-keys/${keyId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to revoke API key';
      toast.error(msg);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Developer Portal</h2>
          <p className="text-text-muted text-sm mt-1">Manage API keys and integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowGenerate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Generate API Key
          </button>
        </div>
      </div>

      {/* Rate limit info card */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-secondary border border-bg-border">
        <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-text-secondary">
          <span className="text-white font-medium">Rate limits:</span>{' '}
          <Badge variant="green">LIVE</Badge>{' '}
          <span className="text-text-secondary ml-1">1,000 req/min</span>
          <span className="mx-3 text-bg-border">|</span>
          <Badge variant="blue">SANDBOX</Badge>{' '}
          <span className="text-text-secondary ml-1">100 req/min</span>
        </p>
      </div>

      {/* API Keys list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading API keys…</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">No API keys yet</p>
          <button onClick={() => setShowGenerate(true)} className="btn-primary btn-sm mt-4">
            Generate your first key
          </button>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Key</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Environment</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Label</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Created</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key, i) => {
                const maskedKey = `${key.keyPrefix}${'*'.repeat(24)}`;
                const isRevoked = !!key.revokedAt;
                return (
                  <motion.tr
                    key={key.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className={cn(
                      'hover:bg-bg-hover/40 transition-colors',
                      i !== apiKeys.length - 1 && 'border-b border-bg-border/50'
                    )}
                  >
                    <td className="px-5 py-4">
                      <code className="font-mono text-accent text-xs">{maskedKey}</code>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={key.environment === 'LIVE' ? 'green' : 'blue'}>
                        {key.environment}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {key.label ?? <span className="text-text-muted italic">No label</span>}
                    </td>
                    <td className="px-5 py-4 text-text-secondary">
                      {format(new Date(key.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={isRevoked ? 'red' : 'green'}>
                        {isRevoked ? 'Revoked' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {!isRevoked && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => rotateMutation.mutate(key.id)}
                            disabled={rotateMutation.isPending}
                            className="btn-secondary btn-sm"
                            title="Rotate key"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Rotate
                          </button>
                          <button
                            onClick={() => revokeMutation.mutate(key.id)}
                            disabled={revokeMutation.isPending}
                            className="btn-danger btn-sm"
                            title="Revoke key"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Revoke
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Generate Key Modal */}
      <AnimatePresence>
        {showGenerate && (
          <GenerateKeyModal
            onClose={() => setShowGenerate(false)}
            onCreated={(fullKey) => {
              setShowGenerate(false);
              setRevealKey(fullKey);
            }}
          />
        )}
      </AnimatePresence>

      {/* Key Reveal Modal */}
      <AnimatePresence>
        {revealKey && (
          <KeyRevealModal
            fullKey={revealKey}
            onDismiss={() => setRevealKey(null)}
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

export default function DeveloperPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeveloperInner />
    </QueryClientProvider>
  );
}
