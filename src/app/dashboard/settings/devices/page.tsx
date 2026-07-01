'use client';

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
import { format } from 'date-fns';
import {
  Smartphone,
  ShieldCheck,
  ShieldOff,
  Trash2,
  MapPin,
  Clock,
  Monitor,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Device {
  id: string;
  platform?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  trustStatus: 'TRUSTED' | 'UNTRUSTED' | 'REVOKED';
  trustScore: number;
  firstSeenAt: string;
  lastSeenAt: string;
  trustedUntil?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trustBadge(status: Device['trustStatus']) {
  switch (status) {
    case 'TRUSTED':   return <Badge variant="green">Trusted</Badge>;
    case 'REVOKED':   return <Badge variant="red">Revoked</Badge>;
    default:          return <Badge variant="yellow">Untrusted</Badge>;
  }
}

function trustScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 50) return 'text-warning';
  return 'text-error';
}

function DeviceIcon({ userAgent }: { userAgent?: string | null }) {
  const ua = (userAgent ?? '').toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="w-5 h-5 text-text-muted" />;
  }
  return <Monitor className="w-5 h-5 text-text-muted" />;
}

// ─── Devices Page Inner ───────────────────────────────────────────────────────

function DevicesPageInner() {
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await apiClient.get('/devices');
      return res.data?.data ?? res.data ?? [];
    },
  });

  const trustMutation = useMutation({
    mutationFn: (deviceId: string) => apiClient.patch(`/devices/${deviceId}/trust`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device trusted');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to trust device';
      toast.error(msg);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (deviceId: string) => apiClient.delete(`/devices/${deviceId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device revoked');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to revoke device';
      toast.error(msg);
    },
  });

  const devices = data ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-text-secondary hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-white text-sm font-medium">Devices</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Trusted Devices</h1>
        <p className="text-text-secondary mt-1">
          Devices that have accessed your account. Trust devices you recognise and revoke any you don&apos;t.
        </p>
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
          <p className="text-error">Failed to load devices. Please try again.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && devices.length === 0 && (
        <div className="card flex flex-col items-center gap-3 py-14 text-center">
          <Smartphone className="w-10 h-10 text-text-muted" />
          <p className="text-text-secondary">No devices found for your account.</p>
        </div>
      )}

      {/* Devices list */}
      <AnimatePresence>
        {devices.map((device) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="card space-y-4"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0">
                  <DeviceIcon userAgent={device.userAgent} />
                </div>
                <div>
                  <p className="font-medium text-white text-sm truncate max-w-[200px]">
                    {device.platform ?? 'Unknown device'}
                  </p>
                  <p className="text-xs text-text-muted truncate max-w-[200px]">
                    {device.userAgent ?? 'Unknown browser'}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {trustBadge(device.trustStatus)}
              </div>
            </div>

            {/* Details row */}
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-text-secondary">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span>{device.ipAddress ?? 'Unknown IP'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span>First seen {format(new Date(device.firstSeenAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span>Last seen {format(new Date(device.lastSeenAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            {/* Trust score */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    device.trustScore >= 80 ? 'bg-success' :
                    device.trustScore >= 50 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ width: `${device.trustScore}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${trustScoreColor(device.trustScore)}`}>
                {device.trustScore}% trust
              </span>
            </div>

            {/* Actions */}
            {device.trustStatus !== 'REVOKED' && (
              <div className="flex gap-2 pt-1">
                {device.trustStatus === 'UNTRUSTED' && (
                  <button
                    type="button"
                    onClick={() => trustMutation.mutate(device.id)}
                    disabled={trustMutation.isPending}
                    className="btn-secondary gap-2 text-sm"
                  >
                    {trustMutation.isPending ? <Spinner size="sm" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Trust
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => revokeMutation.mutate(device.id)}
                  disabled={revokeMutation.isPending}
                  className="btn-danger gap-2 text-sm"
                >
                  {revokeMutation.isPending ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Revoke
                </button>
              </div>
            )}

            {device.trustStatus === 'REVOKED' && (
              <p className="text-xs text-error flex items-center gap-1.5">
                <ShieldOff className="w-3.5 h-3.5" />
                This device has been revoked and cannot access your account.
              </p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Root Export (with QueryClientProvider) ───────────────────────────────────

const queryClient = new QueryClient();

export default function DevicesSettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DevicesPageInner />
    </QueryClientProvider>
  );
}
