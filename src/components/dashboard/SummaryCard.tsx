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
  return (
    <div
      className={cn(
        'bg-card border-border group flex flex-col justify-center rounded-xl border px-5 py-4 transition-colors hover:bg-muted/50',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sub && (
            <p
              className={cn(
                'mt-0.5 text-xs',
                subColor === 'red' && 'text-red-400',
                subColor === 'yellow' && 'text-yellow-500',
                subColor === 'green' && 'text-green-500',
                subColor === 'default' && 'text-muted-foreground',
              )}
            >
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100">
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
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>{children}</div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: 'default' | 'red' | 'yellow' | 'green';
}

export function StatItem({ label, value, sub, subColor = 'default' }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{value}</span>
      <span className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        {sub && (
          <span
            className={cn(
              'text-xs',
              subColor === 'red' && 'text-red-400',
              subColor === 'yellow' && 'text-yellow-500',
              subColor === 'green' && 'text-green-500',
              subColor === 'default' && 'text-muted-foreground',
            )}
          >
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}
