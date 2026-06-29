'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Overview',      href: '/dashboard',              icon: LayoutDashboard },
  { name: 'Wallets',       href: '/dashboard/wallets',      icon: Wallet },
  { name: 'Transactions',  href: '/dashboard/transactions', icon: TrendingUp },
  { name: 'Transfers',     href: '/dashboard/transfers',    icon: ArrowLeftRight },
  { name: 'Cards',         href: '/dashboard/cards',        icon: CreditCard },
  { name: 'Settings',      href: '/dashboard/settings',     icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  const currentPage = navItems.find((i) => i.href === pathname)?.name || 'Dashboard';

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* ─── SIDEBAR ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {(isSidebarOpen || true) && (
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 bg-bg-secondary border-r border-bg-border flex flex-col',
              'transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static',
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-bg-border shrink-0">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black font-display tracking-tight text-white">
                  VOPay<span className="text-accent">X</span>
                </span>
              </Link>
              <button
                className="ml-auto lg:hidden text-text-secondary hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
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
                        layoutId="nav-active-pill"
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
              <button
                onClick={() => logout()}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-error hover:bg-error/10 transition-colors group"
              >
                <LogOut className="w-5 h-5 text-text-muted group-hover:text-error" />
                Log Out
              </button>
            </div>
          </aside>
        )}
      </AnimatePresence>

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

      {/* ─── MAIN ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-20 bg-bg-primary/80 backdrop-blur border-b border-bg-border flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-text-secondary hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-display font-semibold text-white hidden sm:block">
                {currentPage}
              </h1>
              <p className="text-xs text-text-muted hidden sm:block">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.firstName} 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user.isVerified && (
              <Link
                href="/auth/verify"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-error/10 text-error text-xs font-semibold border border-error/20 hover:bg-error/20 transition-colors"
              >
                ⚠ Verify Email
              </Link>
            )}

            <button
              id="notifications-btn"
              className="relative w-10 h-10 rounded-xl bg-bg-secondary border border-bg-border flex items-center justify-center text-text-secondary hover:text-white hover:border-white/20 transition-all"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error border-2 border-bg-secondary" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto no-scrollbar">
          <motion.div
            key={pathname}
            className="max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
