// Backward compatibility: children-based grid layout
// New code should use StatsGrid with items prop
import { cn } from '@/lib/utils';

interface SummaryCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function SummaryCardGrid({ children, className }: SummaryCardGridProps) {
  return (
    <div className={cn('grid gap-3 md:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  );
}