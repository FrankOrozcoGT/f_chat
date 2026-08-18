import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Portal } from '@/shared/ui/Portal';

export interface SearchableSelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface SearchableSelectProps<T = string> {
  options: SearchableSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect = <T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay opciones disponibles',
  disabled = false,
  className,
}: SearchableSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const outsideTrigger = containerRef.current && !containerRef.current.contains(target);
      const outsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      if (outsideTrigger && outsideDropdown) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const q = search.toLowerCase();
  const filtered = options.filter(
    (o) =>
      !q ||
      o.label.toLowerCase().includes(q) ||
      (o.sublabel?.toLowerCase().includes(q) ?? false) ||
      String(o.value).toLowerCase().includes(q)
  );

  const selected = options.find((o) => o.value === value);

  const handleSelect = (v: T) => {
    if (disabled) return;
    onChange(v);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'w-full min-h-10 px-3 py-2',
          'flex items-center justify-between gap-2',
          'bg-bg-secondary border border-border-primary rounded-md text-left',
          'transition-colors text-sm',
          isOpen && 'border-accent-blue',
          !isOpen && 'hover:border-accent-blue',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {selected ? (
          <div className="flex-1 min-w-0">
            <span className="text-text-primary truncate block">{selected.label}</span>
            {selected.sublabel && (
              <span className="text-xs text-text-secondary truncate block">{selected.sublabel}</span>
            )}
          </div>
        ) : (
          <span className="text-text-secondary flex-1">{placeholder}</span>
        )}
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-text-secondary transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && !disabled && (
        <Portal>
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 9999,
            }}
            className="bg-bg-primary border border-border-primary rounded-md shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-border-primary">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-bg-secondary rounded-md">
                <Search size={14} className="text-text-secondary shrink-0" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-secondary outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-52 md:max-h-64 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-text-secondary">
                  {search ? 'Sin resultados' : emptyMessage}
                </p>
              )}

              {filtered.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 min-h-10 text-left transition-colors',
                    option.value === value ? 'bg-accent-blue/10' : 'hover:bg-bg-secondary',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm truncate', option.value === value ? 'text-accent-blue font-medium' : 'text-text-primary')}>
                      {option.label}
                    </p>
                    {option.sublabel && (
                      <p className="text-xs text-text-secondary truncate">{option.sublabel}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
