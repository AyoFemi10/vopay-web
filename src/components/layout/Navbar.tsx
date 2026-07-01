'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Product',    href: '/product'    },
  { name: 'Pricing',    href: '/pricing'    },
  { name: 'Developers', href: '/developers' },
  { name: 'About',      href: '/about'      },
];

export function Navbar() {
  const { user }    = useAuth();
  const pathname    = usePathname();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-black/95 backdrop-blur-2xl border-b border-white/[0.07]'
          : 'bg-transparent'
      )}>
        <div className="container-vp flex items-center justify-between h-[68px]">

          {/* ── Logo ── */}
          <Link href="/" id="navbar-logo" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 relative overflow-hidden rounded-lg">
              <Image
                src="/favicon/android-chrome-192x192.png"
                alt="VOPayX"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-[17px] font-black font-display tracking-tight text-white leading-none">
              VOPay<span className="text-zinc-500">X</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-all duration-150',
                    active
                      ? 'text-white bg-white/[0.07]'
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop CTAs ── */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" id="navbar-dashboard" className="btn-primary text-sm px-5 py-2">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  id="navbar-login"
                  className="text-sm font-medium text-zinc-500 hover:text-white transition-colors px-3 py-2"
                >
                  Sign in
                </Link>
                <Link href="/auth/signup" id="navbar-signup" className="btn-primary text-sm px-5 py-2 group">
                  Get started
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-[5px]"
            aria-label={open ? 'Close menu' : 'Open menu'}
            id="navbar-menu-toggle"
          >
            <motion.span
              animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="block w-5 h-[1.5px] bg-white origin-center"
            />
            <motion.span
              animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.15 }}
              className="block w-5 h-[1.5px] bg-white"
            />
            <motion.span
              animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.2 }}
              className="block w-5 h-[1.5px] bg-white origin-center"
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile full-screen overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 36px) 34px)' }}
            animate={{ opacity: 1, clipPath: 'circle(150% at calc(100% - 36px) 34px)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 36px) 34px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden fixed inset-0 z-40 bg-black flex flex-col"
          >
            {/* Top bar with logo + close */}
            <div className="flex items-center justify-between px-5 h-[68px] border-b border-white/[0.06] shrink-0">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                <div className="w-8 h-8 relative overflow-hidden rounded-lg">
                  <Image src="/favicon/android-chrome-192x192.png" alt="VOPayX" fill className="object-cover" />
                </div>
                <span className="text-[17px] font-black font-display tracking-tight text-white">
                  VOPay<span className="text-zinc-500">X</span>
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex flex-col items-center justify-center gap-[5px]"
                aria-label="Close menu"
              >
                <motion.span initial={{ rotate: 45, y: 5 }} className="block w-5 h-[1.5px] bg-white origin-center" />
                <motion.span initial={{ opacity: 0 }} className="block w-5 h-[1.5px] bg-white" />
                <motion.span initial={{ rotate: -45, y: -5 }} className="block w-5 h-[1.5px] bg-white origin-center" />
              </button>
            </div>

            {/* Nav links */}
            <div className="flex-1 flex flex-col justify-between px-5 pt-6 pb-10 overflow-y-auto">
              <div className="space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 + 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center justify-between py-4 border-b border-white/[0.05] text-lg font-semibold transition-colors',
                        pathname === link.href ? 'text-white' : 'text-zinc-500 hover:text-white'
                      )}
                    >
                      {link.name}
                      <span className="text-zinc-700 text-sm">→</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bottom CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.3 }}
                className="flex flex-col gap-3 pt-8"
              >
                {user ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)}
                    className="btn-primary w-full text-center text-base py-3.5">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signup" onClick={() => setOpen(false)}
                      className="btn-primary w-full text-center text-base py-3.5 group flex items-center justify-center gap-2">
                      Get started free
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link href="/auth/login" onClick={() => setOpen(false)}
                      className="btn-secondary w-full text-center text-base py-3.5">
                      Sign in
                    </Link>
                  </>
                )}
                <p className="text-xs text-zinc-700 text-center mt-2">
                  No credit card required · Free forever
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
