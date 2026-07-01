import Link from 'next/link';
import Image from 'next/image';

// Auth layout — clean black/white split, no blue
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex">

      {/* ── Left: Form ─────────────────────────────────────── */}
      <div className="w-full lg:w-[46%] flex flex-col justify-center px-8 sm:px-14 lg:px-20 xl:px-24 relative z-10 py-20">

        {/* Logo */}
        <div className="absolute top-7 left-8 sm:left-14 lg:left-20 xl:left-24">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 relative overflow-hidden rounded-lg shrink-0">
              <Image
                src="/favicon/android-chrome-192x192.png"
                alt="VOPayX logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-[17px] font-black font-display tracking-tight text-white leading-none">
              VOPay<span className="text-zinc-500">X</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-[400px] mx-auto">
          {children}
        </div>
      </div>

      {/* ── Right: Visual panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[54%] stars-bg relative overflow-hidden items-center justify-center border-l border-white/5">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-sm text-center px-10">
          {/* Mock product card */}
          <div className="mx-auto mb-10 w-64"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '28px' }}>

            {/* Balance row */}
            <div className="mb-6">
              <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest mb-2">Total balance</p>
              <p className="text-3xl font-black text-white font-display tracking-tight">$12,840.50</p>
              <p className="text-zinc-700 text-xs mt-1">↑ 4.2% this month</p>
            </div>

            {/* Quick action row */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {['Send', 'Receive', 'Exchange'].map((a) => (
                <div key={a} className="flex flex-col items-center gap-1.5 py-2"
                  style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-5 h-5 rounded bg-white/10" />
                  <p className="text-[9px] text-zinc-600 font-semibold">{a}</p>
                </div>
              ))}
            </div>

            {/* Transaction list */}
            {[
              { label: 'Sent to Amara', amount: '-$250', color: 'text-zinc-400' },
              { label: 'Salary credit', amount: '+₦420k', color: 'text-white' },
              { label: 'FX exchange',   amount: '€500',   color: 'text-zinc-400' },
            ].map((tx) => (
              <div key={tx.label} className="flex items-center justify-between py-2.5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-xs text-zinc-600">{tx.label}</p>
                <p className={`text-xs font-bold ${tx.color}`}>{tx.amount}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-black font-display text-white leading-tight mb-3">
            Global finance,<br />simplified.
          </h2>
          <p className="text-zinc-600 text-sm leading-relaxed">
            Move money across borders instantly. Bank-grade security, zero hidden fees.
          </p>
        </div>

        {/* Floating currency badges */}
        <div className="absolute top-[28%] left-[12%] w-11 h-11 flex items-center justify-center animate-float"
          style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
          <span className="text-base font-black text-white">₦</span>
        </div>
        <div className="absolute top-[40%] right-[10%] w-10 h-10 flex items-center justify-center animate-float"
          style={{ animationDelay: '1.5s', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
          <span className="text-sm font-black text-zinc-400">€</span>
        </div>
        <div className="absolute bottom-[30%] left-[18%] w-9 h-9 flex items-center justify-center animate-float"
          style={{ animationDelay: '0.8s', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
          <span className="text-sm font-black text-zinc-500">£</span>
        </div>
      </div>
    </div>
  );
}
