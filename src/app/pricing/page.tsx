import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        {/* ─── HEADER ────────────────────────────────────────── */}
        <section className="section bg-gradient-dark text-center pb-12">
          <div className="container-vp max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-6 animate-slide-up">
              Simple, transparent <span className="gradient-text">pricing.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary animate-slide-up" style={{ animationDelay: '100ms' }}>
              No hidden fees, no surprise charges. Pay only for what you use.
            </p>
          </div>
        </section>

        {/* ─── PRICING CARDS ─────────────────────────────────── */}
        <section className="section bg-bg-primary pt-0">
          <div className="container-vp max-w-6xl">
            <div className="grid md:grid-cols-3 gap-8 items-start">
              
              {/* Personal */}
              <div className="card h-full flex flex-col hover:border-bg-border relative animate-slide-up" style={{ animationDelay: '200ms' }}>
                <h3 className="text-xl font-semibold mb-2">Personal Wallet</h3>
                <p className="text-text-secondary text-sm mb-6">For individuals sending and receiving money globally.</p>
                <div className="mb-6 border-b border-bg-border pb-6">
                  <span className="text-4xl font-display font-bold">Free</span>
                </div>
                <ul className="flex flex-col gap-4 mb-8 flex-grow">
                  {[
                    { text: 'Multi-currency wallets', inc: true },
                    { text: 'Internal VOPayX transfers', inc: true, sub: 'Zero fees' },
                    { text: 'Account maintenance', inc: true, sub: '$0 / month' },
                    { text: 'Bank withdrawals', inc: true, sub: '1.5% fee' },
                    { text: 'API Access', inc: false },
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      {f.inc ? <Check className="w-5 h-5 text-success shrink-0" /> : <X className="w-5 h-5 text-text-muted shrink-0" />}
                      <div className={f.inc ? 'text-text-primary' : 'text-text-muted'}>
                        {f.text}
                        {f.sub && <span className="block text-xs text-text-secondary mt-0.5">{f.sub}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="btn-secondary w-full">Open Account</Link>
              </div>

              {/* Business */}
              <div className="card h-full flex flex-col border-accent/50 shadow-glow relative animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</div>
                <h3 className="text-xl font-semibold mb-2">Business Account</h3>
                <p className="text-text-secondary text-sm mb-6">For businesses accepting payments and managing payouts.</p>
                <div className="mb-6 border-b border-bg-border pb-6">
                  <span className="text-4xl font-display font-bold">Pay as you go</span>
                </div>
                <ul className="flex flex-col gap-4 mb-8 flex-grow">
                  {[
                    { text: 'Accept local cards', inc: true, sub: '1.5% + $0.10' },
                    { text: 'Accept international cards', inc: true, sub: '3.9% + $0.10' },
                    { text: 'Bulk disbursements', inc: true },
                    { text: 'Automated Invoicing', inc: true },
                    { text: 'API & Webhook Access', inc: true },
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <Check className="w-5 h-5 text-accent shrink-0" />
                      <div className="text-text-primary">
                        {f.text}
                        {f.sub && <span className="block text-xs text-accent mt-0.5 font-medium">{f.sub}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="btn-primary w-full">Get Started</Link>
              </div>

              {/* Enterprise */}
              <div className="card h-full flex flex-col hover:border-bg-border relative animate-slide-up" style={{ animationDelay: '400ms' }}>
                <h3 className="text-xl font-semibold mb-2">Enterprise Infrastructure</h3>
                <p className="text-text-secondary text-sm mb-6">For high-volume platforms and fintechs requiring custom limits.</p>
                <div className="mb-6 border-b border-bg-border pb-6">
                  <span className="text-4xl font-display font-bold">Custom</span>
                </div>
                <ul className="flex flex-col gap-4 mb-8 flex-grow">
                   {[
                    { text: 'Volume discounts', inc: true },
                    { text: 'Dedicated Account Manager', inc: true },
                    { text: 'Custom API Rate Limits', inc: true },
                    { text: 'SLA Guarantee (99.99%)', inc: true },
                    { text: 'Custom Integration Support', inc: true },
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <Check className="w-5 h-5 text-text-primary shrink-0" />
                      <div className="text-text-primary">
                        {f.text}
                      </div>
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="btn-secondary w-full">Contact Sales</Link>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
