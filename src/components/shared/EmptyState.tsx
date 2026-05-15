'use client';

import { Button } from '@/components/ui/button';

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
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="16" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M22 26h20M22 32h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  'no-data': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M24 32h6l2 6h6l2-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  ),
  'no-results': (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="28" cy="28" r="12" stroke="currentColor" strokeWidth="2" />
      <path d="M38 38l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 28h10M28 23v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  error: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" />
      <path d="M22 22l20 20M42 22L22 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center ${className || ''}`}
    >
      <div className="text-muted-foreground/40 mb-6 animate-in fade-in zoom-in-95 duration-500">
        {icon || VARIANT_ICONS[variant]}
      </div>
      <h3 className="text-foreground mb-1 text-lg font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-xs text-sm leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}