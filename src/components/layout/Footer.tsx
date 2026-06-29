import Link from 'next/link';
import { Wallet, Twitter, Github, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Consumer Wallet', href: '/product' },
      { name: 'Business Platform', href: '/product' },
      { name: 'Developer APIs', href: '/developers' },
      { name: 'Pricing', href: '/pricing' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '#' },
      { name: 'Contact Sales', href: '/contact' },
    ],
    legal: [
      { name: 'Terms of Service', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Compliance', href: '#' },
    ],
  };

  return (
    <footer className="border-t border-bg-border bg-bg-primary pt-20 pb-10">
      <div className="container-vp">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black font-display tracking-tight text-white">VOPayX</span>
            </Link>
            <p className="text-text-secondary text-sm max-w-sm mb-8 leading-relaxed">
              Global Payments Without Borders. Africa's next-generation payment infrastructure powering global commerce and remittance.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-text-secondary hover:text-white hover:border-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-text-secondary hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="flex flex-col gap-4 text-sm text-text-secondary">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-white hover:underline transition-all">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="flex flex-col gap-4 text-sm text-text-secondary">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-white hover:underline transition-all">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="flex flex-col gap-4 text-sm text-text-secondary">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-white hover:underline transition-all">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>© {currentYear} VOPayX by AyoHost. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success shadow-glow-success animate-pulse"></span>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
