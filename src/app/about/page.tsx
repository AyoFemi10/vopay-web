import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Globe2, Rocket, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <section className="section bg-bg-primary text-center pb-12 border-b border-bg-border">
          <div className="container-vp max-w-3xl">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
                Our Mission
              </div>
            <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-6 animate-slide-up">
              Making money move <br/>
              <span className="gradient-text">like a message.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary animate-slide-up text-balance" style={{ animationDelay: '100ms' }}>
              We are building the financial operating system for the next generation of global commerce, connecting Africa to the world and the world to Africa.
            </p>
          </div>
        </section>

        <section className="section bg-bg-secondary">
           <div className="container-vp max-w-5xl">
              <div className="grid md:grid-cols-3 gap-8">
                 <div className="card text-center">
                    <Globe2 className="w-10 h-10 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Global First</h3>
                    <p className="text-text-secondary">Borders should not dictate how business is done. We are building a truly borderless financial network.</p>
                 </div>
                 <div className="card text-center">
                    <Rocket className="w-10 h-10 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Developer Centric</h3>
                    <p className="text-text-secondary">We believe the best way to accelerate economic growth is to empower developers with powerful tools.</p>
                 </div>
                 <div className="card text-center">
                    <Users className="w-10 h-10 text-warning mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">User Obsessed</h3>
                    <p className="text-text-secondary">Every API endpoint, every UI button, every pixel is designed to make our users' lives easier.</p>
                 </div>
              </div>
           </div>
        </section>

        <section className="section bg-bg-primary">
          <div className="container-vp max-w-4xl text-center">
             <h2 className="text-3xl font-bold mb-6">Backed by the best.</h2>
             <p className="text-text-secondary mb-12">VOPayX is powered by AyoHost and built on top of enterprise-grade infrastructure.</p>
             <div className="p-8 rounded-2xl border border-bg-border bg-bg-secondary/50">
                <p className="text-xl font-display font-medium text-white mb-4">"VOPayX is solving one of the most critical challenges in global commerce today — seamless, multi-currency value transfer."</p>
                <div className="text-sm text-text-muted">— AyoHost Leadership Team</div>
             </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
