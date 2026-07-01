import Link from 'next/link';

const LINKS = {
  Product: [
    { name: 'Consumer Wallet', href: '/product' },
    { name: 'Business Platform', href: '/product' },
    { name: 'Developer APIs', href: '/developers' },
    { name: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { name: 'About', href: '/about' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '/contact' },
  ],
  Legal: [
    { name: 'Terms of Service', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Compliance', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/6 pt-16 pb-10">
      <div className="container-vp">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-black text-xs font-display">V</span>
              </div>
              <span className="text-base font-black font-display text-white">
                VOPay<span className="text-zinc-500">X</span>
              </span>
            </Link>
            <p className="text-zinc-600 text-sm leading-relaxed max-w-xs">
              Africa's next-generation payment infrastructure. Move money globally — instantly.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-600">All systems operational</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-700 mb-5">{group}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href}
                      className="text-sm text-zinc-600 hover:text-zinc-300 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="h-px bg-white/6 mb-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-700">
          <p>© {new Date().getFullYear()} VOPayX. All rights reserved.</p>
          <p>Built with precision in Africa 🌍</p>
        </div>
      </div>
    </footer>
  );
}
