import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Additional class names for the wrapper */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn('input', className)}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
