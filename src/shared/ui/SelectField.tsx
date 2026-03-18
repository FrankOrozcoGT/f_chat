import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectFieldOption[];
  error?: boolean;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className, options, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2.5 md:py-2',
            'min-h-11 md:min-h-10',
            'text-base',
            'border border-border-primary rounded-md',
            'bg-bg-primary text-text-primary',
            'appearance-none cursor-pointer pr-10',
            'transition-colors',
            'focus:outline-none focus:border-accent-blue',
            'disabled:bg-bg-secondary disabled:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed',
            error && 'border-accent-red focus:border-accent-red',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
        />
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

export { SelectField };
