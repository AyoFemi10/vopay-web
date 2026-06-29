import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean; // apply glassmorphism style
}

export function Card({ children, className = '', glass = false }: CardProps) {
  const base = 'rounded-2xl p-6 transition-shadow duration-300 bg-bg-card border border-bg-border';
  const glassClass = 'bg-bg-card/30 backdrop-blur-xl border border-white/10';
  const classes = cn(base, glass ? glassClass : '', className);

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
      className={classes}
    >
      {children}
    </motion.div>
  );
}
