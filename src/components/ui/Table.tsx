import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyState?: ReactNode;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-bg-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-border bg-bg-secondary">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-text-secondary">
                {emptyState ?? 'No data available.'}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                className="border-b border-bg-border/50 hover:bg-bg-hover/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn('px-5 py-4 text-text-primary', col.className)}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[String(col.key)] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
