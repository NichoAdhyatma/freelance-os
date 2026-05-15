'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface TableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TableSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: TableSearchBarProps) {
  // Fully controlled: localValue always mirrors the external value prop.
  // This ensures the input field ALWAYS reflects the parent's state,
  // including when parent resets search to ''.
  const [localValue, setLocalValue] = useState(value);
  const lastEmittedRef = useRef(value);

  // Sync from parent — triggered when value prop changes (e.g. reset from empty state).
  // Intentionally only tracks `value` dep; `localValue` dep is excluded to avoid
  // a loop where syncing triggers a sync. The `value` dep is what matters — it fires
  // when the parent resets search externally.
  useEffect(() => {
    setLocalValue(value);
    lastEmittedRef.current = value;
  }, [value]);

  const debouncedValue = useDebounce(localValue, 300);

  useEffect(() => {
    if (debouncedValue !== lastEmittedRef.current) {
      lastEmittedRef.current = debouncedValue;
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

  const handleClear = () => {
    setLocalValue('');
    lastEmittedRef.current = '';
    onChange('');
  };

  return (
    <div className={className}>
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pr-8 pl-9"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}