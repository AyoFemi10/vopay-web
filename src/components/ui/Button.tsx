import type { ButtonHTMLAttributes, ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ButtonProps extends Omit<ComponentPropsWithoutRef<typeof motion.button>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) => {
  const base = 'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-200';
  const variants = {
    primary: 'bg-gradient-brand text-white hover:scale-[1.02] shadow-glow',
    secondary: 'bg-bg-secondary text-white border border-bg-border hover:bg-bg-hover',
    ghost: 'bg-transparent border border-accent/30 text-accent hover:bg-accent/10',
    success: 'bg-gradient-success text-white hover:scale-[1.02] shadow-glow',
    danger: 'bg-gradient-danger text-white hover:scale-[1.02] shadow-glow',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </motion.button>
  );
};
