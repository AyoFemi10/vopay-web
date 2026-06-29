import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Terminal, BookOpen, Key, Cpu, Code2 } from 'lucide-react';
import Link from 'next/link';

export default function DevelopersPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        {/* ─── HEADER ────────────────────────────────────────── */}
        <section className="section bg-gradient-dark text-center pb-12 border-b border-bg-border">
          <div className="container-vp max-w-4xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
                <Terminal className="w-4 h-4" /> VOPayX API v1.0
              </div>
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-6 animate-slide-up">
              Build the future of <br/>
              <span className="gradient-text">global finance.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary animate-slide-up" style={{ animationDelay: '100ms' }}>
              Everything you need to integrate multi-currency wallets, cross-border transfers, and automated payments into your application.
            </p>
            <div className="flex justify-center gap-4 mt-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Link href="#" className="btn-primary">Read the Docs</Link>
              <Link href="/auth/signup" className="btn-secondary">Get API Keys</Link>
            </div>
          </div>
        </section>

        {/* ─── FEATURES ──────────────────────────────────────── */}
        <section className="section bg-bg-primary">
          <div className="container-vp">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card bg-bg-secondary hover:bg-bg-card transition-colors">
                <BookOpen className="w-8 h-8 text-accent mb-4" />
                <h3 className="font-semibold text-lg mb-2">Comprehensive Docs</h3>
                <p className="text-text-secondary text-sm">Clear, copy-pasteable examples for every endpoint.</p>
              </div>
              <div className="card bg-bg-secondary hover:bg-bg-card transition-colors">
                <Cpu className="w-8 h-8 text-success mb-4" />
                <h3 className="font-semibold text-lg mb-2">Webhooks</h3>
                <p className="text-text-secondary text-sm">Real-time notifications for transaction status changes.</p>
              </div>
              <div className="card bg-bg-secondary hover:bg-bg-card transition-colors">
                <Key className="w-8 h-8 text-warning mb-4" />
                <h3 className="font-semibold text-lg mb-2">Secure Auth</h3>
                <p className="text-text-secondary text-sm">OAuth 2.0 and scoped API keys for granular control.</p>
              </div>
              <div className="card bg-bg-secondary hover:bg-bg-card transition-colors">
                <Code2 className="w-8 h-8 text-error mb-4" />
                <h3 className="font-semibold text-lg mb-2">Official SDKs</h3>
                <p className="text-text-secondary text-sm">Available for Node.js, Python, Ruby, and PHP.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── API SNIPPET ───────────────────────────────────── */}
        <section className="section bg-bg-secondary border-t border-bg-border">
          <div className="container-vp max-w-5xl">
            <div className="flex flex-col md:flex-row gap-12 items-center">
               <div className="w-full md:w-1/2">
                 <h2 className="text-3xl font-bold mb-4">Create a multi-currency wallet in seconds.</h2>
                 <p className="text-text-secondary mb-6">Our API is designed around REST principles, using standard HTTP verbs and returning standard HTTP status codes and JSON payloads.</p>
                 <ul className="flex flex-col gap-3 text-sm">
                   <li className="flex items-center gap-2"><CheckIcon /> Idempotent requests</li>
                   <li className="flex items-center gap-2"><CheckIcon /> Rate limiting (100 req/sec)</li>
                   <li className="flex items-center gap-2"><CheckIcon /> Sandbox environment</li>
                 </ul>
               </div>
               <div className="w-full md:w-1/2">
                 <div className="bg-[#0A0A0A] rounded-xl border border-bg-border overflow-hidden">
                    <div className="bg-[#111] px-4 py-3 flex gap-4 text-xs font-mono border-b border-bg-border text-text-muted">
                      <button className="text-accent">cURL</button>
                      <button className="hover:text-white">Node.js</button>
                      <button className="hover:text-white">Python</button>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <pre className="text-sm font-mono text-gray-300">
<code><span className="text-blue-400">curl</span> -X POST https://api.vopayx.com/v1/wallets \
  -H <span className="text-green-400">"Authorization: Bearer sk_live_xxx"</span> \
  -H <span className="text-green-400">"Content-Type: application/json"</span> \
  -d <span className="text-yellow-200">'{'{'}
    "currency": "USD",
    "customer_id": "cus_9x8y7z"
  {'}'}'</span></code>
                      </pre>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function CheckIcon() {
  return <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
}
