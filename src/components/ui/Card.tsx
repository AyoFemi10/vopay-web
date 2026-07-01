'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'flat' | 'glass' | 'neumorph';
  hoverable?: boolean;
}

export function Card({ children, className, variant = 'flat', hoverable = false, ...props }: CardProps) {

  const variants: Record<string, string> = {
    flat:    'bg-[#0d0d0d] border border-white/6 p-6',
    glass:   'bg-white/[0.025] backdrop-blur-xl border border-white/6 p-6',
    neumorph: 'bg-[#111] p-6',
  };

  const neuShadow = variant === 'neumorph'
    ? { boxShadow: '4px 4px 12px rgba(0,0,0,0.9), -4px -4px 12px rgba(255,255,255,0.02)' }
    : {};

  return (
    <motion.div
      {...(hoverable ? { whileHover: { y: -2 }, transition: { duration: 0.18 } } : {})}
      style={{ borderRadius: 12, ...neuShadow }}
      className={cn('relative overflow-hidden transition-all duration-200', variants[variant], className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
