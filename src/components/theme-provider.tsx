'use client';

import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark);
    };

    // Apply initial theme based on system preference
    applyTheme(mediaQuery.matches);

    // Listen for system preference changes
    const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return <>{children}</>;
}