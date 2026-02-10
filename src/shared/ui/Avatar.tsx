// Avatar component with fallback initials
// Responsive sizes with mobile-first touch targets

import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  initials?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', initials, className, ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-11 h-11 md:w-12 md:h-12 text-sm md:text-base', // ≥44px mobile (touch-friendly)
      xl: 'w-14 h-14 md:w-16 md:h-16 text-base md:text-lg',
      '2xl': 'w-20 h-20 md:w-24 md:h-24 text-xl md:text-2xl',
    };

    const baseStyles = 'rounded-full overflow-hidden flex items-center justify-center shrink-0';

    if (src) {
      return (
        <div ref={ref} className={cn(baseStyles, sizes[size], 'bg-bg-tertiary', className)}>
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="w-full h-full object-cover"
            {...props}
          />
        </div>
      );
    }

    // Fallback with initials (gradient background)
    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          sizes[size],
          'bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold',
          className
        )}
      >
        {initials || '?'}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
