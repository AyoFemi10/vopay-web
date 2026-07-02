'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { LANGUAGE_LABELS } from '@/lib/docs/highlight';

interface CodeBlockProps { code: string; lang?: string; highlightedHtml: string; className?: string; }

export function CodeBlock({ code, lang = 'text', highlightedHtml }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const label = LANGUAGE_LABELS[lang] ?? lang.toUpperCase();
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/[0.07]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.07]">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-white transition-colors" aria-label="Copy code">
          {copied ? <><Check size={12} className="text-emerald-400" /><span className="text-emerald-400">Copied!</span></> : <><Copy size={12} /><span>Copy</span></>}
        </button>
      </div>
      <div className="overflow-x-auto text-sm [&_.shiki]:rounded-none [&_.shiki]:border-0" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
    </div>
  );
}
