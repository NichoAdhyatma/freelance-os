'use client';

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  pulse = false,
  ...props
}: React.ComponentProps<'div'> & { pulse?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        pulse
          ? 'animate-pulse rounded-md bg-gradient-to-r from-transparent via-foreground/5 to-transparent bg-[length:200%_100%]'
          : 'animate-pulse rounded-md bg-surface-hover',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
