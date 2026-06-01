'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', shortcut: 'G D' },
  { label: 'Projects', href: '/dashboard/projects', shortcut: 'G P' },
  { label: 'Clients', href: '/dashboard/clients', shortcut: 'G C' },
  { label: 'Finance', href: '/dashboard/finance', shortcut: 'G F' },
  { label: 'Settings', href: '/dashboard/settings', shortcut: 'G S' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const close = useCallback(() => setOpen(false), []);

  // Global ⌘K / Ctrl+K to toggle palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search navigation..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        <CommandGroup heading="Go to">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => {
                close();
                router.push(item.href);
              }}
            >
              <span className="flex-1">{item.label}</span>
              <kbd
                className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-mono"
                style={{
                  background: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                {item.shortcut}
              </kbd>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
