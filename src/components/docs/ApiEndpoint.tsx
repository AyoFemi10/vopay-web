'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

function cn(...inputs: Parameters<typeof clsx>) { return twMerge(clsx(inputs)); }

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiParam { name: string; type: string; required?: boolean; description: string; }
interface ApiEndpointProps {
  method: HttpMethod; path: string; description: string; auth?: boolean;
  params?: ApiParam[]; requestExample?: string; responseExample?: string;
}

const METHOD_STYLES: Record<HttpMethod, string> = {
  GET:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  POST:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  PUT:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  PATCH:  'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

export function ApiEndpoint({ method, path, description, auth = true, params, requestExample, responseExample }: ApiEndpointProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden mb-4">
      <button className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left" onClick={() => setExpanded(e => !e)} aria-expanded={expanded}>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded font-mono', METHOD_STYLES[method])}>{method}</span>
        <code className="text-sm text-zinc-200 font-mono flex-1">{path}</code>
        {auth && <span className="text-[10px] text-zinc-500 border border-white/10 px-1.5 py-0.5 rounded">Auth required</span>}
        {expanded ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-500 shrink-0" />}
      </button>
      {expanded && (
        <div className="border-t border-white/[0.07] px-4 py-4 space-y-4">
          <p className="text-sm text-zinc-400">{description}</p>
          {params && params.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Parameters</h4>
              <div className="rounded-lg border border-white/[0.07] overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-white/[0.03]"><th className="text-left px-3 py-2 text-xs text-zinc-500 font-medium">Name</th><th className="text-left px-3 py-2 text-xs text-zinc-500 font-medium">Type</th><th className="text-left px-3 py-2 text-xs text-zinc-500 font-medium">Required</th><th className="text-left px-3 py-2 text-xs text-zinc-500 font-medium">Description</th></tr></thead>
                  <tbody>{params.map(p => (<tr key={p.name} className="border-t border-white/[0.05]"><td className="px-3 py-2"><code className="text-blue-400 text-xs">{p.name}</code></td><td className="px-3 py-2"><code className="text-amber-400 text-xs">{p.type}</code></td><td className="px-3 py-2"><span className={cn('text-xs', p.required ? 'text-red-400' : 'text-zinc-600')}>{p.required ? 'Yes' : 'No'}</span></td><td className="px-3 py-2 text-zinc-400 text-xs">{p.description}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}
          {(requestExample || responseExample) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {requestExample && (<div><h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Request</h4><pre className="bg-[#0d0d0d] border border-white/[0.07] rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto font-mono">{requestExample}</pre></div>)}
              {responseExample && (<div><h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-2">Response</h4><pre className="bg-[#0d0d0d] border border-white/[0.07] rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto font-mono">{responseExample}</pre></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
