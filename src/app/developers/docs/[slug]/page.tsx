import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import type { Metadata } from 'next';
import { getDocPageContent, getDocPages, getAdjacentPages } from '@/lib/docs/docs';
import { extractHeadings, formatDate } from '@/lib/docs/utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const pages = getDocPages('developer');
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = getDocPageContent('developer', slug);
  if (!doc) return {};
  return {
    title: `${doc.frontmatter.title} — VOPayX Docs`,
    description: doc.frontmatter.description,
  };
}

// Minimal MDX components styled to match the web app's design system
const mdxComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-3xl font-bold text-white font-display mb-4 mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-xl font-semibold text-white mt-10 mb-4">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-lg font-semibold text-white mt-8 mb-3">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-text-secondary leading-7 mb-4">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-1.5 text-text-secondary mb-4 pl-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-inside space-y-1.5 text-text-secondary mb-4 pl-2">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-text-secondary leading-7">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-accent pl-4 my-4 bg-accent/[0.04] py-3 rounded-r-xl text-text-secondary italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
      {...(href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    if (!className) {
      return (
        <code className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[0.85em] font-mono">
          {children}
        </code>
      );
    }
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-bg-card border border-bg-border rounded-xl p-4 overflow-x-auto text-sm font-mono text-zinc-300 my-4">
      {children}
    </pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-white/[0.03] border-b border-white/10">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-text-muted">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-4 py-3 text-text-secondary border-b border-white/[0.05]">{children}</td>
  ),
  hr: () => <hr className="my-8 border-bg-border" />,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-white font-semibold">{children}</strong>
  ),
};

export default async function DevDocPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getDocPageContent('developer', slug);

  if (!doc) notFound();

  const { frontmatter, content } = doc;
  const headings = extractHeadings(content);
  const { prev, next } = getAdjacentPages('developer', slug);

  return (
    <div className="flex gap-8">
      {/* Article */}
      <article className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <p className="text-xs text-text-muted mb-6 font-mono">
          Developer Docs → {frontmatter.title}
        </p>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white font-display mb-3">
            {frontmatter.title}
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            {frontmatter.description}
          </p>
          {frontmatter.lastUpdated && (
            <p className="flex items-center gap-1.5 text-xs text-text-muted mt-3">
              <Clock className="w-3 h-3" />
              Last updated: {formatDate(frontmatter.lastUpdated)}
            </p>
          )}
        </header>

        <div className="divider" />

        {/* MDX Content */}
        <div className="prose-docs">
          <MDXRemote source={content} components={mdxComponents as any} />
        </div>

        {/* Prev / Next navigation */}
        {(prev || next) && (
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-bg-border">
            {prev ? (
              <Link
                href={`/developers/docs/${prev.slug}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Previous</p>
                  <p className="font-medium">{prev.title}</p>
                </div>
              </Link>
            ) : <div />}

            {next ? (
              <Link
                href={`/developers/docs/${next.slug}`}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors group text-right"
              >
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Next</p>
                  <p className="font-medium">{next.title}</p>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : <div />}
          </div>
        )}
      </article>

      {/* Table of contents — desktop only */}
      {headings.length > 0 && (
        <aside className="hidden xl:block w-52 shrink-0 sticky top-24 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
            On this page
          </p>
          <nav>
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className={`block text-xs text-text-muted hover:text-white transition-colors py-0.5 ${
                      h.level === 3 ? 'pl-3' : ''
                    }`}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
    </div>
  );
}
