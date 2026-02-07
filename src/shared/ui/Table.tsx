import { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  getRowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  emptyState?: ReactNode;
}

export const Table = <T,>({
  data,
  columns,
  getRowKey,
  onRowClick,
  className,
  emptyState,
}: TableProps<T>) => {
  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border-primary', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-secondary border-b-2 border-border-primary">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'text-left px-4 py-3 text-sm font-semibold text-text-secondary',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={getRowKey(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'border-b border-border-primary hover:bg-bg-tertiary transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-3', column.className)}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
