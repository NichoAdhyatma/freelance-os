'use client';

import { cn } from '@/lib/utils';

interface InlineEditRowProps {
  isEditing: boolean;
  children: React.ReactNode;
  className?: string;
}

export function InlineEditRow({ isEditing, children, className }: InlineEditRowProps) {
  return (
    <tr
      className={cn(
        'border-border transition-colors',
        isEditing ? 'bg-muted/50' : 'hover:bg-accent/50',
        className,
      )}
    >
      {children}
    </tr>
  );
}