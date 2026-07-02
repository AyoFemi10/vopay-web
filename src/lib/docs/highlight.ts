import { codeToHtml } from 'shiki';

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'php' | 'go' | 'java' | 'bash' | 'json' | 'yaml' | 'sql';

const SHIKI_THEME = 'github-dark-dimmed';

export async function highlight(code: string, lang: SupportedLanguage | string = 'text'): Promise<string> {
  try {
    return await codeToHtml(code, { lang: lang as SupportedLanguage, theme: SHIKI_THEME });
  } catch {
    return await codeToHtml(code, { lang: 'text', theme: SHIKI_THEME });
  }
}

export const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JavaScript', js: 'JavaScript',
  typescript: 'TypeScript', ts: 'TypeScript',
  python: 'Python', py: 'Python',
  php: 'PHP', go: 'Go', java: 'Java',
  bash: 'Shell', sh: 'Shell',
  json: 'JSON', yaml: 'YAML', yml: 'YAML',
  sql: 'SQL', text: 'Text',
};
