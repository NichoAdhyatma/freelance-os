'use client';

import { cn } from '@/lib/utils';

type EmptyStateVariant = 'default' | 'no-data' | 'no-results' | 'error';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  variant?: EmptyStateVariant;
  className?: string;
}

const VARIANT_ICONS: Record<EmptyStateVariant, React.ReactNode> = {
  default: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="12" width="32" height="24" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M16 20h16M16 26h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  'no-data': (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M18 24h4l2 5h4l2-5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  ),
  'no-results': (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="21" cy="21" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M29 29l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 21h6M21 18v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  error: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M17 17l14 14M31 17L17 31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
};

export function EmptyState({ title, description, actionLabel, onAction, icon, variant = 'default', className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center rounded-xl py-14 text-center', className)}
      style={{ border: '1px dashed var(--border-default)', background: 'var(--surface-raised)', opacity: 0.7 }}
    >
      <div className="mb-5 text-[var(--text-tertiary)]" style={{ opacity: 0.4 }}>
        {icon || VARIANT_ICONS[variant]}
      </div>
      <h3 className="mb-1.5 text-base font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mb-6 max-w-xs text-sm leading-relaxed text-[var(--text-tertiary)]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: 'var(--accent-muted)', color: 'var(--primary)', border: '1px solid var(--primary)', opacity: 0.9 }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}