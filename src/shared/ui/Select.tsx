import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Portal } from './Portal';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps<T = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'badge';
  size?: 'sm' | 'md';
  placeholder?: string;
  getOptionStyles?: (value: T) => string;
}

export const Select = <T extends string = string>({
  value,
  options,
  onChange,
  disabled = false,
  className,
  variant = 'default',
  size = 'md',
  placeholder = 'Seleccionar...',
  getOptionStyles,
}: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const selectRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideSelect = selectRef.current && !selectRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (isOutsideSelect && isOutsideDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: T) => {
    if (!disabled) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const baseStyles = 'inline-flex items-center gap-2 font-medium transition-all duration-200 cursor-pointer';

  const variantStyles = {
    default: 'bg-bg-secondary border border-border-primary rounded-md hover:bg-bg-tertiary text-text-primary',
    badge: cn(
      'rounded-md border',
      getOptionStyles ? getOptionStyles(value) : 'bg-bg-secondary text-text-secondary border-border-primary'
    ),
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:opacity-80';

  return (
    <div className="relative inline-block" ref={selectRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], disabledStyles, className)}
      >
        <span className="capitalize">{selectedOption?.label || placeholder}</span>
        <ChevronDown size={14} className={cn('transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && !disabled && (
        <Portal>
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
            className="bg-bg-primary border border-border-primary rounded-md shadow-lg overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm transition-colors',
                  option.value === value && 'bg-bg-secondary font-medium',
                  !option.disabled && 'hover:bg-bg-secondary',
                  option.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Portal>
      )}
    </div>
  );
};
