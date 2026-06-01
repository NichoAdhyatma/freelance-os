'use client';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value = 0, className = '' }: ProgressProps) {
  return (
    <div
      className={`relative h-2 w-full overflow-hidden rounded-full ${className}`}
      style={{ background: 'var(--muted)' }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full transition-all duration-300 ease-in-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: 'var(--primary)',
        }}
      />
    </div>
  );
}
