'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { useProfileStore } from '@/stores/profileStore';
import {
  Wallet, LayoutDashboard, ArrowLeftRight, CreditCard, Settings,
  LogOut, Bell, TrendingUp, ChevronDown, User, Building2, Code2,
  ReceiptText, FileText, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import type { Profile, ProfileType } from '@/stores/profileStore';

const navItems = [
  { name: 'Overview',     href: '/dashboard',              icon: LayoutDashboard },
  { name: 'Wallets',      href: '/dashboard/wallets',      icon: Wallet },
  { name: 'Transactions', href: '/dashboard/transactions', icon: TrendingUp },
  { name: 'Transfers',    href: '/dashboard/transfers',    icon: ArrowLeftRight },
  { name: 'Cards',        href: '/dashboard/cards',        icon: CreditCard },
  { name: 'Invoices',     href: '/dashboard/invoices',     icon: ReceiptText },
  { name: 'Payments',     href: '/dashboard/payment-requests', icon: FileText },
  { name: 'Settings',     href: '/dashboard/settings',     icon: Settings },
];

const mobileNavItems = [
  { name: 'Home',       href: '/dashboard',              icon: LayoutDashboard },
  { name: 'Wallets',    href: '/dashboard/wallets',      icon: Wallet },
  { name: 'Transfers',  href: '/dashboard/transfers',    icon: ArrowLeftRight },
  { name: 'Cards',      href: '/dashboard/cards',        icon: CreditCard },
  { name: 'Settings',   href: '/dashboard/settings',     icon: Settings },
];

const PROFILE_TYPE_ICON: Record<ProfileType, React.ElementType> = {
  PERSONAL: User, BUSINESS: Building2, DEVELOPER: Code2,
};
const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  PERSONAL: 'Personal', BUSINESS: 'Business', DEVELOPER: 'Developer',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout }     = useAuth();
  const isAuthenticated      = useAuthStore((s) => s.isAuthenticated);
  const isLoading            = useAuthStore((s) => s.isLoading);
  const pathname             = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const profiles          = useProfileStore((s) => s.profiles);
  const activeProfile     = useProfileStore((s) => s.activeProfile);
  const setProfiles       = useProfileStore((s) => s.setProfiles);
  const switchProfileLocal = useProfileStore((s) => s.switchProfile);

  useEffect(() => {
    if (!user) return;
    apiClient.get('/profiles')
      .then((res) => { if (res.data.success) setProfiles(res.data.data); })
      .catch(() => {});
  }, [user, setProfiles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-text-secondary text-xs font-bold tracking-widest uppercase animate-pulse">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) return null;

  const handleSwitchProfile = async (profileId: string) => {
    switchProfileLocal(profileId);
    setDropdownOpen(false);
    try {
      const res = await apiClient.patch(`/profiles/${profileId}/switch`);
      if (res.data?.data?.accessToken) {
        const { default: Cookies } = await import('js-cookie');
        const { useAuthStore: store } = await import('@/stores/authStore');
        const authStore = store.getState();
        Cookies.set('accessToken', res.data.data.accessToken, {
          expires: (res.data.data.expiresIn ?? 86400) / 86400,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });
        if (authStore.user) authStore.setAuth(authStore.user, res.data.data.accessToken);
      }
    } catch {}
  };

  const currentPage = navItems.find((i) => pathname.startsWith(i.href) && (i.href !== '/dashboard' || pathname === '/dashboard'))?.name ?? 'Dashboard';

  return (
    <div className="dashboard-root min-h-screen bg-[#060B14] flex relative pb-20 lg:pb-0">

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-[264px] flex-col"
        style={{ background: 'linear-gradient(180deg, #080E1C 0%, #060B14 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Logo */}
        <div className="h-20 flex items-center px-7 shrink-0 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-[0.875rem] bg-gradient-brand flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <Wallet className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-black font-display tracking-tight text-white">
              VOPay<span className="text-accent">X</span>
            </span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6 hover:border-white/12 transition-colors cursor-pointer">
            <Search className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="text-sm text-text-muted">Quick search…</span>
            <kbd className="ml-auto text-[10px] text-text-muted bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/8">⌘K</kbd>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                  isActive
                    ? 'text-white'
                    : 'text-text-secondary hover:text-white hover:bg-white/4'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  />
                )}
                <item.icon className={cn(
                  'w-[18px] h-[18px] relative z-10 transition-colors',
                  isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'
                )} />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <span className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile switcher */}
        {activeProfile && (
          <div className="px-3 py-3 border-t border-white/5 shrink-0 relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-white/4 border border-transparent hover:border-white/8 transition-all text-left"
            >
              {(() => {
                const Icon = PROFILE_TYPE_ICON[activeProfile.type] ?? User;
                return (
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 border border-accent/20">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate leading-tight">{activeProfile.displayName}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mt-0.5">{PROFILE_TYPE_LABEL[activeProfile.type]}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform shrink-0', dropdownOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {dropdownOpen && profiles.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl shadow-xl overflow-hidden z-50 p-2"
                  style={{ background: '#0D1525', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {profiles.map((profile: Profile) => {
                    const Icon = PROFILE_TYPE_ICON[profile.type] ?? User;
                    const isActiveProfile = profile.id === activeProfile.id;
                    return (
                      <button
                        key={profile.id}
                        onClick={() => handleSwitchProfile(profile.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                          isActiveProfile ? 'bg-accent/10 text-white' : 'text-text-secondary hover:text-white hover:bg-white/5'
                        )}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', isActiveProfile ? 'text-accent' : 'text-text-muted')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{profile.displayName}</p>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mt-0.5">{PROFILE_TYPE_LABEL[profile.type]}</p>
                        </div>
                        {isActiveProfile && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* User row + logout */}
        <div className="px-3 pb-5 shrink-0 space-y-1 border-t border-white/5 pt-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center font-bold text-white text-xs shadow-glow shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full rounded-xl text-sm font-semibold text-text-secondary hover:text-error hover:bg-error/8 transition-colors group"
          >
            <LogOut className="w-4 h-4 text-text-muted group-hover:text-error transition-colors" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-[264px] flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-5 lg:px-8 shrink-0 border-b border-white/5"
          style={{ background: 'rgba(6,11,20,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>

          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                <Wallet className="w-4 h-4 text-white" />
              </div>
            </div>
            {/* Desktop page title */}
            <div className="hidden lg:block">
              <h1 className="text-lg font-display font-black text-white">{currentPage}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Verify email nudge */}
            {!user.isVerified && (
              <Link href="/auth/verify" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/8 border border-warning/20 text-warning text-xs font-bold uppercase tracking-wider hover:bg-warning/15 transition-colors">
                ⚠ Verify email
              </Link>
            )}
            <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-text-secondary hover:text-white hover:bg-white/10 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-error rounded-full border border-[#060B14]" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center font-bold text-white text-xs shadow-glow cursor-pointer hover:shadow-glow-lg transition-all">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-7 overflow-y-auto no-scrollbar">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-3 border-t border-white/8"
        style={{ background: 'rgba(6,11,20,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        {mobileNavItems.map((item) => {
          const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1 min-w-[3.5rem]">
              <div className={cn(
                'p-2 rounded-xl transition-all duration-200',
                isActive ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-white'
              )}>
                <item.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wider',
                isActive ? 'text-accent' : 'text-text-muted'
              )}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
