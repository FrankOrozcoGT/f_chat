// InfoBanner component - reusable informational banner
// Variants: info (blue), warning (orange), ai (purple with Bot icon)

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Bot, Info, AlertTriangle } from 'lucide-react';

export interface InfoBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'ai';
  icon?: ReactNode;
  children: ReactNode;
}

const InfoBanner = forwardRef<HTMLDivElement, InfoBannerProps>(
  ({ className, variant = 'info', icon, children, ...props }, ref) => {
    const variants = {
      info: {
        container: 'bg-toast-info-bg border-accent-blue',
        text: 'text-accent-blue',
        DefaultIcon: Info,
      },
      warning: {
        container: 'bg-toast-error-bg border-accent-orange',
        text: 'text-accent-orange',
        DefaultIcon: AlertTriangle,
      },
      ai: {
        container: 'bg-accent-purple/10 border-accent-purple',
        text: 'text-accent-purple',
        DefaultIcon: Bot,
      },
    };

    const { container, text, DefaultIcon } = variants[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 border rounded-lg',
          container,
          className
        )}
        role="status"
        {...props}
      >
        <span className={cn('shrink-0', text)}>
          {icon || <DefaultIcon className="w-5 h-5" />}
        </span>
        <p className={cn('text-sm font-medium flex-1', text)}>
          {children}
        </p>
      </div>
    );
  }
);

InfoBanner.displayName = 'InfoBanner';

export { InfoBanner };
