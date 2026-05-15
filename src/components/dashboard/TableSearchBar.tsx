'use client';

import { Search, X } from 'lucide-react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';

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
  // Fully controlled — always reflect parent value.
  // Debouncing lives in the parent (useDebounce), not here.
  const [localValue, setLocalValue] = useState(value);

  // Keep local in sync when parent resets search (e.g. empty state reset)
  if (localValue !== value) {
    setLocalValue(value);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    // Emit immediately — parent has its own debounce
    onChange(next);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <div className={className}>
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={placeholder}
          value={localValue}
          onChange={handleChange}
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