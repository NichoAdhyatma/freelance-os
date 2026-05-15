'use client';

import { useCallback, useEffect, useState } from 'react';

/** Module-level title store with subscriber support. */
let _title = '';
const _subscribers = new Set<(t: string) => void>();

function notify(t: string) {
  _subscribers.forEach((fn) => fn(t));
}

export function setDashboardTitle(title: string): void {
  if (_title === title) return;
  _title = title;
  // Notify synchronously so the store is up to date, but
  // state updates are deferred via startTransition to avoid
  // "setState while rendering" errors.
  notify(title);
}

/** Read current title (may be stale during render — use hook for reactivity). */
export function getDashboardTitle(): string {
  return _title;
}

/** React hook — subscribes to title changes and triggers re-render. */
export function useDashboardTitle(): string {
  const [title, setTitle] = useState(_title);

  // Use useCallback + useEffect to defer the subscriber registration
  // until after the first render, avoiding setState-in-render when
  // setDashboardTitle() is called during the same commit phase.
  const handlerRef = useCallback((t: string) => {
    // Defer via startTransition to avoid "Cannot update component while
    // rendering another" when setDashboardTitle is called during a
    // page component's initial render.
    import('react').then(({ startTransition }) => {
      startTransition(() => setTitle(t));
    });
  }, []);

  useEffect(() => {
    _subscribers.add(handlerRef);
    return () => {
      _subscribers.delete(handlerRef);
    };
  }, [handlerRef]);

  return title;
}