'use client';

import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<typeof motion.button>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

// Glow colours per variant
const GLOW: Record<string, string> = {
  primary:   '0 0 22px 6px rgba(37,99,235,0.45)',
  secondary: '0 0 16px 3px rgba(255,255,255,0.07)',
  ghost:     '0 0 14px 2px rgba(255,255,255,0.05)',
  success:   '0 0 22px 6px rgba(5,150,105,0.4)',
  danger:    '0 0 22px 6px rgba(220,38,38,0.4)',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) => {
  const base = 'relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 select-none outline-none';

  const variants: Record<string, string> = {
    primary:   'bg-[#2563EB] text-white hover:bg-[#1d4ed8] disabled:opacity-50',
    secondary: 'bg-transparent text-white border border-white/20 hover:border-white/45 hover:bg-white/[0.04] disabled:opacity-50',
    ghost:     'bg-transparent text-zinc-400 border border-white/10 hover:text-white hover:border-white/30 disabled:opacity-50',
    success:   'bg-[#059669] text-white hover:bg-[#047857] disabled:opacity-50',
    danger:    'bg-[#DC2626] text-white hover:bg-[#b91c1c] disabled:opacity-50',
  };

  const sizes: Record<string, string> = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <motion.button
      whileHover={{ y: -1, boxShadow: GLOW[variant] }}
      whileTap={{ scale: 0.97, boxShadow: 'none' }}
      transition={{ duration: 0.15 }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};
