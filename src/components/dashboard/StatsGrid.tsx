// src/components/dashboard/StatsGrid.tsx
'use client';

import { cn } from '@/lib/utils';
import { type StatsCardProps } from './StatsCard';
import { StatsCard } from './StatsCard';

type StatsGridProps = {
  items: StatsCardProps[];
  cols?: 2 | 3 | 4;
  className?: string;
};

const COLS_MAP = {
  2: 'grid-cols-1 lg:grid-cols-2',
  3: 'grid-cols-1 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
} as const;

export function StatsGrid({ items, cols = 4, className }: StatsGridProps) {
  return (
    <div className={cn('grid gap-3', COLS_MAP[cols], className)}>
      {items.map((item, idx) => (
        <StatsCard key={idx} {...item} />
      ))}
    </div>
  );
}
