import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, X } from 'lucide-react';
import { Portal } from '@/shared/ui/Portal';

export type { DateRange };

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
}

export const DateRangePicker = ({ value, onChange, placeholder = 'Seleccionar período' }: DateRangePickerProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const formatted =
    value?.from && value?.to
      ? `${format(value.from, 'dd MMM yyyy', { locale: es })} → ${format(value.to, 'dd MMM yyyy', { locale: es })}`
      : value?.from
      ? format(value.from, 'dd MMM yyyy', { locale: es })
      : '';

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 6,
      left: rect.right + window.scrollX,
    });
  };

  const handleOpen = () => {
    updatePosition();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary border border-border-primary rounded-md text-text-primary hover:border-accent-blue transition-colors min-w-56"
      >
        <CalendarDays size={15} className="text-text-tertiary shrink-0" />
        <span className={formatted ? 'text-text-primary' : 'text-text-tertiary'}>
          {formatted || placeholder}
        </span>
        {value?.from && (
          <X
            size={14}
            className="text-text-tertiary hover:text-text-primary ml-auto shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange(undefined); setOpen(false); }}
          />
        )}
      </button>

      {open && (
        <Portal>
          <div
            ref={popoverRef}
            style={{ top: position.top, right: `calc(100vw - ${position.left}px)` }}
            className="fixed z-50 bg-bg-secondary border border-border-primary rounded-lg shadow-xl p-3"
          >
            <DayPicker
              mode="range"
              selected={value}
              onSelect={(range, triggerDate) => {
                if (value?.from && value?.to) {
                  onChange({ from: triggerDate, to: undefined });
                  return;
                }
                onChange(range);
              }}
              locale={es}
              numberOfMonths={2}
              classNames={{
                months: 'flex gap-4',
                month: 'space-y-3',
                month_caption: 'flex justify-center items-center h-7 mb-1',
                caption_label: 'text-sm font-medium text-text-primary capitalize',
                nav: 'flex items-center gap-1',
                button_previous: 'absolute left-1 p-1 rounded hover:bg-bg-tertiary text-text-secondary transition-colors',
                button_next: 'absolute right-1 p-1 rounded hover:bg-bg-tertiary text-text-secondary transition-colors',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'text-text-tertiary text-xs font-medium w-8 text-center',
                weeks: 'space-y-1',
                week: 'flex',
                day: 'p-0',
                day_button: 'w-8 h-8 text-sm rounded-md flex items-center justify-center transition-colors text-text-primary hover:bg-bg-tertiary cursor-pointer',
                selected: '[&>button]:bg-accent-blue [&>button]:text-white [&>button]:hover:bg-accent-blue',
                range_start: '[&>button]:bg-accent-blue [&>button]:text-white [&>button]:rounded-r-none',
                range_end: '[&>button]:bg-accent-blue [&>button]:text-white [&>button]:rounded-l-none',
                range_middle: '[&>button]:bg-accent-blue/20 [&>button]:text-text-primary [&>button]:rounded-none',
                today: '[&>button]:font-bold [&>button]:text-accent-blue',
                outside: '[&>button]:text-text-tertiary [&>button]:opacity-40',
                disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
              }}
            />
          </div>
        </Portal>
      )}
    </div>
  );
};
