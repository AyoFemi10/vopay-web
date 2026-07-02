import Link from 'next/link';
import { ArrowRight, Zap, Key, Webhook, ShieldCheck, Code2, TestTube } from 'lucide-react';

export default function DocsIntroPage() {
  return (
    <div>
      {/* Breadcrumb */}
      <p className="text-xs text-text-muted mb-6 font-mono">Getting Started → Introduction</p>

      <h1 className="text-3xl font-black font-display mb-3 text-white">VOPayX API Documentation</h1>
      <p className="text-text-secondary text-base leading-relaxed mb-8">
        The VOPayX API gives you programmatic access to multi-currency wallets, cross-border transfers, 
        payment requests, invoices, and more. All over a simple REST interface.
      </p>

      <div className="divider" />

      <h2 className="text-xl font-bold text-white mb-4">Base URL</h2>
      <div className="rounded-lg px-4 py-3 font-mono text-sm text-accent border border-accent/20 bg-accent/5 mb-8">
        https://api.vopayx.qzz.io
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Quick start</h2>
      <ol className="flex flex-col gap-4 mb-8">
        {[
          { step: '1', text: 'Create an account at vopayx.qzz.io' },
          { step: '2', text: 'Generate an API key from the Developer Dashboard' },
          { step: '3', text: 'Make your first request using the Authorization header' },
          { step: '4', text: 'Use the sandbox environment to test without real money' },
        ].map((s) => (
          <li key={s.step} className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs flex items-center justify-center font-bold mt-0.5">
              {s.step}
            </span>
            <span className="text-text-secondary text-sm">{s.text}</span>
          </li>
        ))}
      </ol>

      <div className="divider" />

      <h2 className="text-xl font-bold text-white mb-5">Explore the docs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { icon: <ShieldCheck className="w-5 h-5" />, title: 'Authentication', desc: 'Bearer tokens and API keys', href: '/developers/docs/authentication' },
          { icon: <Key className="w-5 h-5" />, title: 'API Keys', desc: 'Live and sandbox key management', href: '/developers/docs/api-keys' },
          { icon: <Zap className="w-5 h-5" />, title: 'Webhooks', desc: 'Real-time event notifications', href: '/developers/docs/webhooks' },
          { icon: <ShieldCheck className="w-5 h-5" />, title: 'Rate Limits', desc: 'Limits, headers, and backoff', href: '/developers/docs/rate-limits' },
          { icon: <Code2 className="w-5 h-5" />, title: 'Error Codes', desc: 'Status codes and error reference', href: '/developers/docs/error-codes' },
          { icon: <TestTube className="w-5 h-5" />, title: 'Testing', desc: 'Sandbox environment guide', href: '/developers/docs/testing-environment' },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-start gap-4 p-4 rounded-xl border border-white/7 bg-bg-card hover:border-white/15 hover:bg-bg-hover transition-all group"
          >
            <span className="text-accent mt-0.5">{card.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm mb-0.5 group-hover:text-accent transition-colors">{card.title}</p>
              <p className="text-text-muted text-xs">{card.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>

      <div className="divider" />

      <h2 className="text-xl font-bold text-white mb-4">API conventions</h2>
      <ul className="flex flex-col gap-3 text-sm text-text-secondary">
        {[
          'All requests and responses use JSON',
          'Authentication via Authorization: Bearer <token>',
          'Standard HTTP status codes (200, 201, 400, 401, 403, 404, 422, 429, 500)',
          'All amounts are in the smallest currency unit (kobo for NGN, cents for USD)',
          'Timestamps are ISO 8601 in UTC',
          'Idempotency supported via Idempotency-Key header',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="text-accent mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
