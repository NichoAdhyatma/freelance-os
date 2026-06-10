'use client';

import { LayoutDashboard, Settings, FolderKanban, Receipt, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Check } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', shortcut: 'G D', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Projects', href: '/dashboard/projects', shortcut: 'G P', icon: <FolderKanban className="h-4 w-4" /> },
  { label: 'Clients', href: '/dashboard/clients', shortcut: 'G C', icon: <Users className="h-4 w-4" /> },
  { label: 'Finance', href: '/dashboard/finance', shortcut: 'G F', icon: <Receipt className="h-4 w-4" /> },
  { label: 'Settings', href: '/dashboard/settings', shortcut: 'G S', icon: <Settings className="h-4 w-4" /> },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const filtered = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (item: (typeof NAV_ITEMS)[number]) => {
      router.push(item.href);
      close();
    },
    [router, close],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) handleSelect(filtered[selectedIndex]);
        break;
      case 'Escape':
        close();
        break;
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal>
      <Dialog.Portal>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150" />
          <Dialog.Popup
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              background: 'var(--surface-raised)',
              borderColor: 'var(--border-default)',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
          {/* Search input */}
          <div
            className="flex items-center gap-3 border-b px-4"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <svg
              className="h-4 w-4 shrink-0"
              style={{ color: 'var(--text-tertiary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-[var(--text-tertiary)] focus-visible:outline-none focus-visible:ring-0"
              style={{ color: 'var(--text-primary)', outline: 'none', boxShadow: 'none' }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                aria-label="Clear search"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            {filtered.length === 0 ? (
              <div
                className="py-12 text-center text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                No results found.
              </div>
            ) : (
              <div className="p-1" role="listbox">
                {filtered.map((item, index) => (
                  <button
                    key={item.label}
                    role="option"
                    aria-selected={index === selectedIndex}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className="group/cmd-item relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-all duration-100"
                    style={
                      index === selectedIndex
                        ? { background: 'var(--accent-muted)', color: 'var(--text-primary)' }
                        : { color: 'var(--text-secondary)' }
                    }
                  >
                    {index === selectedIndex && (
                      <div
                        className="absolute left-0 h-5 w-0.5 rounded-full"
                        style={{ background: 'var(--primary)' }}
                      />
                    )}

                    <span
                      className="flex h-5 w-5 items-center justify-center"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1 text-left">{item.label}</span>

                    {item.shortcut && (
                      <kbd
                        className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                        style={{
                          background: 'var(--surface-hover)',
                          color: 'var(--text-tertiary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.shortcut}
                      </kbd>
                    )}

                    <Check
                      className="h-4 w-4 shrink-0"
                      style={{
                        opacity: index === selectedIndex ? 1 : 0,
                        color: 'var(--primary)',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between border-t px-4 py-2 text-[10px]"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-tertiary)',
            }}
          >
            <div className="flex items-center gap-3">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
            </div>
            <span>Freelancer OS</span>
          </div>
        </Dialog.Popup>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}