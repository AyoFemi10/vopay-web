import { Lock } from 'lucide-react';

export function InternalBanner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-red-500/[0.07] border border-red-500/20">
      <Lock size={16} className="text-red-400 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-300">Internal Use Only</p>
        <p className="text-xs text-red-400/70 mt-0.5">This document is intended for VOPayX staff only and must not be shared externally.</p>
      </div>
    </div>
  );
}
