'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight, Globe2, ShieldCheck, Zap, Code2,
  Check, ArrowUpRight, MoveRight, TrendingUp, Users, Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';

/* ─── animation ──────────────────────────────────────────── */
// For above-the-fold hero — use animate directly, not whileInView
const heroItem = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y:  0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
});

// For below-the-fold sections — use whileInView
const up = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y:  0 },
  viewport:    { once: true, margin: '-40px' },
  transition:  { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

/* ─── data ────────────────────────────────────────────────── */
const STATS = [
  { value: '99.99%', label: 'Uptime SLA'   },
  { value: '7+',     label: 'Currencies'   },
  { value: '<2s',    label: 'Settlement'   },
  { value: '130+',   label: 'Countries'    },
];

const FEATURES = [
  {
    icon: Globe2, tag: 'Consumer',
    title: 'Multi-currency Wallet',
    desc:  'Hold, send and exchange across 7+ currencies. Real-time FX, zero hidden fees, instant settlement to any bank.',
    href:  '/product', cta: 'Explore wallet',
  },
  {
    icon: Zap, tag: 'Business',
    title: 'Business Payments',
    desc:  'Accept global payments, automate mass disbursements, manage payroll and track financial analytics in real time.',
    href:  '/product', cta: 'Business tools',
  },
  {
    icon: Code2, tag: 'Developer',
    title: 'Payment APIs',
    desc:  'REST APIs, webhooks, SDKs and a full sandbox. Build your own fintech product in days, not months.',
    href:  '/developers', cta: 'Read the docs',
  },
];

const STEPS = [
  { n: '01', title: 'Create account',  desc: 'Sign up in under 2 minutes. No paperwork, no waiting.' },
  { n: '02', title: 'Verify identity', desc: 'Quick KYC check to unlock all features instantly.' },
  { n: '03', title: 'Move money',      desc: 'Send, receive and exchange across 130+ countries.' },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'PCI-DSS Compliant'     },
  { icon: Lock,        label: 'Bank-grade Encryption' },
  { icon: TrendingUp,  label: '99.99% Uptime SLA'     },
  { icon: Users,       label: '100+ Active Users'     },
];

const MARQUEE = [
  'Send Money', 'Receive Payments', 'FX Exchange', 'Mass Payouts',
  'Payment Requests', 'Webhooks', 'Multi-currency', 'Instant Settlement',
  'Business Accounts', 'Developer APIs', 'KYC Verified', '130+ Countries',
];

const PERSONAL_FEATURES = ['Multi-currency wallet', 'Instant P2P transfers', 'FX exchange', 'Payment requests'];
const BUSINESS_FEATURES = ['Everything in Personal', 'Mass payouts API', 'Dedicated account manager', 'Custom webhook events', 'SLA guarantees'];

/* ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="bg-black">

        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="stars-bg relative min-h-screen flex flex-col items-center justify-center px-5 pt-28 pb-20 overflow-hidden">
          {/* Faint grid */}
          <div className="absolute inset-0 grid-bg pointer-events-none" />
          {/* Central bloom */}
          <div
            className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%)' }}
          />

          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-[900px] mx-auto">

            {/* Status pill */}
            <motion.div {...heroItem(0)}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-10 border border-white/10 text-zinc-500 text-xs font-medium rounded-full"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
              VOPayX API v1.0 · Live &amp; operational
            </motion.div>

            {/* Headline */}
            <motion.h1 {...heroItem(0.06)}
              className="font-black font-display text-white leading-[1.0] mb-6"
              style={{
                fontSize: 'clamp(2.8rem, 10vw, 7.5rem)',
                letterSpacing: '-0.035em',
              }}
            >
              Global Payments<br />
              <span style={{ color: '#2e2e2e' }}>Without Borders</span>
            </motion.h1>

            {/* Sub */}
            <motion.p {...heroItem(0.12)}
              className="text-zinc-500 leading-relaxed mb-10 max-w-[500px]"
              style={{ fontSize: 'clamp(1rem, 2.5vw, 1.15rem)' }}
            >
              Africa's next-generation payment infrastructure — built for individuals,
              businesses and developers moving money across the world.
            </motion.p>

            {/* CTAs */}
            <motion.div {...heroItem(0.17)} className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link
                href="/auth/signup"
                id="hero-cta-signup"
                className="btn-primary btn-lg w-full sm:w-auto group"
              >
                Get started free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/contact"
                id="hero-cta-contact"
                className="btn-secondary btn-lg w-full sm:w-auto"
              >
                Talk to sales
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div {...heroItem(0.22)} className="mt-14 flex flex-wrap items-center justify-center gap-5 md:gap-8">
              {TRUST_BADGES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-zinc-600 text-xs font-medium">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-medium text-zinc-700 uppercase tracking-widest">Scroll</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="w-px h-8 bg-gradient-to-b from-zinc-700 to-transparent"
            />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TAG CLOUD (replaces marquee)
        ══════════════════════════════════════════════════════ */}
        <div className="border-y border-white/[0.06] bg-black py-5">
          <div className="container-vp">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {MARQUEE.map((item) => (
                <span
                  key={item}
                  className="px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600 border border-white/[0.06] rounded-full"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            STATS
        ══════════════════════════════════════════════════════ */}
        <section className="bg-black border-b border-white/[0.06]">
          <div className="container-vp py-16 md:py-20">
            <div
              className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-white/[0.06] border border-white/[0.06] overflow-hidden"
              style={{ borderRadius: 16 }}
            >
              {STATS.map(({ value, label }, i) => (
                <motion.div key={label} {...up(i * 0.07)} className="text-center py-10 px-4">
                  <p className="text-4xl lg:text-5xl font-black font-display text-white tracking-tight mb-2 leading-none">
                    {value}
                  </p>
                  <p className="text-sm text-zinc-600 font-medium mt-1">{label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURES
        ══════════════════════════════════════════════════════ */}
        <section className="section bg-black">
          <div className="container-vp">
            {/* Header */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-end mb-14">
              <motion.div {...up()}>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Platform</p>
                <h2
                  className="font-black font-display text-white leading-[1.05] tracking-tight"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
                >
                  One platform.<br />Infinite possibilities.
                </h2>
              </motion.div>
              <motion.p {...up(0.1)} className="text-zinc-500 text-base leading-relaxed md:pb-1">
                Whether you're an individual, a business, or a developer —
                VOPayX gives you the infrastructure to move money globally without friction.
              </motion.p>
            </div>

            {/* Feature cards */}
            <div className="grid md:grid-cols-3 gap-3">
              {FEATURES.map(({ icon: Icon, tag, title, desc, href, cta }, i) => (
                <motion.div key={title} {...up(i * 0.09)}>
                  <Link href={href} className="group block h-full">
                    <div
                      className="h-full border border-white/[0.07] bg-[#080808] p-7 flex flex-col transition-all duration-200 hover:border-white/[0.14] hover:bg-[#0d0d0d]"
                      style={{ borderRadius: 16 }}
                    >
                      <div
                        className="w-10 h-10 bg-white/[0.06] flex items-center justify-center mb-6 group-hover:bg-white/[0.1] transition-colors"
                        style={{ borderRadius: 10 }}
                      >
                        <Icon className="w-5 h-5 text-zinc-400" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-700 mb-2">{tag}</span>
                      <h3 className="text-base font-bold text-white mb-3 leading-snug">{title}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed flex-1">{desc}</p>
                      <div className="flex items-center gap-1.5 text-zinc-500 text-sm font-semibold mt-6 group-hover:text-zinc-300 transition-colors">
                        {cta}
                        <MoveRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════ */}
        <section className="section border-t border-white/[0.06]" style={{ background: '#050505' }}>
          <div className="container-vp">
            <motion.div {...up()} className="text-center max-w-xl mx-auto mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Process</p>
              <h2
                className="font-black font-display text-white tracking-tight leading-tight"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
              >
                Up and running<br />in minutes
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {STEPS.map(({ n, title, desc }, i) => (
                <motion.div key={n} {...up(i * 0.1)}>
                  <div
                    className="border border-white/[0.07] bg-[#080808] p-8 h-full"
                    style={{ borderRadius: 16 }}
                  >
                    <p className="font-black font-display text-white/[0.06] mb-6 leading-none select-none"
                      style={{ fontSize: 'clamp(3rem, 8vw, 5rem)' }}>
                      {n}
                    </p>
                    <h3 className="text-base font-bold text-white mb-3">{title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════ */}
        <section className="section bg-black border-t border-white/[0.06]">
          <div className="container-vp">
            <motion.div {...up()} className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Pricing</p>
              <h2
                className="font-black font-display text-white tracking-tight"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
              >
                Simple, transparent pricing
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {/* Personal */}
              <motion.div {...up(0)}>
                <div
                  className="border border-white/[0.08] bg-[#080808] p-8 h-full flex flex-col"
                  style={{ borderRadius: 16 }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600 mb-4">Personal</p>
                  <p className="text-5xl font-black text-white tracking-tight mb-1">Free</p>
                  <p className="text-zinc-500 text-sm mb-8">No monthly fee. Pay only when you transact.</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {PERSONAL_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-zinc-400">
                        <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/signup" className="btn-secondary w-full text-center block text-sm py-3">
                    Create free account
                  </Link>
                </div>
              </motion.div>

              {/* Business — white card */}
              <motion.div {...up(0.08)}>
                <div
                  className="bg-white p-8 h-full flex flex-col relative overflow-hidden"
                  style={{ borderRadius: 16 }}
                >
                  <div
                    className="absolute top-5 right-5 px-2.5 py-0.5 bg-black text-white text-[10px] font-bold uppercase tracking-wider"
                    style={{ borderRadius: 20 }}
                  >
                    Popular
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-4">Business</p>
                  <p className="text-5xl font-black text-black tracking-tight mb-1">Custom</p>
                  <p className="text-zinc-500 text-sm mb-8">Volume-based pricing for growing teams.</p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {BUSINESS_FEATURES.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-zinc-600">
                        <Check className="w-3.5 h-3.5 text-black shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 w-full bg-black text-white text-sm font-semibold py-3 rounded-full hover:bg-zinc-900 transition-all duration-200 hover:shadow-[0_0_20px_6px_rgba(0,0,0,0.3)]"
                  >
                    Talk to sales <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FINAL CTA
        ══════════════════════════════════════════════════════ */}
        <section className="stars-bg relative py-36 border-t border-white/[0.06] overflow-hidden">
          <div className="absolute inset-0 grid-bg pointer-events-none" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 65%)' }}
          />

          <div className="container-vp relative z-10 flex flex-col items-center text-center max-w-2xl px-5">
            <motion.div {...up()} className="w-full flex flex-col items-center">
              <div className="w-14 h-14 relative overflow-hidden rounded-2xl mb-8">
                <Image
                  src="/favicon/android-chrome-192x192.png"
                  alt="VOPayX"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-700 mb-6">Get started today</p>
              <h2
                className="font-black font-display text-white tracking-tight leading-[1.0] mb-6"
                style={{ fontSize: 'clamp(2.4rem, 8vw, 5.5rem)' }}
              >
                Move money<br />smarter today
              </h2>
              <p className="text-zinc-500 text-base mb-10 leading-relaxed max-w-md">
                Join individuals and businesses already using VOPayX to power their global financial operations.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Link href="/auth/signup" id="cta-signup" className="btn-primary btn-lg w-full sm:w-auto group">
                  Create free account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/contact" id="cta-contact" className="btn-secondary btn-lg w-full sm:w-auto">
                  Contact sales
                </Link>
              </div>
              <p className="text-xs text-zinc-700 mt-5">No credit card required · Free forever for personal use</p>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
