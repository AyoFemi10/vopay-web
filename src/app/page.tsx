'use client';

import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowRight,
  Globe2,
  ShieldCheck,
  Zap,
  Code,
  ChevronRight,
  TrendingUp,
  Users,
  Lock,
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay },
  }),
};

const FEATURES = [
  {
    icon: Globe2,
    title: 'Consumer Wallet',
    desc: 'Hold balances in multiple currencies, send money globally, and exchange FX instantly with zero hidden fees.',
    href: '/product',
    color: 'text-accent',
    bg: 'bg-accent/10',
    cta: 'Explore Wallet',
  },
  {
    icon: Zap,
    title: 'Business Payments',
    desc: 'Accept payments globally, manage payroll, automate mass disbursements, and track financial analytics.',
    href: '/product',
    color: 'text-success',
    bg: 'bg-success/10',
    cta: 'View Business Tools',
  },
  {
    icon: Code,
    title: 'Developer Infrastructure',
    desc: 'Build your own fintech with our robust REST APIs, Webhooks, SDKs, and comprehensive documentation.',
    href: '/developers',
    color: 'text-warning',
    bg: 'bg-warning/10',
    cta: 'Read the Docs',
  },
];

const STATS = [
  { value: '99.99%', label: 'API Uptime' },
  { value: '7+',     label: 'Global Currencies' },
  { value: '<2s',    label: 'Settlement Time' },
  { value: '130+',   label: 'Countries Supported' },
];

const TRUST_ICONS = [
  { icon: ShieldCheck, label: 'PCI-DSS Compliant' },
  { icon: Lock,        label: 'Bank-grade Encryption' },
  { icon: TrendingUp,  label: '99.99% Uptime SLA' },
  { icon: Users,       label: '50k+ Active Users' },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 overflow-x-hidden">

        {/* ─── HERO ──────────────────────────────────────────────── */}
        <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden section grid-bg">
          {/* Glow orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-accent/15 glow-orb pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-success/10 glow-orb pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-warning/10 glow-orb pointer-events-none" />

          <div className="container-vp relative z-10 text-center">
            {/* Live badge */}
            <motion.div
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              VOPayX API v1.0 is now live
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight mb-6 leading-[1.05]"
            >
              Global Payments<br />
              <span className="gradient-text">Without Borders</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 text-balance"
            >
              Africa's next-generation payment infrastructure powering global commerce,
              remittance, business payments, and developer ecosystems.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={0.3}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/auth/signup"
                id="hero-cta-signup"
                className="btn-primary btn-lg w-full sm:w-auto group"
              >
                Start Building
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                id="hero-cta-contact"
                className="btn-secondary btn-lg w-full sm:w-auto"
              >
                Contact Sales
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.div
              variants={fadeUp}
              custom={0.5}
              initial="hidden"
              animate="visible"
              className="mt-20 flex flex-wrap justify-center gap-8 md:gap-12"
            >
              {TRUST_ICONS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-text-muted text-sm">
                  <Icon className="w-4 h-4 text-accent" />
                  <span>{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── STATS ──────────────────────────────────────────────── */}
        <section className="border-y border-bg-border bg-bg-secondary">
          <div className="container-vp py-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {STATS.map(({ value, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ───────────────────────────────────────────── */}
        <section className="section bg-bg-primary">
          <div className="container-vp">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                One Platform.<br />
                <span className="gradient-text">Infinite Possibilities.</span>
              </h2>
              <p className="text-text-secondary text-lg">
                Whether you are an individual, a business, or a developer — VOPayX provides
                the infrastructure to power your global financial operations.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc, href, color, bg, cta }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  className="card card-glow flex flex-col items-start text-left h-full group cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-text-secondary mb-6 flex-grow leading-relaxed">{desc}</p>
                  <Link
                    href={href}
                    className={`inline-flex items-center gap-1 ${color} font-medium hover:gap-2 transition-all text-sm`}
                  >
                    {cta} <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ───────────────────────────────────────── */}
        <section className="section bg-bg-secondary">
          <div className="container-vp">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
                Get started in <span className="gradient-text">minutes</span>
              </h2>
              <p className="text-text-secondary text-lg">Three simple steps to your first transaction.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connector line (desktop) */}
              <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-accent/0 via-accent/40 to-accent/0" />

              {[
                { step: '01', title: 'Create Account', desc: 'Sign up in under 2 minutes. No paperwork, no waiting.' },
                { step: '02', title: 'Verify Identity',  desc: 'Complete a quick KYC check to unlock all features.' },
                { step: '03', title: 'Move Money',       desc: 'Send, receive, and exchange across 130+ countries instantly.' },
              ].map(({ step, title, desc }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-brand flex items-center justify-center text-2xl font-black text-white shadow-glow mb-6">
                    {step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{title}</h3>
                  <p className="text-text-secondary leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ────────────────────────────────────────────────── */}
        <section className="py-24 px-4">
          <div className="container-vp">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass !p-12 md:!p-20 text-center border-accent/20 overflow-hidden relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 relative z-10">
                Ready to move money{' '}
                <span className="gradient-text">faster?</span>
              </h2>
              <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-10 relative z-10">
                Join thousands of individuals and businesses already using VOPayX
                to power their global financial operations.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <Link href="/auth/signup" id="cta-signup" className="btn-primary btn-lg w-full sm:w-auto">
                  Create Free Account
                </Link>
                <Link href="/contact" id="cta-contact" className="btn-ghost btn-lg w-full sm:w-auto">
                  Talk to an Expert
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
