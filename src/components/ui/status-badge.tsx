'use client';

import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { getStatusStyle } from '@/lib/tokens';
import type { StatusStyle } from '@/lib/tokens';

interface StatusBadgeProps {
  /** Map of status key → style tokens (e.g. PRIORITY_CONFIG, PROJECT_STATUS_CONFIG). */
  config: Record<string, StatusStyle>;
  /** Status key looked up in config. */
  status: string;
  /** Override displayed label. Defaults to the status key. */
  label?: string;
  /** 'sm' for compact density. */
  size?: 'sm' | 'default';
  className?: string;
}

export function StatusBadge({
  config,
  status,
  label,
  size = 'default',
  className,
}: StatusBadgeProps) {
  const result = getStatusStyle(config, status);
  const inlineStyle = result.style ?? {};

  return (
    <span
      style={{
        color: inlineStyle.color,
        background: inlineStyle.background,
        borderColor: inlineStyle.borderColor,
      }}
      className={cn(
        'inline-flex h-fit w-fit items-center rounded-4xl border px-2 py-0.5',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className,
      )}
    >
      <Badge variant="outline" className="bg-transparent border-0 p-0 font-medium">
        {label ?? status}
      </Badge>
    </span>
  );
}