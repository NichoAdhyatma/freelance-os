'use client';

import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  columnWidths?: string[];
  withSummaryCards?: boolean;
  withSearch?: boolean;
}

const DEFAULT_COLUMNS = 5;

export function DataTableSkeleton({
  rows = 5,
  columns = DEFAULT_COLUMNS,
  columnWidths,
  className,
  withSummaryCards = false,
  withSearch = false,
}: DataTableSkeletonProps) {
  const cols = Array.from({ length: columns }, (_, i) => i);

  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      {withSummaryCards && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex h-24 flex-col justify-between rounded-xl border p-5"
              style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}
            >
              <div className="h-2.5 w-24 rounded-full" style={{ background: 'var(--muted)' }} />
              <div className="h-8 w-16 rounded" style={{ background: 'var(--muted)', opacity: 0.5 }} />
            </div>
          ))}
        </div>
      )}

      {withSearch && (
        <div className="h-9 w-64 rounded-lg" style={{ background: 'var(--surface-raised)' }} />
      )}

      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}
      >
        <div
          className="flex items-center gap-4 px-4 py-3"
          style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          {cols.map((i) => (
            <div
              key={i}
              className="h-2.5 rounded-full"
              style={{
                background: 'var(--muted-foreground)',
                opacity: 0.3,
                ...(!columnWidths && {
                  width: i === 0 ? '48px' : i === columns - 1 ? '80px' : '100%',
                  maxWidth: i === 0 ? '48px' : i === columns - 1 ? '80px' : '150px',
                }),
              }}
            />
          ))}
        </div>

        {[...Array(rows)].map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 px-4 py-4"
            style={{ borderBottom: rowIdx < rows - 1 ? '1px solid var(--border-subtle)' : undefined }}
          >
            {cols.map((i) => (
              <div
                key={i}
                className="h-3.5 rounded-full"
                style={{
                  background: 'var(--muted-foreground)',
                  opacity: 0.2,
                  width: i === 0 ? '32px' : i === columns - 1 ? '64px' : 'auto',
                  maxWidth: i === 0 ? '32px' : i === columns - 1 ? '64px' : '200px',
                  flex: i === 0 || i === columns - 1 ? '0 0 auto' : '1 1 auto',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({ showSearch = true }: { showSearch?: boolean }) {
  return <DataTableSkeleton withSummaryCards withSearch={showSearch} rows={5} columns={5} />;
}