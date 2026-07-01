'use client';

import { Plus, User } from 'lucide-react';
import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from '@/components/ui/select';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  style?: React.CSSProperties;
}

interface SelectCellProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  onAddNew?: () => void;
  displayValue?: string;
  /** Called when the display area is clicked — parent decides whether to enter edit mode */
  onTriggerEdit?: () => void;
}

export function SelectCell({
  value,
  options,
  onChange,
  placeholder = '—',
  onAddNew,
  displayValue,
  onTriggerEdit,
}: SelectCellProps) {
  const selected = options.find((o) => o.value === value);

  // Always render the Select — display and edit look identical for select cells.
  // onTriggerEdit opens the dropdown on click.
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger
        hideIcon
        className="h-7 w-full cursor-pointer border-0 bg-transparent shadow-none p-0 [&]:justify-start [&]:gap-0 data-[state=open]:bg-accent/50 [&>span]:flex [&>span]:items-center"
        onClick={onTriggerEdit}
      >
        <span className="flex items-center gap-1 text-sm text-muted-foreground truncate">
          {displayValue ?? selected?.label ?? placeholder}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="gap-2">
            {o.icon && <span className="shrink-0">{o.icon}</span>}
            {o.style && (
              <span className="h-2 w-2 rounded-full shrink-0" style={o.style} />
            )}
            {o.label}
          </SelectItem>
        ))}
        {onAddNew && (
          <>
            <SelectSeparator className="-mx-1 my-1" />
            <button
              className="flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm text-primary outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
              onClick={(e) => { e.stopPropagation(); onAddNew(); }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Add new
            </button>
          </>
        )}
      </SelectContent>
    </Select>
  );
}

interface ClientSelectCellProps {
  value: string;
  clients: Array<{ id: string; name: string; company?: string }>;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  onTriggerEdit?: () => void;
}

export function ClientSelectCell({ value, clients, onChange, onAddNew, onTriggerEdit }: ClientSelectCellProps) {
  const display = (c: typeof clients[number]) =>
    c.company ? `${c.name} — ${c.company}` : c.name;
  const selected = clients.find((c) => c.id === value);

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger
        hideIcon
        className="h-7 w-full cursor-pointer border-0 bg-transparent shadow-none p-0 [&]:justify-start [&]:gap-0 data-[state=open]:bg-accent/50 [&>span]:flex [&>span]:items-center"
        onClick={onTriggerEdit}
      >
        <span className="flex items-center gap-1 text-sm text-muted-foreground truncate">
          {selected ? display(selected) : '—'}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="" className="text-muted-foreground">— No client —</SelectItem>
        {clients.map((c) => (
          <SelectItem key={c.id} value={c.id} className="gap-2">
            <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{display(c)}</span>
          </SelectItem>
        ))}
        {onAddNew && (
          <>
            <SelectSeparator className="-mx-1 my-1" />
            <button
              className="flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm text-primary outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
              onClick={(e) => { e.stopPropagation(); onAddNew(); }}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              Add new client
            </button>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
