'use client';

import { useCallback, useEffect, useState } from 'react';

export interface KeyboardNavOptions<T> {
  items: T[];
  onSelect?: (item: T, index: number) => void;
  onNavigate?: (item: T, index: number, direction: 'up' | 'down') => void;
  onEscape?: () => void;
  enabled?: boolean;
  loop?: boolean;
  initialIndex?: number;
}

export interface KeyboardNavResult<T> {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  clearSelection: () => void;
  props: {
    'aria-selected': boolean;
    'data-selected': boolean;
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
  };
}

export function useKeyboardNav<T>({
  items,
  onSelect,
  onNavigate,
  onEscape,
  enabled = true,
  loop = true,
  initialIndex = -1,
}: KeyboardNavOptions<T>): KeyboardNavResult<T> {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const moveTo = useCallback(
    (direction: 'up' | 'down') => {
      if (items.length === 0) return;
      setSelectedIndex((prev) => {
        let next: number;
        if (direction === 'down') {
          next = prev + 1;
          if (next >= items.length) next = loop ? 0 : items.length - 1;
        } else {
          next = prev - 1;
          if (next < 0) next = loop ? items.length - 1 : 0;
        }
        if (onNavigate) onNavigate(items[next], next, direction);
        return next;
      });
    },
    [items, loop, onNavigate],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          if (e.key === 'j' && !isInputFocused()) return;
          e.preventDefault();
          moveTo('down');
          break;
        case 'ArrowUp':
        case 'k':
          if (e.key === 'k' && !isInputFocused()) return;
          e.preventDefault();
          moveTo('up');
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            e.preventDefault();
            onSelect?.(items[selectedIndex], selectedIndex);
          }
          break;
        case 'Escape':
          setSelectedIndex(-1);
          onEscape?.();
          break;
      }
    },
    [enabled, moveTo, onSelect, onEscape, selectedIndex, items],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  const clearSelection = useCallback(() => setSelectedIndex(-1), []);

  const getItemProps = useCallback(
    (index: number) => ({
      'aria-selected': selectedIndex === index,
      'data-selected': selectedIndex === index,
      onMouseEnter: () => setSelectedIndex(index),
      onMouseLeave: () => {}, // keep selection on mouse leave for keyboard continuity
      onClick: () => {
        setSelectedIndex(index);
        onSelect?.(items[index], index);
      },
    }),
    [selectedIndex, onSelect, items],
  );

  return {
    selectedIndex,
    setSelectedIndex,
    clearSelection,
    props: getItemProps(-1), // placeholder; use getItemProps(index) per item
  };
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    el?.getAttribute('contenteditable') === 'true';
}

// ── Global keyboard shortcut hook ────────────────────────────

export type ShortcutHandler = (e: KeyboardEvent) => void;

const listeners = new Map<string, Set<ShortcutHandler>>();

export function registerShortcut(key: string, handler: ShortcutHandler, preventDefault = true) {
  const cb = (e: KeyboardEvent) => {
    if (matchesKey(key, e)) {
      if (preventDefault) e.preventDefault();
      handler(e);
    }
  };
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  window.addEventListener('keydown', cb);
  return () => {
    listeners.get(key)?.delete(cb);
    window.removeEventListener('keydown', cb);
  };
}

export function useGlobalShortcut(key: string, handler: ShortcutHandler, preventDefault = true) {
  useEffect(() => {
    return registerShortcut(key, handler, preventDefault);
  }, [key, handler, preventDefault]);
}

function matchesKey(shortcut: string, e: KeyboardEvent): boolean {
  const parts = shortcut.toLowerCase().split('+').map((p) => p.trim());
  const hasCmd = parts.includes('cmd') || parts.includes('meta');
  const hasShift = parts.includes('shift');
  const hasCtrl = parts.includes('ctrl');
  const hasAlt = parts.includes('alt');
  const keyPart = parts[parts.length - 1];

  const cmdMatch = hasCmd ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
  const shiftMatch = hasShift ? e.shiftKey : !e.shiftKey;
  const ctrlMatch = hasCtrl ? e.ctrlKey : !e.ctrlKey;
  const altMatch = hasAlt ? e.altKey : !e.altKey;
  const keyMatch = e.key.toLowerCase() === keyPart;

  return cmdMatch && shiftMatch && ctrlMatch && altMatch && keyMatch;
}