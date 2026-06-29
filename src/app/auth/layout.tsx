import { Wallet } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        <div className="mb-12 absolute top-8 left-8 sm:left-16 lg:left-24 xl:left-32">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-black font-display tracking-tight text-white group-hover:text-accent-light transition-colors">VOPayX</span>
          </Link>
        </div>
        
        <div className="w-full max-w-md mx-auto animate-fade-in">
          {children}
        </div>
      </div>

      {/* Right side - Branding / Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-secondary relative overflow-hidden items-center justify-center border-l border-bg-border">
         <div className="absolute inset-0 grid-bg opacity-50 z-0"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 glow-orb z-0 animate-pulse-glow"></div>
         
         <div className="relative z-10 max-w-lg text-center px-12">
            <h2 className="text-4xl font-display font-bold mb-6">Global finance, <br/><span className="gradient-text">simplified.</span></h2>
            <p className="text-text-secondary text-lg text-balance">
              Join thousands of businesses and individuals using VOPayX to send, receive, and manage money across borders instantly.
            </p>
         </div>

         {/* Decorative floating elements */}
         <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-bg-card rounded-2xl border border-bg-border shadow-card animate-float flex items-center justify-center">
            <span className="text-2xl font-bold text-success">$</span>
         </div>
         <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-bg-card rounded-2xl border border-bg-border shadow-card animate-float flex items-center justify-center" style={{ animationDelay: '1s' }}>
            <span className="text-2xl font-bold text-accent">€</span>
         </div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-bg-card rounded-2xl border border-bg-border shadow-card animate-float flex items-center justify-center" style={{ animationDelay: '2s' }}>
            <span className="text-2xl font-bold text-warning">₦</span>
         </div>
      </div>
    </div>
  );
}
