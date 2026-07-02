'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import {
  Shield,
  Users,
  FileCheck,
  AlertTriangle,
  ArrowLeftRight,
  ScrollText,
  LogOut,
  Menu,
  X,
  Lock,
  CheckCircle,
  XCircle,
  BarChart3,
  Landmark,
  ArrowRightLeft,
  GitCompareArrows,
  MessageSquare,
  ShieldAlert,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TotpConfirmCallback = (token: string) => void;

// Context so child pages can trigger the TOTP modal
import { createContext, useContext } from 'react';

interface AdminMfaCtx {
  requireTotp: (onConfirm: TotpConfirmCallback) => void;
}

export const AdminMfaContext = createContext<AdminMfaCtx>({
  requireTotp: () => {},
});

export const useAdminMfa = () => useContext(AdminMfaContext);

// ─── Nav items ────────────────────────────────────────────────────────────────

const navItems = [
  { name: 'Users',          href: '/admin/users',           icon: Users },
  { name: 'KYC Queue',      href: '/admin/kyc',             icon: FileCheck },
  { name: 'Risk Events',    href: '/admin/risk-events',     icon: AlertTriangle },
  { name: 'Transactions',   href: '/admin/transactions',    icon: ArrowLeftRight },
  { name: 'Audit Logs',     href: '/admin/audit-logs',      icon: ScrollText },
  { name: 'Analytics',      href: '/admin/analytics',       icon: BarChart3 },
  { name: 'Treasury',       href: '/admin/treasury',        icon: Landmark },
  { name: 'Settlements',    href: '/admin/settlements',     icon: ArrowRightLeft },
  { name: 'Reconciliation', href: '/admin/reconciliation',  icon: GitCompareArrows },
  { name: 'Support',        href: '/admin/support',          icon: MessageSquare },
  { name: 'Disputes',       href: '/admin/disputes',         icon: ShieldAlert },
  { name: 'Feature Flags',  href: '/admin/feature-flags',    icon: Flag },
];

// ─── TOTP Modal ───────────────────────────────────────────────────────────────

function TotpModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (code: string) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter your 6-digit TOTP code');
      return;
    }
    onConfirm(code);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="card w-full max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="totp-title"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-warning" />
          </div>
          <h3 id="totp-title" className="text-lg font-semibold text-white">
            Admin MFA Required
          </h3>
        </div>
        <p className="text-text-muted text-sm mb-6">
          Enter your 6-digit authenticator code to authorise this action.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="totp-code" className="block text-sm font-medium text-text-secondary mb-1.5">
              TOTP Code
            </label>
            <input
              id="totp-code"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input text-center text-2xl tracking-[0.5em] font-mono"
              autoComplete="one-time-code"
              aria-label="6-digit TOTP code"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              <XCircle className="w-4 h-4" /> Cancel
            </button>
            <button
              type="submit"
              disabled={code.length !== 6}
              className="btn-primary flex-1"
            >
              <CheckCircle className="w-4 h-4" /> Confirm
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const pathname = usePathname();
  const router = useRouter();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [totpCallback, setTotpCallback] = useState<TotpConfirmCallback | null>(null);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.adminRole) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const requireTotp = (onConfirm: TotpConfirmCallback) => {
    // Wrap in setter callback to avoid React treating it as updater fn
    setTotpCallback(() => onConfirm);
  };

  const handleTotpConfirm = (code: string) => {
    if (totpCallback) {
      totpCallback(code);
    }
    setTotpCallback(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-sm">Loading session…</p>
        </div>
      </div>
    );
  }

  // Not authenticated — AuthContext will redirect
  if (!user || !isAuthenticated) return null;

  // No admin role — redirect handled above
  if (!user.adminRole) return null;

  const currentPage = navItems.find((i) => pathname.startsWith(i.href))?.name ?? 'Admin';

  return (
    <AdminMfaContext.Provider value={{ requireTotp }}>
      <div className="min-h-screen bg-bg-primary flex">
        {/* ─── SIDEBAR ─────────────────────────────────────────── */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-border flex flex-col',
            'transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Branding */}
          <div className="h-20 flex items-center px-6 border-b border-bg-border shrink-0">
            <Link href="/admin/users" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-black font-display tracking-tight text-white block leading-tight">
                  VOPay<span className="text-accent">X</span>
                </span>
                <span className="text-xs text-warning font-semibold leading-tight">Admin Dashboard</span>
              </div>
            </Link>
            <button
              className="ml-auto lg:hidden text-text-secondary hover:text-white"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-4 pt-4 pb-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
              <Shield className="w-4 h-4 text-warning shrink-0" />
              <span className="text-xs font-semibold text-warning truncate">
                {user.adminRole?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'text-white'
                      : 'text-text-secondary hover:text-white hover:bg-bg-hover'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-nav-active"
                      className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-5 h-5 relative z-10',
                      isActive ? 'text-accent' : 'text-text-muted group-hover:text-white'
                    )}
                  />
                  <span className="relative z-10">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User / Logout */}
          <div className="p-4 border-t border-bg-border shrink-0 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center font-bold text-white text-sm shadow-glow shrink-0">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-white hover:bg-bg-hover transition-colors"
            >
              <ArrowLeftRight className="w-4 h-4 text-text-muted" />
              Back to Dashboard
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-error hover:bg-error/10 transition-colors group"
            >
              <LogOut className="w-5 h-5 text-text-muted group-hover:text-error" />
              Log Out
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ─── MAIN ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-20 bg-bg-primary/80 backdrop-blur border-b border-bg-border flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-text-secondary hover:text-white transition-colors"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-display font-semibold text-white hidden sm:block">
                  {currentPage}
                </h1>
                <p className="text-xs text-warning hidden sm:block font-medium">
                  Admin · {user.adminRole?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-8 overflow-y-auto no-scrollbar">
            <motion.div
              key={pathname}
              className="max-w-7xl mx-auto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>

      {/* TOTP Modal */}
      <AnimatePresence>
        {totpCallback && (
          <TotpModal
            onConfirm={handleTotpConfirm}
            onClose={() => setTotpCallback(null)}
          />
        )}
      </AnimatePresence>
    </AdminMfaContext.Provider>
  );
}
