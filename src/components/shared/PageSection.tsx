'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

interface PageSectionHeaderProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
}

export function PageSectionHeader({ title, description, action }: PageSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        {title && (
          <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-sm text-[var(--text-tertiary)]">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function PageSectionContent({ children, className }: PageSectionProps) {
  return (
    <div className={cn('rounded-xl border overflow-hidden', className)} style={{
      borderColor: 'var(--border-default)',
      background: 'var(--surface-raised)',
    }}>
      {children}
    </div>
  );
}