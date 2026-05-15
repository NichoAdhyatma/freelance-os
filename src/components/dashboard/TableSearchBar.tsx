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
  const [localValue, setLocalValue] = useState(value);
  const lastEmittedRef = useRef<string>(value);

  // Sync when parent resets value externally (e.g. reset from empty state)
  useEffect(() => {
    setLocalValue(value);
    lastEmittedRef.current = value;
  }, [value]);

  const debouncedValue = useDebounce(localValue, 300);

  // Emit to parent only when user actually typed something new
  useEffect(() => {
    if (debouncedValue !== lastEmittedRef.current) {
      lastEmittedRef.current = debouncedValue;
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange]);

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
            onClick={() => {
              setLocalValue('');
              lastEmittedRef.current = '';
              // Emit immediately on clear — bypass debounce so parent updates right away
              onChange('');
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}