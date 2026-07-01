'use client';

import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, label, icon, placeholder, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    
    return (
      <div className={cn('relative w-full', wrapperClassName)}>
        {label && (
          <motion.label
            initial={false}
            animate={{ 
              y: isFocused || props.value ? -24 : 0,
              scale: isFocused || props.value ? 0.85 : 1,
              color: isFocused ? '#3B82F6' : '#B3B3B3'
            }}
            className={cn(
              "absolute left-4 transition-colors origin-left z-10 pointer-events-none",
              icon ? "left-11" : "left-4",
              isFocused || props.value ? "top-2" : "top-3.5"
            )}
          >
            {label}
          </motion.label>
        )}
        
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted z-10 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={isFocused ? placeholder : (label ? '' : placeholder)}
          className={cn(
            'input',
            icon && 'pl-11',
            label && 'pt-6 pb-2', // Add padding for floating label
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
