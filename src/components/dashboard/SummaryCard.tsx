'use client';

import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: 'default' | 'red' | 'yellow' | 'green';
  icon?: React.ReactNode;
  className?: string;
}

export function SummaryCard({
  label,
  value,
  sub,
  subColor = 'default',
  icon,
  className,
}: SummaryCardProps) {
  const subColorMap: Record<string, string> = {
    red:    'text-[var(--status-danger)]',
    yellow: 'text-[var(--status-warning)]',
    green:  'text-[var(--status-success)]',
    default: 'text-[var(--text-tertiary)]',
  };

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-center rounded-xl border p-5 transition-all duration-200 hover:-translate-y-px cursor-default',
        className,
      )}
      style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}
    >
      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 1px var(--primary), 0 4px 20px oklch(0.82 0.12 75 / 8%)',
        }}
      />

      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="mb-1 text-xs font-medium tracking-wide text-[var(--text-tertiary)]">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>
          {sub && <p className={cn('mt-0.5 text-xs', subColorMap[subColor])}>{sub}</p>}
        </div>
        {icon && (
          <div
            className="transition-all duration-200 group-hover:scale-110"
            style={{ color: 'var(--text-tertiary)', opacity: 0.5 }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface SummaryCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function SummaryCardGrid({ children, className }: SummaryCardGridProps) {
  return (
    <div className={cn('grid gap-3 md:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}