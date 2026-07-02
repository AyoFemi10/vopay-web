'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Tab {
  label: string;
  code: string;
  language?: string;
}

interface DocsCodeBlockProps {
  tabs: Tab[];
  title?: string;
}

export function DocsCodeBlock({ tabs, title }: DocsCodeBlockProps) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(tabs[active].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/8 my-5" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8" style={{ background: '#111' }}>
        <div className="flex items-center gap-1">
          {title && <span className="text-xs text-text-muted mr-3 font-mono">{title}</span>}
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                active === i
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-muted hover:text-white rounded transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <pre className="p-5 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
        <code>{tabs[active].code}</code>
      </pre>
    </div>
  );
}
