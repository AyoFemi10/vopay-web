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
import { useAuth } from '@/contexts/AuthContext';
import { useProfileStore } from '@/stores/profileStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Users, Plus, Trash2, X, RefreshCw, UserCog } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamRole = 'OWNER' | 'ADMIN' | 'FINANCE_MANAGER' | 'SUPPORT_AGENT' | 'VIEWER';

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TeamRole;
  joinedAt: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES: Exclude<TeamRole, 'OWNER'>[] = [
  'ADMIN', 'FINANCE_MANAGER', 'SUPPORT_AGENT', 'VIEWER',
];

const ROLE_LABELS: Record<TeamRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  FINANCE_MANAGER: 'Finance Manager',
  SUPPORT_AGENT: 'Support Agent',
  VIEWER: 'Viewer',
};

const STATUS_VARIANT: Record<TeamMember['status'], 'green' | 'yellow' | 'gray'> = {
  ACTIVE: 'green',
  INVITED: 'yellow',
  SUSPENDED: 'gray',
};

// ─── Invite Modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', role: 'VIEWER' as Exclude<TeamRole, 'OWNER'> });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/business/team/invite', form);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to send invitation';
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md rounded-2xl bg-[#0D1525] border border-white/5 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 id="invite-modal-title" className="text-lg font-semibold text-white">Invite Team Member</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-text-secondary mb-1.5">
              Email <span className="text-error">*</span>
            </label>
            <input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
            <select
              id="invite-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Exclude<TeamRole, 'OWNER'> })}
              className="input w-full"
            >
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
              {mutation.isPending ? <Spinner size="sm" /> : <><Plus className="w-4 h-4" /> Send Invite</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────

function TeamInner() {
  const { user } = useAuth();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<{
    members: TeamMember[];
    currentUserRole: TeamRole;
  }>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await apiClient.get('/business/team');
      return res.data.data ?? res.data;
    },
    retry: false,
    enabled: activeProfile?.type === 'BUSINESS',
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiClient.delete(`/business/team/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: () => toast.error('Failed to remove member'),
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: TeamRole }) => {
      const res = await apiClient.patch(`/business/team/${memberId}`, { role });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  // Gate: Business profile only
  if (activeProfile?.type !== 'BUSINESS') {
    return (
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-10 text-center">
        <UserCog className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary font-semibold">This page is only available for Business profiles</p>
        <p className="text-text-muted text-sm mt-1">Switch to your Business profile to manage team members.</p>
      </div>
    );
  }

  const members = isError ? [] : (data?.members ?? []);
  const currentUserRole = data?.currentUserRole ?? 'VIEWER';

  // Gate: OWNER role only
  if (!isLoading && currentUserRole !== 'OWNER') {
    return (
      <div className="rounded-2xl bg-[#0D1525] border border-white/5 p-10 text-center">
        <UserCog className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary font-semibold">Only the business owner can manage team members</p>
        <p className="text-text-muted text-sm mt-1">Contact your business owner to make changes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" /> Team Members
          </h2>
          <p className="text-text-muted text-sm mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-text-secondary hover:text-white transition-all disabled:opacity-50"
            aria-label="Refresh team"
          >
            <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading team…</p>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 text-center py-20 px-6">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-text-muted" />
          </div>
          <p className="text-text-secondary font-semibold">No team members yet</p>
          <p className="text-text-muted text-sm mt-1">Invite colleagues to collaborate on your business account.</p>
          <button onClick={() => setShowInvite(true)} className="btn-primary mt-5">
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-[#0D1525] border border-white/5 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Member</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Role</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Joined</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.025] transition-colors"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-text-muted mt-0.5">{member.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    {member.role === 'OWNER' ? (
                      <Badge variant="blue">{ROLE_LABELS[member.role]}</Badge>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          roleChangeMutation.mutate({ memberId: member.id, role: e.target.value as TeamRole })
                        }
                        className="input text-xs py-1 px-2"
                        aria-label={`Change role for ${member.firstName}`}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4 text-text-secondary whitespace-nowrap">
                    {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[member.status]}>{member.status}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    {member.role !== 'OWNER' && (
                      <button
                        onClick={() => removeMutation.mutate(member.id)}
                        disabled={removeMutation.isPending}
                        className="p-2 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                        aria-label={`Remove ${member.firstName} ${member.lastName}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
        {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function TeamPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TeamInner />
    </QueryClientProvider>
  );
}
