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
import { ShieldCheck, X, RefreshCw, Pencil } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamRole = 'OWNER' | 'ADMIN' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT' | 'VIEWER';
type ApprovalTrigger = 'BULK_PAYOUT' | 'LARGE_TRANSFER' | 'PAYROLL' | 'INTERNATIONAL_TRANSFER';

interface ApprovalRule {
  id: string;
  trigger: ApprovalTrigger;
  thresholdAmount?: number;
  thresholdCurrency?: string;
  requiresApproverCount: number;
  approverRoles: TeamRole[];
  isEnabled: boolean;
  updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<ApprovalTrigger, string> = {
  BULK_PAYOUT: 'Bulk Payout',
  LARGE_TRANSFER: 'Large Transfer',
  PAYROLL: 'Payroll',
  INTERNATIONAL_TRANSFER: 'International Transfer',
};

const ALL_ROLES: TeamRole[] = ['OWNER', 'ADMIN', 'FINANCE_MANAGER', 'SUPPORT_AGENT', 'VIEWER'];

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  FINANCE_MANAGER: 'Finance Manager',
  SUPPORT_AGENT: 'Support Agent',
  VIEWER: 'Viewer',
};

// ─── Edit Rule Modal ──────────────────────────────────────────────────────────

function EditRuleModal({ rule, onClose }: { rule: ApprovalRule; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    thresholdAmount: rule.thresholdAmount?.toString() ?? '',
    thresholdCurrency: rule.thresholdCurrency ?? 'USD',
    requiresApproverCount: rule.requiresApproverCount,
    approverRoles: rule.approverRoles,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/business/approval-rules/${rule.id}`, {
        thresholdAmount: form.thresholdAmount ? Number(form.thresholdAmount) : undefined,
        thresholdCurrency: form.thresholdAmount ? form.thresholdCurrency : undefined,
        requiresApproverCount: form.requiresApproverCount,
        approverRoles: form.approverRoles,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Approval rule updated');
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
      onClose();
    },
    onError: () => toast.error('Failed to update rule'),
  });

  const toggleRole = (role: TeamRole) => {
    setForm((prev) => ({
      ...prev,
      approverRoles: prev.approverRoles.includes(role)
        ? prev.approverRoles.filter((r) => r !== role)
        : [...prev.approverRoles, role],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-2xl bg-[#0D1525] border border-white/5 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-rule-title"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="edit-rule-title" className="text-lg font-semibold text-white">
            Edit: {TRIGGER_LABELS[rule.trigger]}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="threshold-amt" className="block text-sm font-medium text-text-secondary mb-1.5">Threshold Amount</label>
              <input
                id="threshold-amt"
                type="number"
                min="0"
                step="0.01"
                placeholder="No threshold"
                value={form.thresholdAmount}
                onChange={(e) => setForm({ ...form, thresholdAmount: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label htmlFor="threshold-cur" className="block text-sm font-medium text-text-secondary mb-1.5">Currency</label>
              <select
                id="threshold-cur"
                value={form.thresholdCurrency}
                onChange={(e) => setForm({ ...form, thresholdCurrency: e.target.value })}
                className="input"
                style={{ width: '90px' }}
              >
                {['USD', 'NGN', 'GBP', 'EUR'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="approver-count" className="block text-sm font-medium text-text-secondary mb-1.5">Required Approvers</label>
            <input
              id="approver-count"
              type="number"
              min="1"
              max="10"
              value={form.requiresApproverCount}
              onChange={(e) => setForm({ ...form, requiresApproverCount: Number(e.target.value) })}
              className="input w-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary mb-2">Approver Roles</p>
            <div className="flex flex-wrap gap-2">
              {ALL_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border',
                    form.approverRoles.includes(role)
                      ? 'bg-accent/20 border-accent/40 text-accent'
                      : 'bg-white/5 border-white/10 text-text-secondary hover:text-white'
                  )}
                >
                  {ROLE_LABELS[role]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? <Spinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function ApprovalsInner() {
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();
  const [editRule, setEditRule] = useState<ApprovalRule | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<{
    rules: ApprovalRule[];
    currentUserRole: TeamRole;
  }>({
    queryKey: ['approval-rules'],
    queryFn: async () => {
      const res = await apiClient.get('/business/approval-rules');
      return res.data.data ?? res.data;
    },
    retry: false,
    enabled: activeProfile?.type === 'BUSINESS',
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const res = await apiClient.patch(`/business/approval-rules/${id}`, { isEnabled });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Rule updated');
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
    },
    onError: () => toast.error('Failed to update rule'),
  });

  // Gate: Business profile only
  if (activeProfile?.type !== 'BUSINESS') {
    return (
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-10 text-center">
        <ShieldCheck className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary font-semibold">This page is only available for Business profiles</p>
      </div>
    );
  }

  const rules = isError ? [] : (data?.rules ?? []);
  const currentUserRole = data?.currentUserRole ?? 'VIEWER';

  // Gate: OWNER or FINANCE_MANAGER
  if (!isLoading && currentUserRole !== 'OWNER' && currentUserRole !== 'FINANCE_MANAGER') {
    return (
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-10 text-center">
        <ShieldCheck className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary font-semibold">Access denied</p>
        <p className="text-text-muted text-sm mt-1">Only Owners and Finance Managers can configure approval rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent" /> Approval Rules
          </h2>
          <p className="text-text-muted text-sm mt-1">Configure which actions require approval</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
          aria-label="Refresh approval rules"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading approval rules…</p>
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 text-center py-20 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold">No approval rules configured</p>
          <p className="text-text-muted text-sm mt-1">Approval rules will appear here once configured by your administrator.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
              className="rounded-2xl bg-[#0D1525] border border-white/5 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-white">{TRIGGER_LABELS[rule.trigger]}</p>
                    <Badge variant={rule.isEnabled ? 'green' : 'gray'}>
                      {rule.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {rule.thresholdAmount != null && (
                    <p className="text-sm text-text-secondary">
                      Threshold: {rule.thresholdAmount.toLocaleString()} {rule.thresholdCurrency}
                    </p>
                  )}
                  <p className="text-sm text-text-secondary">
                    Requires <span className="text-white font-semibold">{rule.requiresApproverCount}</span> approver{rule.requiresApproverCount !== 1 ? 's' : ''}
                  </p>
                  {rule.approverRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rule.approverRoles.map((r) => (
                        <span key={r} className="px-2 py-0.5 rounded-full bg-white/5 text-text-secondary text-xs font-semibold">
                          {ROLE_LABELS[r]}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-text-muted">
                    Updated {format(new Date(rule.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setEditRule(rule)}
                    className="p-2 rounded-lg bg-white/5 text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
                    aria-label={`Edit ${TRIGGER_LABELS[rule.trigger]} rule`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* Toggle */}
                  <button
                    role="switch"
                    aria-checked={rule.isEnabled}
                    aria-label={`${rule.isEnabled ? 'Disable' : 'Enable'} ${TRIGGER_LABELS[rule.trigger]}`}
                    onClick={() => toggleMutation.mutate({ id: rule.id, isEnabled: !rule.isEnabled })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none',
                      rule.isEnabled ? 'bg-accent' : 'bg-white/20'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                        rule.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editRule && <EditRuleModal rule={editRule} onClose={() => setEditRule(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function ApprovalsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ApprovalsInner />
    </QueryClientProvider>
  );
}
