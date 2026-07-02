'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';

const nav = [
  {
    group: 'Getting Started',
    items: [
      { label: 'Introduction', href: '/developers/docs' },
      { label: 'Authentication', href: '/developers/docs/authentication' },
      { label: 'API Keys', href: '/developers/docs/api-keys' },
    ],
  },
  {
    group: 'Core Concepts',
    items: [
      { label: 'Webhooks', href: '/developers/docs/webhooks' },
      { label: 'Rate Limits', href: '/developers/docs/rate-limits' },
      { label: 'Error Codes', href: '/developers/docs/error-codes' },
      { label: 'API Reference', href: '/developers/docs/api-reference' },
    ],
  },
  {
    group: 'SDKs & Tools',
    items: [
      { label: 'SDKs & Examples', href: '/developers/docs/sdks' },
      { label: 'Postman Collections', href: '/developers/docs/postman-collections' },
      { label: 'Testing Environment', href: '/developers/docs/testing-environment' },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <nav className="w-full">
      {nav.map((section) => (
        <div key={section.group} className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2 px-3">
            {section.group}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                      active
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pr-2 py-8">
        {sidebar}
      </aside>

      {/* Mobile toggle */}
      <div className="lg:hidden sticky top-16 z-40 bg-bg-primary border-b border-bg-border px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">Docs Navigation</span>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-colors"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 top-28 z-30 bg-bg-primary px-5 pt-6 pb-20 overflow-y-auto">
          {sidebar}
        </div>
      )}
    </>
  );
}
