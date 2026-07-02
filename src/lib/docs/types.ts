export type DocSection = 'developer' | 'business' | 'user' | 'compliance' | 'internal';

export interface DocFrontmatter {
  title: string;
  description: string;
  section: DocSection;
  order: number;
  lastUpdated?: string;
}

export interface DocPage extends DocFrontmatter {
  slug: string;
  href: string;
}

export interface DocSectionMeta {
  id: DocSection;
  label: string;
  description: string;
  icon: string;
  color: string;
  pages: DocPage[];
}

export interface SearchResult {
  slug: string;
  href: string;
  title: string;
  section: DocSection;
  sectionLabel: string;
  excerpt: string;
}
