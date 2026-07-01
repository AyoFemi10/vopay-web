'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAdminMfa } from '@/app/admin/layout';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Lock,
  Unlock,
  TrendingUp,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KycDocument {
  id: string;
  type: string;
  status: string;
  fileUrl?: string | null;
  submittedAt: string;
}

interface AdminUserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  kycTier: number;
  isActive: boolean;
  isVerified: boolean;
  country: string | null;
  createdAt: string;
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function AdminUserDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requireTotp } = useAdminMfa();

  const [kycTierInput, setKycTierInput] = useState<string>('');

  // ── Fetch user detail ────────────────────────────────────────────────────
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/users/${id}`);
      return res.data.data as { user: AdminUserDetail; kycDocuments: KycDocument[] };
    },
    enabled: !!id,
  });

  const user = data?.user;
  const kycDocuments = data?.kycDocuments ?? [];

  // ── Freeze mutation ──────────────────────────────────────────────────────
  const freezeMutation = useMutation({
    mutationFn: async (mfaToken: string) => {
      const res = await apiClient.patch(
        `/admin/users/${id}/freeze`,
        {},
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Account frozen');
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to freeze account';
      toast.error(msg);
    },
  });

  // ── Unfreeze mutation ────────────────────────────────────────────────────
  const unfreezeMutation = useMutation({
    mutationFn: async (mfaToken: string) => {
      const res = await apiClient.patch(
        `/admin/users/${id}/unfreeze`,
        {},
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Account unfrozen');
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to unfreeze account';
      toast.error(msg);
    },
  });

  // ── Set KYC Tier mutation ────────────────────────────────────────────────
  const kycTierMutation = useMutation({
    mutationFn: async ({ tier, mfaToken }: { tier: number; mfaToken: string }) => {
      const res = await apiClient.patch(
        `/admin/users/${id}/kyc-tier`,
        { tier },
        { headers: { 'X-Admin-MFA-Token': mfaToken } }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('KYC tier updated');
      setKycTierInput('');
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to update KYC tier';
      toast.error(msg);
    },
  });

  const handleFreeze = () => {
    requireTotp((token) => freezeMutation.mutate(token));
  };

  const handleUnfreeze = () => {
    requireTotp((token) => unfreezeMutation.mutate(token));
  };

  const handleSetKycTier = () => {
    const tier = parseInt(kycTierInput, 10);
    if (isNaN(tier) || tier < 0 || tier > 3) {
      toast.error('KYC tier must be 0–3');
      return;
    }
    requireTotp((token) => kycTierMutation.mutate({ tier, mfaToken: token }));
  };

  const isMutating =
    freezeMutation.isPending || unfreezeMutation.isPending || kycTierMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Spinner size="lg" />
        <p className="text-text-secondary text-sm">Loading user…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card text-center py-20">
        <p className="text-text-secondary">User not found.</p>
      </div>
    );
  }

  const KYC_DOC_STATUS_BADGE: Record<string, 'yellow' | 'green' | 'red' | 'gray'> = {
    PENDING: 'yellow',
    SUBMITTED: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
  };

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-text-muted text-sm mt-0.5">{user.email}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white transition-all"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card space-y-4"
        >
          <h3 className="text-base font-semibold text-white border-b border-bg-border pb-3">
            User Information
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'First Name', value: user.firstName },
              { label: 'Last Name', value: user.lastName },
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone ?? '—' },
              { label: 'Country', value: user.country ?? '—' },
              { label: 'Email Verified', value: user.isVerified ? 'Yes' : 'No' },
              {
                label: 'Member Since',
                value: format(new Date(user.createdAt), 'MMM d, yyyy'),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-text-muted font-medium mb-0.5">{label}</dt>
                <dd className="text-sm text-white">{value}</dd>
              </div>
            ))}
          </dl>

          {/* KYC Tier badge row */}
          <div className="flex items-center gap-3 pt-2 border-t border-bg-border">
            <div>
              <p className="text-xs text-text-muted mb-1">KYC Tier</p>
              <Badge variant="blue">Tier {user.kycTier ?? 0}</Badge>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Account Status</p>
              <Badge variant={user.isActive ? 'green' : 'red'}>
                {user.isActive ? 'Active' : 'Frozen'}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="card space-y-4"
        >
          <h3 className="text-base font-semibold text-white border-b border-bg-border pb-3">
            Admin Actions
          </h3>

          <p className="text-xs text-warning flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> MFA Required for all actions
          </p>

          {/* Freeze / Unfreeze */}
          {user.isActive ? (
            <button
              onClick={handleFreeze}
              disabled={isMutating}
              className="btn-danger w-full flex items-center justify-center gap-2"
            >
              {freezeMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Freeze Account
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleUnfreeze}
              disabled={isMutating}
              className="btn-success w-full flex items-center justify-center gap-2"
            >
              {unfreezeMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Unlock className="w-4 h-4" /> Unfreeze Account
                </>
              )}
            </button>
          )}

          {/* Set KYC Tier */}
          <div className="space-y-2 pt-2 border-t border-bg-border">
            <label htmlFor="kyc-tier-select" className="block text-sm font-medium text-text-secondary">
              Set KYC Tier
            </label>
            <select
              id="kyc-tier-select"
              value={kycTierInput}
              onChange={(e) => setKycTierInput(e.target.value)}
              className="input"
            >
              <option value="">Select tier…</option>
              <option value="0">Tier 0</option>
              <option value="1">Tier 1</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
            </select>
            <button
              onClick={handleSetKycTier}
              disabled={!kycTierInput || isMutating}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {kycTierMutation.isPending ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" /> Set Tier
                  <Lock className="w-3 h-3 text-warning ml-1" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* KYC Documents */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="card"
      >
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-accent" /> KYC Documents
        </h3>
        {kycDocuments.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No KYC documents submitted.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Document Type</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Submitted</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">File</th>
                </tr>
              </thead>
              <tbody>
                {kycDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-bg-border/50 last:border-0">
                    <td className="py-3 text-white font-medium">{doc.type}</td>
                    <td className="py-3">
                      <Badge variant={KYC_DOC_STATUS_BADGE[doc.status] ?? 'gray'}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-text-secondary">
                      {format(new Date(doc.submittedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3">
                      {doc.fileUrl ? (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent text-xs hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function AdminUserDetailPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminUserDetailInner />
    </QueryClientProvider>
  );
}
