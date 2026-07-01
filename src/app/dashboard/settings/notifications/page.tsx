'use client';

import { useState, useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Save,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotifPref {
  id?: string;
  category: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

type PrefsMap = Record<string, NotifPref>;

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTIF_CATEGORIES = [
  { key: 'TRANSFER',  label: 'Transfers',       desc: 'When you send or receive money' },
  { key: 'DEPOSIT',   label: 'Deposits',         desc: 'When funds arrive in your wallet' },
  { key: 'SECURITY',  label: 'Security Alerts',  desc: 'Login alerts, PIN lock, account freeze' },
  { key: 'INVOICE',   label: 'Invoices',          desc: 'Invoice sent, paid, or overdue' },
  { key: 'KYC',       label: 'KYC Status',        desc: 'Identity verification updates' },
  { key: 'MARKETING', label: 'Product Updates',   desc: 'News, tips, and promotional offers' },
] as const;

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-accent' : 'bg-bg-hover'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Notifications Page Inner ─────────────────────────────────────────────────

function NotificationsPageInner() {
  const qc = useQueryClient();
  const [localPrefs, setLocalPrefs] = useState<PrefsMap>({});
  const [isDirty, setIsDirty] = useState(false);

  const { data: serverPrefs, isLoading, error } = useQuery<NotifPref[]>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await apiClient.get('/users/notification-preferences');
      return res.data?.data ?? res.data ?? [];
    },
  });

  // Seed local state from server data
  useEffect(() => {
    if (!serverPrefs) return;
    const map: PrefsMap = {};
    // Ensure all known categories are present (fill with defaults if API omits any)
    for (const cat of NOTIF_CATEGORIES) {
      const found = serverPrefs.find((p) => p.category === cat.key);
      map[cat.key] = found ?? { category: cat.key, inApp: true, email: true, push: false };
    }
    setLocalPrefs(map);
    setIsDirty(false);
  }, [serverPrefs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.values(localPrefs);
      const res = await apiClient.patch('/users/notification-preferences', { preferences: payload });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] });
      setIsDirty(false);
      toast.success('Notification preferences saved');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to save preferences';
      toast.error(msg);
    },
  });

  const updatePref = (category: string, field: keyof Pick<NotifPref, 'inApp' | 'email' | 'push'>, value: boolean) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
    setIsDirty(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="flex items-center gap-2 text-text-secondary hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-white text-sm font-medium">Notifications</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notification Preferences</h1>
          <p className="text-text-secondary mt-1">
            Choose how you want to be notified for each event category.
          </p>
        </div>

        {isDirty && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary gap-2 flex-shrink-0"
          >
            {saveMutation.isPending ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </motion.button>
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
          <p className="text-error">Failed to load preferences. Please try again.</p>
        </div>
      )}

      {/* Channel header legend */}
      {!isLoading && !error && (
        <div className="card space-y-0 p-0 overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-border bg-bg-tertiary">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Category</span>
            <div className="flex items-center gap-1.5 w-16 justify-center">
              <Monitor className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted">In-app</span>
            </div>
            <div className="flex items-center gap-1.5 w-16 justify-center">
              <Mail className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted">Email</span>
            </div>
            <div className="flex items-center gap-1.5 w-16 justify-center">
              <Smartphone className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs font-semibold text-text-muted">Push</span>
            </div>
          </div>

          {/* Rows */}
          {NOTIF_CATEGORIES.map((cat, idx) => {
            const pref = localPrefs[cat.key];
            if (!pref) return null;
            return (
              <div
                key={cat.key}
                className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 ${
                  idx < NOTIF_CATEGORIES.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                {/* Label */}
                <div>
                  <p className="text-sm font-medium text-white">{cat.label}</p>
                  <p className="text-xs text-text-muted">{cat.desc}</p>
                </div>

                {/* In-app toggle */}
                <div className="w-16 flex justify-center">
                  <Toggle
                    checked={pref.inApp}
                    onChange={(v) => updatePref(cat.key, 'inApp', v)}
                    label={`${cat.label} in-app notifications`}
                    disabled={saveMutation.isPending}
                  />
                </div>

                {/* Email toggle */}
                <div className="w-16 flex justify-center">
                  <Toggle
                    checked={pref.email}
                    onChange={(v) => updatePref(cat.key, 'email', v)}
                    label={`${cat.label} email notifications`}
                    disabled={saveMutation.isPending}
                  />
                </div>

                {/* Push toggle */}
                <div className="w-16 flex justify-center">
                  <Toggle
                    checked={pref.push}
                    onChange={(v) => updatePref(cat.key, 'push', v)}
                    label={`${cat.label} push notifications`}
                    disabled={saveMutation.isPending}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky save bar (visible when dirty) */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-4 bg-bg-secondary border border-border rounded-2xl shadow-xl px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Bell className="w-4 h-4 text-accent" />
              You have unsaved changes
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  // Revert to server data
                  if (serverPrefs) {
                    const map: PrefsMap = {};
                    for (const cat of NOTIF_CATEGORIES) {
                      const found = serverPrefs.find((p) => p.category === cat.key);
                      map[cat.key] = found ?? { category: cat.key, inApp: true, email: true, push: false };
                    }
                    setLocalPrefs(map);
                    setIsDirty(false);
                  }
                }}
                className="btn-secondary text-sm"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="btn-primary gap-2 text-sm"
              >
                {saveMutation.isPending ? <Spinner size="sm" /> : <><Save className="w-3.5 h-3.5" /> Save</>}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Root Export (with QueryClientProvider) ───────────────────────────────────

const queryClient = new QueryClient();

export default function NotificationsSettingsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationsPageInner />
    </QueryClientProvider>
  );
}
