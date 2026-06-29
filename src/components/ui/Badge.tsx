import React from 'react';

export type BadgeVariant =
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'gray',
  className = '',
  children,
  ...rest
}) => {
  const baseClasses =
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold';
  const variantClasses: Record<BadgeVariant, string> = {
    blue: 'bg-accent-glow text-accent',
    green: 'bg-success/10 text-success',
    yellow: 'bg-warning/10 text-warning',
    red: 'bg-error/10 text-error',
    gray: 'bg-bg-hover text-text-secondary',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  );
};
