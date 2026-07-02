export function extractHeadings(content: string): Array<{ id: string; text: string; level: 2 | 3 }> {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ id: string; text: string; level: 2 | 3 }> = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/`[^`]+`/g, m => m.slice(1, -1));
    const id = slugify(text);
    headings.push({ id, text, level });
  }
  return headings;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
