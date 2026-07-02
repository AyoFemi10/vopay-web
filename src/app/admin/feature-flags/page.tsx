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
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Flag,
  Plus,
  RefreshCw,
  ChevronRight,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagStage = 'DISABLED' | 'INTERNAL' | 'BETA' | 'GA' | 'SUNSET';

interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  stage: FlagStage;
  enabledForAll: boolean;
  enabledUserCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type BadgeVariant = 'gray' | 'yellow' | 'green' | 'red';

const STAGE_VARIANT: Record<FlagStage, BadgeVariant> = {
  DISABLED: 'gray',
  INTERNAL: 'yellow',
  BETA:     'gray',  // blue fallback per spec
  GA:       'green',
  SUNSET:   'red',
};

const STAGE_NEXT: Partial<Record<FlagStage, FlagStage>> = {
  DISABLED: 'INTERNAL',
  INTERNAL: 'BETA',
  BETA:     'GA',
  GA:       'SUNSET',
};

// ─── Create Flag Modal ────────────────────────────────────────────────────────

function CreateFlagModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '' });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/admin/feature-flags', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Feature flag created');
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create feature flag';
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-flag-title"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="create-flag-title" className="text-lg font-semibold text-white">Create Feature Flag</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div>
            <label htmlFor="flag-name" className="block text-sm font-medium text-text-secondary mb-1.5">
              Flag Name <span className="text-error">*</span>
            </label>
            <input
              id="flag-name"
              type="text"
              placeholder="e.g. bulk_payouts_v2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="flag-desc" className="block text-sm font-medium text-text-secondary mb-1.5">
              Description
            </label>
            <textarea
              id="flag-desc"
              rows={3}
              placeholder="What does this flag control?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input w-full resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending || !form.name.trim()} className="btn-primary flex-1">
              {mutation.isPending ? <Spinner size="sm" /> : <><Plus className="w-4 h-4" /> Create Flag</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function AdminFeatureFlagsInner() {
  const { requireTotp } = useAdminMfa();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<FeatureFlag[]>({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/feature-flags');
      return (res.data.data ?? res.data) as FeatureFlag[];
    },
    retry: false,
  });

  const flags = isError ? [] : (data ?? []);

  const advanceMutation = useMutation({
    mutationFn: async ({ id, mfaToken }: { id: string; mfaToken: string }) => {
      const res = await apiClient.patch(`/admin/feature-flags/${id}/advance`, { mfaToken });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Flag stage advanced');
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
    },
    onError: () => toast.error('Failed to advance flag stage'),
  });

  const toggleAllMutation = useMutation({
    mutationFn: async ({ id, enabledForAll, mfaToken }: { id: string; enabledForAll: boolean; mfaToken: string }) => {
      const res = await apiClient.patch(`/admin/feature-flags/${id}`, { enabledForAll, mfaToken });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Flag updated');
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
    },
    onError: () => toast.error('Failed to update flag'),
  });

  const handleAdvance = (flag: FeatureFlag) => {
    if (!STAGE_NEXT[flag.stage]) {
      toast('Flag is already at SUNSET stage');
      return;
    }
    requireTotp((mfaToken) => {
      advanceMutation.mutate({ id: flag.id, mfaToken });
    });
  };

  const handleToggleAll = (flag: FeatureFlag) => {
    requireTotp((mfaToken) => {
      toggleAllMutation.mutate({ id: flag.id, enabledForAll: !flag.enabledForAll, mfaToken });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flag className="w-6 h-6 text-accent" /> Feature Flags
          </h2>
          <p className="text-text-muted text-sm mt-1">{flags.length} flag{flags.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh feature flags"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Flag
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading feature flags…</p>
        </div>
      ) : flags.length === 0 ? (
        <div className="card text-center py-20">
          <div className="w-16 h-16 bg-bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Flag className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold">No feature flags yet</p>
          <p className="text-text-muted text-sm mt-1">Create your first flag to start managing feature releases.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-5">
            <Plus className="w-4 h-4" /> Create Flag
          </button>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-bg-border text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Flag</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Stage</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Enabled For All</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Users</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Updated</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((flag, i) => (
                <motion.tr
                  key={flag.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="border-b border-bg-border/50 last:border-0 hover:bg-bg-hover/30 transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white font-mono text-sm">{flag.name}</p>
                    {flag.description && (
                      <p className="text-xs text-text-muted mt-0.5 max-w-xs truncate">{flag.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STAGE_VARIANT[flag.stage]}>{flag.stage}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    {/* Toggle All — MFA gated */}
                    <button
                      role="switch"
                      aria-checked={flag.enabledForAll}
                      aria-label={`${flag.enabledForAll ? 'Disable' : 'Enable'} ${flag.name} for all users`}
                      onClick={() => handleToggleAll(flag)}
                      className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        flag.enabledForAll ? 'bg-accent' : 'bg-white/20'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                          flag.enabledForAll ? 'translate-x-6' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-4 text-text-secondary tabular-nums">
                    {flag.enabledUserCount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(flag.updatedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    {STAGE_NEXT[flag.stage] && (
                      <button
                        onClick={() => handleAdvance(flag)}
                        disabled={advanceMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors disabled:opacity-50"
                        aria-label={`Advance ${flag.name} to ${STAGE_NEXT[flag.stage]}`}
                      >
                        {advanceMutation.isPending ? (
                          <Spinner size="sm" />
                        ) : (
                          <>Advance <ChevronRight className="w-3.5 h-3.5" /> {STAGE_NEXT[flag.stage]}</>
                        )}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showCreate && <CreateFlagModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminFeatureFlagsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminFeatureFlagsInner />
    </QueryClientProvider>
  );
}
