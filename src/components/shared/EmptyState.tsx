'use client';

import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center ${className || ''}`}
    >
      <div className="text-muted-foreground/30 mb-4">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
