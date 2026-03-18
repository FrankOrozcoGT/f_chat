import { type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export const FormField = ({
  label,
  required,
  optional,
  error,
  hint,
  children,
  className,
}: FormFieldProps) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-accent-red ml-1">*</span>}
          {optional && (
            <span className="text-text-tertiary font-normal ml-1">(opcional)</span>
          )}
        </label>
      )}

      {children}

      {error && (
        <p className="text-xs md:text-sm text-accent-red">{error}</p>
      )}

      {hint && !error && (
        <p className="text-xs md:text-sm text-text-secondary">{hint}</p>
      )}
    </div>
  );
};
