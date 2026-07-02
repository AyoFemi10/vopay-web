import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

function cn(...inputs: Parameters<typeof clsx>) { return twMerge(clsx(inputs)); }

type CalloutType = 'info' | 'warning' | 'success' | 'error';
interface CalloutProps { type?: CalloutType; title?: string; children: React.ReactNode; }

const CALLOUT_STYLES: Record<CalloutType, { container: string; icon: React.ReactNode }> = {
  info:    { container: 'bg-blue-500/5 border-blue-500/20 text-blue-300',    icon: <Info size={16} className="text-blue-400 shrink-0 mt-0.5" /> },
  warning: { container: 'bg-amber-500/5 border-amber-500/20 text-amber-300', icon: <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" /> },
  success: { container: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300', icon: <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> },
  error:   { container: 'bg-red-500/5 border-red-500/20 text-red-300',       icon: <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" /> },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const styles = CALLOUT_STYLES[type];
  return (
    <div className={cn('flex gap-3 p-4 rounded-xl border my-4', styles.container)}>
      {styles.icon}
      <div className="text-sm leading-relaxed">
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
    </div>
  );
}
