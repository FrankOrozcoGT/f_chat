// Badge component with variants and sizes
// Used for status indicators, counts, tags

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', children, ...props }, ref) => {
    const variants = {
      default: 'bg-bg-tertiary text-text-primary border border-border-primary',
      primary: 'bg-accent-blue text-white',
      success: 'bg-accent-green text-white',
      warning: 'bg-accent-orange text-white',
      danger: 'bg-accent-red text-white',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs md:text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'rounded-full font-medium inline-flex items-center gap-1 shrink-0',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
