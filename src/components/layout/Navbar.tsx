'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Product',    href: '/product' },
  { name: 'Pricing',   href: '/pricing' },
  { name: 'Developers', href: '/developers' },
  { name: 'About',     href: '/about' },
];

export function Navbar() {
  const { user }  = useAuth();
  const pathname  = usePathname();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-bg-primary/90 backdrop-blur-xl border-b border-bg-border shadow-card'
          : 'bg-transparent'
      )}
    >
      <div className="container-vp flex items-center justify-between h-20">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group" id="navbar-logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black font-display tracking-tight text-white group-hover:text-accent-light transition-colors">
              VOPay<span className="text-accent">X</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-text-secondary hover:text-white hover:bg-bg-hover'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-lg bg-bg-hover"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="btn-primary" id="navbar-dashboard">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" id="navbar-login" className="text-sm font-semibold text-text-secondary hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" id="navbar-signup" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          id="navbar-menu-toggle"
        >
          <AnimatePresence mode="wait" initial={false}>
            {open
              ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-6 h-6" /></motion.span>
              : <motion.span key="open"  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-6 h-6" /></motion.span>
            }
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-bg-secondary border-b border-bg-border"
          >
            <div className="p-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="p-3 rounded-xl text-base font-medium text-text-secondary hover:text-white hover:bg-bg-hover transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="divider my-1" />
              {user ? (
                <Link href="/dashboard" className="btn-primary w-full text-center" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/login" className="btn-secondary w-full text-center" onClick={() => setOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn-primary w-full text-center" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
