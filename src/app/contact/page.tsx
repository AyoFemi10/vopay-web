'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Mail, MessageSquare, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent successfully. Our team will get back to you shortly.');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <section className="section bg-bg-primary">
          <div className="container-vp max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
               <div>
                  <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight mb-6 animate-slide-up">
                    Let's talk about <br/>
                    <span className="gradient-text">your business.</span>
                  </h1>
                  <p className="text-lg text-text-secondary mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    Whether you have a question about pricing, need a custom integration, or want to discuss enterprise volumes, our team is ready to help.
                  </p>
                  
                  <div className="flex flex-col gap-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                           <Mail className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                           <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                           <p className="text-text-secondary text-sm">sales@vopayx.com</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                           <MessageSquare className="w-6 h-6 text-success" />
                        </div>
                        <div>
                           <h3 className="font-semibold text-lg mb-1">Support</h3>
                           <p className="text-text-secondary text-sm">support@vopayx.com</p>
                        </div>
                     </div>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                           <MapPin className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                           <h3 className="font-semibold text-lg mb-1">Global Headquarters</h3>
                           <p className="text-text-secondary text-sm">Lagos, Nigeria</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="card glass relative animate-slide-up" style={{ animationDelay: '300ms' }}>
                  <div className="absolute -inset-1 bg-gradient-brand rounded-2xl blur opacity-20 -z-10"></div>
                  <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-text-secondary mb-1">First Name</label>
                           <input type="text" className="input" required />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-text-secondary mb-1">Last Name</label>
                           <input type="text" className="input" required />
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Work Email</label>
                        <input type="email" className="input" required />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Company Name</label>
                        <input type="text" className="input" required />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">How can we help?</label>
                        <textarea className="input min-h-[120px] resize-y" required></textarea>
                     </div>
                     <button type="submit" className="btn-primary w-full mt-2">SendMessage</button>
                  </form>
               </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
