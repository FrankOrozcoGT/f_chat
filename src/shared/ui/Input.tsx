import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2.5 md:py-2',
          'min-h-11 md:min-h-10',
          'text-base',
          'border border-border-primary rounded-md',
          'bg-bg-primary text-text-primary',
          'placeholder:text-text-secondary',
          'transition-colors',
          'focus:outline-none focus:border-accent-blue',
          'disabled:bg-bg-secondary disabled:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed',
          error && 'border-accent-red focus:border-accent-red',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2.5 md:py-2',
          'min-h-20 md:min-h-24',
          'text-base',
          'border border-border-primary rounded-md',
          'bg-bg-primary text-text-primary',
          'placeholder:text-text-secondary',
          'transition-colors resize-vertical leading-relaxed',
          'focus:outline-none focus:border-accent-blue',
          'disabled:bg-bg-secondary disabled:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed',
          error && 'border-accent-red focus:border-accent-red',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
