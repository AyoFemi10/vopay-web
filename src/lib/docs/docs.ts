import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { DocPage, DocSection, DocSectionMeta, DocFrontmatter } from './types';

// Content lives in apps/docs/content — single source of truth across the monorepo.
// process.cwd() resolves to apps/web at runtime.
const CONTENT_DIR = path.join(process.cwd(), '..', 'docs', 'content');

export const SECTION_META: Record<DocSection, Omit<DocSectionMeta, 'pages'>> = {
  developer: { id: 'developer', label: 'Developer', description: 'API reference, authentication, webhooks, SDKs, and code examples.', icon: 'Code2', color: 'blue' },
  business:  { id: 'business',  label: 'Business',  description: 'Payment links, invoices, bulk payouts, payroll, teams, and permissions.', icon: 'Building2', color: 'purple' },
  user:      { id: 'user',      label: 'User Guide', description: 'KYC tiers, limits, fees, withdrawals, currency conversion, and account management.', icon: 'User', color: 'green' },
  compliance:{ id: 'compliance',label: 'Compliance', description: 'Privacy policy, terms of service, AML policy, KYC policy, and cookie policy.', icon: 'Shield', color: 'amber' },
  internal:  { id: 'internal',  label: 'Internal',   description: 'Support playbooks, incident response, and operations procedures for staff.', icon: 'Lock', color: 'red' },
};

function readMdxFile(filePath: string): { frontmatter: DocFrontmatter; content: string } {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { frontmatter: data as DocFrontmatter, content };
}

export function getDocPages(section?: DocSection): DocPage[] {
  const sections: DocSection[] = section ? [section] : Object.keys(SECTION_META) as DocSection[];
  const pages: DocPage[] = [];

  for (const sec of sections) {
    const sectionDir = path.join(CONTENT_DIR, sec);
    if (!fs.existsSync(sectionDir)) continue;
    const files = fs.readdirSync(sectionDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace(/\.mdx?$/, '');
      const { frontmatter } = readMdxFile(path.join(sectionDir, file));
      pages.push({ ...frontmatter, slug, href: `/docs/${sec}/${slug}` });
    }
  }
  return pages.sort((a, b) => a.order - b.order);
}

export function getDocPageContent(section: DocSection, slug: string): { frontmatter: DocFrontmatter; content: string } | null {
  for (const ext of ['.mdx', '.md']) {
    const filePath = path.join(CONTENT_DIR, section, `${slug}${ext}`);
    if (fs.existsSync(filePath)) return readMdxFile(filePath);
  }
  return null;
}

export function getAllSectionsWithPages(): DocSectionMeta[] {
  return (Object.keys(SECTION_META) as DocSection[]).map(sec => ({
    ...SECTION_META[sec],
    pages: getDocPages(sec),
  }));
}

export function getAdjacentPages(section: DocSection, currentSlug: string): { prev: DocPage | null; next: DocPage | null } {
  const pages = getDocPages(section);
  const index = pages.findIndex(p => p.slug === currentSlug);
  return { prev: index > 0 ? pages[index - 1] : null, next: index < pages.length - 1 ? pages[index + 1] : null };
}

export function buildSearchIndex(): Array<{ id: string; title: string; section: DocSection; sectionLabel: string; href: string; body: string }> {
  const sections = Object.keys(SECTION_META) as DocSection[];
  const results = [];

  for (const sec of sections) {
    const sectionDir = path.join(CONTENT_DIR, sec);
    if (!fs.existsSync(sectionDir)) continue;
    const files = fs.readdirSync(sectionDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

    for (const file of files) {
      const slug = file.replace(/\.mdx?$/, '');
      const { frontmatter, content } = readMdxFile(path.join(sectionDir, file));
      const bodyText = content.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, ' ').replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 2000);
      results.push({ id: `${sec}/${slug}`, title: frontmatter.title, section: sec, sectionLabel: SECTION_META[sec].label, href: `/docs/${sec}/${slug}`, body: `${frontmatter.description} ${bodyText}` });
    }
  }
  return results;
}
