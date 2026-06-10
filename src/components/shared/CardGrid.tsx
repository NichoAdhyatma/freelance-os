'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type CardGridCols = '1' | '2' | '3' | '4' | 'auto';
type CardGridGap = 'tight' | 'normal' | 'loose';

interface CardGridProps {
  children: ReactNode;
  cols?: CardGridCols;
  gap?: CardGridGap;
  className?: string;
}

const colsMap: Record<CardGridCols, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-2',
  '3': 'grid-cols-3',
  '4': 'grid-cols-4',
  'auto': 'grid-cols-auto',
};

const gapMap: Record<CardGridGap, string> = {
  tight: 'gap-2',
  normal: 'gap-3',
  loose: 'gap-6',
};

export function CardGrid({ children, cols = 'auto', gap = 'normal', className }: CardGridProps) {
  const colClass = colsMap[cols] ?? colsMap['auto'];
  const gapClass = gapMap[gap] ?? gapMap['normal'];

  return (
    <div className={cn(`grid ${colClass} ${gapClass}`, className)}>
      {children}
    </div>
  );
}

// ── Summary card grid ───────────────────────────────────────────

export function SummaryGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-3 md:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}

// ── Client/project card grid (3-col responsive) ───────────────

export function RecordGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  );
}