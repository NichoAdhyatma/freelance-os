'use client';

import { useEffect, type ReactNode } from 'react';

import { registerShortcut } from '@/hooks/useKeyboardNav';

interface KeyboardNavProviderProps {
  children: ReactNode;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}

export function KeyboardNavProvider({
  children,
  onToggleSidebar,
  onOpenCommandPalette,
}: KeyboardNavProviderProps) {
  useEffect(() => {
    const unregister: (() => void)[] = [];

    if (onToggleSidebar) {
      unregister.push(
        registerShortcut('cmd+\\', () => onToggleSidebar()),
      );
    }

    if (onOpenCommandPalette) {
      unregister.push(
        registerShortcut('cmd+k', () => onOpenCommandPalette()),
      );
    }

    // Escape closes any open modals — this is handled by Radix but we
    // also clear any stray keyboard selection state
    unregister.push(
      registerShortcut('escape', () => {
        // Let Radix/Dialog handle their own close
        // This is for custom list selection clearing
        document.querySelectorAll('[data-keyboard-nav]').forEach((el) => {
          (el as HTMLElement).dataset.selected = 'false';
        });
      }),
    );

    return () => unregister.forEach((fn) => fn());
  }, [onToggleSidebar, onOpenCommandPalette]);

  return <>{children}</>;
}