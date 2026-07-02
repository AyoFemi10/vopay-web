import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem { label: string; href?: string; }
interface BreadcrumbProps { items: BreadcrumbItem[]; }

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-zinc-500 mb-6">
      <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-zinc-700" />
          {item.href && i < items.length - 1
            ? <Link href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
            : <span className={i === items.length - 1 ? 'text-zinc-300' : ''}>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
