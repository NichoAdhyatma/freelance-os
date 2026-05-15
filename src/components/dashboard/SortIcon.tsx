'use client';

import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

interface SortIconProps {
  field: string;
  sortField: string | null;
  sortDir: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
}

export function SortIcon({ field, sortField, sortDir, onSort }: SortIconProps) {
  const isActive = sortField === field && sortDir !== null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSort(field);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as unknown as React.MouseEvent)}
      className="inline-flex cursor-pointer items-center"
    >
      {!isActive ? (
        <ChevronsUpDown className="text-muted-foreground/30 h-3.5 w-3.5 transition-opacity hover:opacity-100" />
      ) : sortDir === 'asc' ? (
        <ArrowUp className="text-primary h-3.5 w-3.5" />
      ) : (
        <ArrowDown className="text-primary h-3.5 w-3.5" />
      )}
    </span>
  );
}
