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
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
  MonitorSmartphone,
  MapPin,
  Clock,
  LogOut,
  AlertTriangle,
  ArrowLeft,
  Smartphone,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  deviceId?: string | null;
  ipAddress?: string | null;
  location?: string | null;
  userAgent?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  isCurrent?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SessionIcon({ userAgent }: { userAgent?: string | null }) {
  const ua = (userAgent ?? '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="w-5 h-5 text-text-muted" />;
  }
  return <Monitor className="w-5 h-5 text-text-muted" />;
}

function parseDeviceName(userAgent?: string | null): string {
  if (!userAgent) return 'Unknown device';
  const ua = userAgent;
  // Rough browser/OS parsing
  if (ua.includes('iPhone'))   return 'iPhone';
  if (ua.includes('iPad'))     return 'iPad';
  if (ua.includes('Android'))  return 'Android device';
  if (ua.includes('Windows'))  return 'Windows PC';
  if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'Mac';
  if (ua.includes('Linux'))    return 'Linux PC';
  return 'Desktop browser';
}

// ─── Sessions Page Inner ──────────────────────────────────────────────────────

function SessionsPageInner() {
  const qc = useQueryClient();
  const [revokeAllConfirm, setRevokeAllConfirm] = useState(false);

  const { data, isLoading, error } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await apiClient.get('/sessions');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const revokeOneMutation = useMutation({
    mutationFn: (sessionId: string) => apiClient.delete(`/sessions/${sessionId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session terminated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to terminate session';
      toast.error(msg);
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => apiClient.delete('/sessions'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      setRevokeAllConfirm(false);
      toast.success('All other sessions terminated');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to terminate sessions';
      toast.error(msg);
    },
  });

  const sessions = data ?? [];
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-text-secondary hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-white text-sm font-medium">Sessions</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Active Sessions</h1>
          <p className="text-text-secondary mt-1">
            Review all active login sessions. Terminate any session you don&apos;t recognise.
          </p>
        </div>

        {otherSessions.length > 0 && (
          <div className="flex-shrink-0">
            {!revokeAllConfirm ? (
              <button
                type="button"
                onClick={() => setRevokeAllConfirm(true)}
                className="btn-danger gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Revoke all others
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => revokeAllMutation.mutate()}
                  disabled={revokeAllMutation.isPending}
                  className="btn-danger gap-2 text-sm"
                >
                  {revokeAllMutation.isPending ? <Spinner size="sm" /> : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setRevokeAllConfirm(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card text-center py-10">
          <p className="text-error">Failed to load sessions. Please try again.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && sessions.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <MonitorSmartphone className="w-10 h-10 text-text-muted" />
          <p className="text-text-secondary">No active sessions found.</p>
        </div>
      )}

      {/* Revoke all warning banner */}
      <AnimatePresence>
        {revokeAllConfirm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4"
          >
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">
              This will terminate all sessions except your current one. You&apos;ll need to confirm above.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sessions list */}
      <div className="space-y-4">
        <AnimatePresence>
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="card space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                    <SessionIcon userAgent={session.userAgent} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white text-sm">
                        {parseDeviceName(session.userAgent)}
                      </p>
                      {session.isCurrent && (
                        <Badge variant="green">Current</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 truncate max-w-[220px]">
                      {session.userAgent ?? 'Unknown browser'}
                    </p>
                  </div>
                </div>

                {/* Terminate button (not shown for current session) */}
                {!session.isCurrent && (
                  <button
                    type="button"
                    onClick={() => revokeOneMutation.mutate(session.id)}
                    disabled={revokeOneMutation.isPending}
                    className="btn-danger gap-2 text-sm flex-shrink-0"
                    aria-label="Terminate session"
                  >
                    {revokeOneMutation.isPending ? <Spinner size="sm" /> : <LogOut className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Terminate</span>
                  </button>
                )}
              </div>

              {/* Details */}
              <div className="grid sm:grid-cols-3 gap-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <span>{session.location ?? session.ipAddress ?? 'Unknown location'}</span>
                </div>
                {session.lastActiveAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                    <span>
                      Active {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <span>Started {format(new Date(session.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Root Export (with QueryClientProvider) ───────────────────────────────────

const queryClient = new QueryClient();

export default function SessionsSettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionsPageInner />
    </QueryClientProvider>
  );
}
