import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Portal } from '@/shared/ui/Portal';

export interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

interface MultiSelectProps<T = string> {
  options: MultiSelectOption<T>[];
  value: T[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect = <T extends string = string>({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  isLoading = false,
  isError = false,
  errorMessage = 'Error al cargar opciones',
  emptyMessage = 'No hay opciones disponibles',
  disabled = false,
  className,
}: MultiSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular posición del dropdown al abrir
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

  // Cerrar al click fuera
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
  const filtered = options
    .filter((o) =>
      !q ||
      o.label.toLowerCase().includes(q) ||
      (o.sublabel?.toLowerCase().includes(q) ?? false) ||
      String(o.value).toLowerCase().includes(q)
    )
    .sort((a, b) => a.label.localeCompare(b.label));

  const isSelected = (v: T) => value.includes(v);

  const toggle = (v: T) => {
    if (disabled) return;
    const next = isSelected(v) ? value.filter((s) => s !== v) : [...value, v];
    onChange(next);
  };

  const remove = (v: T, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((s) => s !== v));
  };

  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen((o) => !o)}
        disabled={disabled}
        className={cn(
          'w-full min-h-11 md:min-h-10 px-3 py-2',
          'flex items-center gap-2',
          'bg-bg-secondary border border-border-primary rounded-md text-left',
          'transition-colors',
          isOpen && 'border-accent-blue',
          !isOpen && 'hover:border-accent-blue',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Chips o placeholder */}
        <div className="flex-1 flex flex-wrap gap-1.5 min-h-6">
          {selectedOptions.length === 0 ? (
            <span className="text-sm text-text-secondary self-center">{placeholder}</span>
          ) : (
            selectedOptions.map((o) => (
              <span
                key={String(o.value)}
                className="flex items-center gap-1 px-2 py-0.5 bg-accent-blue/15 text-accent-blue text-xs font-medium rounded-md"
              >
                {o.label}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => remove(o.value, e)}
                  onKeyDown={(e) => e.key === 'Enter' && remove(o.value, e as never)}
                  className="hover:opacity-60 transition-opacity min-w-4 min-h-4 flex items-center justify-center cursor-pointer"
                >
                  <X size={10} strokeWidth={2.5} />
                </span>
              </span>
            ))
          )}
        </div>

        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-text-secondary transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown via Portal */}
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
            {/* Search */}
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

            {/* Options */}
            <div className="max-h-52 md:max-h-64 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <div className="w-4 h-4 border-2 border-border-primary border-t-accent-blue rounded-full animate-spin" />
                  <span className="text-sm text-text-secondary">Cargando...</span>
                </div>
              )}

              {isError && !isLoading && (
                <p className="py-6 text-center text-sm text-accent-red">{errorMessage}</p>
              )}

              {!isLoading && !isError && filtered.length === 0 && (
                <p className="py-6 text-center text-sm text-text-secondary">
                  {search ? 'Sin resultados' : emptyMessage}
                </p>
              )}

              {!isLoading && !isError && filtered.map((option) => {
                const selected = isSelected(option.value);
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() => !option.disabled && toggle(option.value)}
                    disabled={option.disabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 min-h-11 md:min-h-10 text-left transition-colors',
                      !option.disabled && 'hover:bg-bg-secondary',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {/* Checkbox custom */}
                    <div
                      className={cn(
                        'w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                        selected
                          ? 'bg-accent-blue border-accent-blue'
                          : 'border-border-primary bg-transparent'
                      )}
                    >
                      {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm truncate', selected ? 'text-text-primary font-medium' : 'text-text-primary')}>
                        {option.label}
                      </p>
                      {option.sublabel && (
                        <p className="text-xs text-text-secondary truncate">{option.sublabel}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer — contador */}
            {value.length > 0 && (
              <div className="px-3 py-2 border-t border-border-primary flex items-center justify-between">
                <span className="text-xs text-text-secondary">
                  {value.length} seleccionado{value.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-accent-blue hover:opacity-70 transition-opacity"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
};
