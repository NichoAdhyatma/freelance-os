'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface TableContainerProps {
  children: ReactNode;
  className?: string;
  rounded?: boolean;
}

export function TableContainer({ children, className, rounded = true }: TableContainerProps) {
  return (
    <div
      className={cn(
        'overflow-hidden border',
        rounded ? 'rounded-xl' : '',
        className,
      )}
      style={{
        borderColor: 'var(--border-default)',
        background: 'var(--surface-raised)',
      }}
    >
      {children}
    </div>
  );
}

interface TablePaginationProps {
  showing: string;
  children: ReactNode;
}

export function TablePagination({ showing, children }: TablePaginationProps) {
  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-t"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <p className="text-sm text-[var(--text-tertiary)]">{showing}</p>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}