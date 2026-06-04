'use client';

import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const STORAGE_KEY = 'freelancer-os-theme';

    const applyTheme = (theme: Theme) => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    const getInitialTheme = (): Theme => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
      return 'system';
    };

    const theme = getInitialTheme();
    applyTheme(theme);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current === 'system' || !current) {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return <>{children}</>;
}

export function setTheme(theme: Theme) {
  const STORAGE_KEY = 'freelancer-os-theme';
  localStorage.setItem(STORAGE_KEY, theme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function toggleTheme() {
  const STORAGE_KEY = 'freelancer-os-theme';
  const stored = localStorage.getItem(STORAGE_KEY);
  const current = stored === 'light' || stored === 'dark' ? stored : 'system';
  const isDark = current === 'dark' || (current === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next: Theme = isDark ? 'light' : 'dark';
  setTheme(next);
}

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}