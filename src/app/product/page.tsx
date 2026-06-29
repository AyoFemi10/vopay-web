import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Globe2, Zap, Code, ShieldCheck, CreditCard, Banknote, Users, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ProductPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        {/* ─── HEADER ────────────────────────────────────────── */}
        <section className="section bg-gradient-dark text-center">
          <div className="container-vp max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-6 animate-slide-up">
              One Platform. <br />
              <span className="gradient-text">Three Core Pillars.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary animate-slide-up" style={{ animationDelay: '100ms' }}>
              VOPayX is designed to serve individuals, growing businesses, and ambitious developers with world-class financial infrastructure.
            </p>
          </div>
        </section>

        {/* ─── CONSUMER WALLET ───────────────────────────────── */}
        <section className="section bg-bg-primary">
          <div className="container-vp">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <div className="w-full lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
                  <Globe2 className="w-4 h-4" /> Consumer Wallet
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Your money, <br/>globally accessible.</h2>
                <p className="text-text-secondary text-lg mb-8">
                  A modern wallet application that lets you hold balances in multiple currencies, send money instantly to other VOPayX users, and exchange foreign currencies at the best rates.
                </p>
                <ul className="flex flex-col gap-4 mb-8">
                  {[
                    { icon: CreditCard, title: 'Multi-Currency Balances (NGN, USD, GBP, EUR)' },
                    { icon: Zap, title: 'Instant Peer-to-Peer Transfers (Zero Fees)' },
                    { icon: Banknote, title: 'Real-time Foreign Exchange' },
                    { icon: ShieldCheck, title: 'Bank-grade Security & Biometrics' },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-text-primary">
                      <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center shrink-0">
                        <feature.icon className="w-4 h-4 text-accent" />
                      </div>
                      {feature.title}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="btn-primary">Open a Free Wallet</Link>
              </div>
              <div className="w-full lg:w-1/2">
                {/* Simulated UI Mockup */}
                <div className="glass !p-2 rounded-3xl border border-bg-border/50 shadow-glow relative">
                  <div className="absolute inset-0 bg-gradient-brand opacity-10 rounded-3xl blur-xl"></div>
                  <div className="bg-bg-primary rounded-2xl p-6 border border-bg-border relative z-10 h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <p className="text-text-secondary text-sm">Total Balance</p>
                        <h3 className="text-3xl font-bold mt-1">$12,450.00</h3>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-bg-hover"></div>
                    </div>
                    <div className="flex gap-4 mb-8">
                      <div className="flex-1 bg-bg-secondary p-4 rounded-xl border border-bg-border">
                        <p className="text-text-secondary text-xs mb-2">USD Wallet</p>
                        <p className="font-semibold">$4,200.00</p>
                      </div>
                      <div className="flex-1 bg-bg-secondary p-4 rounded-xl border border-bg-border">
                        <p className="text-text-secondary text-xs mb-2">NGN Wallet</p>
                        <p className="font-semibold">₦8,250,000</p>
                      </div>
                    </div>
                    <div className="flex-1 bg-bg-secondary rounded-xl border border-bg-border p-4">
                      <p className="text-text-secondary text-sm mb-4">Recent Transactions</p>
                      {[1,2,3].map(i => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-bg-border last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-bg-primary"></div>
                            <div>
                              <p className="text-sm font-medium">Transfer sent</p>
                              <p className="text-xs text-text-muted">Today, 2:40 PM</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-error">-$250.00</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BUSINESS PLATFORM ─────────────────────────────── */}
        <section className="section bg-bg-secondary">
          <div className="container-vp">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
              <div className="w-full lg:w-1/2">
                 <div className="glass !p-2 rounded-3xl border border-success/20 shadow-glow-success relative">
                  <div className="absolute inset-0 bg-success opacity-5 rounded-3xl blur-xl"></div>
                  <div className="bg-bg-primary rounded-2xl p-6 border border-bg-border relative z-10 h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-semibold">Business Overview</h3>
                      <div className="px-3 py-1 bg-success/10 text-success rounded-full text-xs">Active</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                       <div className="bg-bg-secondary p-4 rounded-xl border border-bg-border">
                        <p className="text-text-secondary text-xs mb-1">Today's Revenue</p>
                        <p className="font-semibold text-xl text-success">+$8,450.00</p>
                      </div>
                      <div className="bg-bg-secondary p-4 rounded-xl border border-bg-border">
                        <p className="text-text-secondary text-xs mb-1">Active Customers</p>
                        <p className="font-semibold text-xl">1,248</p>
                      </div>
                    </div>
                     <div className="flex-1 bg-bg-secondary rounded-xl border border-bg-border flex items-center justify-center">
                        <Activity className="w-16 h-16 text-text-muted/30" />
                     </div>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-semibold mb-6">
                  <Zap className="w-4 h-4" /> Business Payments
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Automate your <br/>financial operations.</h2>
                <p className="text-text-secondary text-lg mb-8">
                  From accepting global payments to managing mass payouts and payroll, our business suite gives you the tools to scale without the operational headache.
                </p>
                <ul className="flex flex-col gap-4 mb-8">
                  {[
                    { icon: Globe2, title: 'Accept payments in 130+ countries' },
                    { icon: Users, title: 'Bulk disbursements & Payroll' },
                    { icon: Activity, title: 'Real-time financial analytics & reporting' },
                    { icon: Banknote, title: 'Automated invoicing & billing' },
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-text-primary">
                      <div className="w-8 h-8 rounded-full bg-bg-primary border border-bg-border flex items-center justify-center shrink-0">
                        <feature.icon className="w-4 h-4 text-success" />
                      </div>
                      {feature.title}
                    </li>
                  ))}
                </ul>
                <Link href="/contact" className="btn-secondary">Contact Sales</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DEVELOPER APIS ────────────────────────────────── */}
        <section className="section bg-bg-primary">
           <div className="container-vp text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-semibold mb-6">
                <Code className="w-4 h-4" /> Developer Infrastructure
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Built by developers, <br/>for developers.</h2>
              <p className="text-text-secondary text-lg mb-12 max-w-2xl mx-auto">
                Integrate VOPayX into your application in minutes. We provide robust REST APIs, webhooks, and SDKs to help you build the next big fintech product.
              </p>
              
              <div className="bg-[#0D0D0D] border border-[#2A2A2A] rounded-2xl p-6 text-left overflow-hidden shadow-card">
                <div className="flex items-center gap-2 mb-4 border-b border-[#2A2A2A] pb-4">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="ml-2 text-xs text-text-muted font-mono">transfer.ts</span>
                </div>
                <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
                  <code>
<span className="text-purple-400">import</span> {'{'} VOPayX {'}'} <span className="text-purple-400">from</span> <span className="text-green-400">'@vopay/sdk'</span>;<br/><br/>
<span className="text-purple-400">const</span> client = <span className="text-purple-400">new</span> <span className="text-yellow-200">VOPayX</span>(process.env.<span className="text-blue-300">VOPAYX_SECRET_KEY</span>);<br/><br/>
<span className="text-gray-500">// Send money globally with 3 lines of code</span><br/>
<span className="text-purple-400">const</span> transfer = <span className="text-purple-400">await</span> client.transfers.<span className="text-blue-200">create</span>({'{'}<br/>
{'  '}amount: <span className="text-orange-300">5000</span>,<br/>
{'  '}currency: <span className="text-green-400">'USD'</span>,<br/>
{'  '}recipient: <span className="text-green-400">'user@example.com'</span><br/>
{'}'});<br/><br/>
<span className="text-blue-200">console</span>.<span className="text-blue-200">log</span>(transfer.status); <span className="text-gray-500">// 'COMPLETED'</span>
                  </code>
                </pre>
              </div>

              <div className="mt-10">
                <Link href="/developers" className="btn-primary">View Documentation</Link>
              </div>
           </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
