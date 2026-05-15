'use client';

import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  /** Column widths as fractions (e.g. 'w-1/2', 'w-1/4', 'w-16') */
  columnWidths?: string[];
  /** Show summary card row above table */
  withSummaryCards?: boolean;
  /** Show search bar skeleton */
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
      {/* Action button skeleton */}
      <div className="flex items-center justify-end">
        <div className="h-10 w-32 rounded-lg bg-muted" />
      </div>

      {/* Summary cards */}
      {withSummaryCards && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex h-28 flex-col justify-between rounded-xl border border-border bg-card px-5 py-4">
              <div className="h-3 w-24 rounded-full bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Search bar */}
      {withSearch && <div className="h-10 w-64 rounded-lg bg-muted" />}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border bg-muted/50 px-4 py-3">
          {cols.map((i) => (
            <div
              key={i}
              className={cn(
                'h-3 rounded-full bg-muted',
                columnWidths ? columnWidths[i] : 'flex-1',
              )}
              style={
                !columnWidths
                  ? {
                      width: i === 0 ? '48px' : i === columns - 1 ? '80px' : '100%',
                      maxWidth: i === 0 ? '48px' : i === columns - 1 ? '80px' : '150px',
                    }
                  : undefined
              }
            />
          ))}
        </div>

        {/* Rows */}
        {[...Array(rows)].map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center gap-4 border-b border-border/50 px-4 py-4 last:border-0"
          >
            {cols.map((i) => (
              <div
                key={i}
                className={cn(
                  'h-4 rounded-full bg-muted',
                  i === 0 && 'w-8',
                  i === columns - 1 && 'w-16',
                )}
                style={
                  i !== 0 && i !== columns - 1
                    ? {
                        width: `${Math.random() * 40 + 60}px`,
                        maxWidth: '200px',
                      }
                    : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full page skeleton for list pages (Projects, Clients, Finance) */
export function PageSkeleton({ showSearch = true }: { showSearch?: boolean }) {
  return <DataTableSkeleton withSummaryCards withSearch={showSearch} rows={5} columns={5} />;
}