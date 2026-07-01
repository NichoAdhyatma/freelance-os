'use client';

import { Popover, PopoverContent, PopoverTriggerWrapper } from '@/components/ui/popover';

interface PopoverCellProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  /** Called when the trigger display is clicked — parent decides whether to enter edit mode */
  onTriggerEdit?: () => void;
}

export function PopoverCell({ trigger, content, className, onTriggerEdit }: PopoverCellProps) {
  return (
    <Popover>
      <PopoverTriggerWrapper className={className} onClick={onTriggerEdit}>
        {trigger}
      </PopoverTriggerWrapper>
      <PopoverContent className="w-auto p-0" align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
}
