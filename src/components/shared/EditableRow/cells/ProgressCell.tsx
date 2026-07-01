'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

interface ProgressCellProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  onRevert: () => void;
}

export function ProgressCell({ value, onSave, onRevert }: ProgressCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (localValue === value) {
      onRevert();
      return;
    }
    setSaving(true);
    try {
      await onSave(localValue);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        autoFocus
        value={String(localValue)}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          setLocalValue(isNaN(n) ? 0 : Math.min(100, Math.max(0, n)));
        }}
        inputMode="numeric"
        className="h-8 w-14 text-center text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
          if (e.key === 'Escape') { e.preventDefault(); onRevert(); }
        }}
        onBlur={() => handleSave()}
        disabled={saving}
      />
      <Progress value={localValue} className="h-2 w-16" />
    </div>
  );
}

export function ProgressDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <Progress value={value} className="h-2 w-20" />
      <span className="text-xs text-muted-foreground">{value}%</span>
    </div>
  );
}