'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';

interface TextCellProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onRevert: () => void;
  placeholder?: string;
  className?: string;
}

export function TextCell({ value, onSave, onRevert, placeholder = '...', className }: TextCellProps) {
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (localValue.trim() === value) {
      onRevert();
      return;
    }
    setSaving(true);
    try {
      await onSave(localValue.trim());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Input
      autoFocus
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
        if (e.key === 'Escape') { e.preventDefault(); onRevert(); }
      }}
      onBlur={() => handleSave()}
      placeholder={placeholder}
      disabled={saving}
      className={className}
    />
  );
}