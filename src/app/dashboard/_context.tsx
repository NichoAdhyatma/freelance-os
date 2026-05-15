'use client';

import { useEffect, useState } from 'react';

/** Module-level title store with subscriber support. */
let _title = '';
const _subscribers = new Set<() => void>();

function emitChange() {
  _subscribers.forEach((fn) => fn());
}

/**
 * Set the page title shown in the Header.
 * Call unconditionally at the top of a dashboard page component.
 *
 * @example setDashboardTitle('Clients');
 */
export function setDashboardTitle(title: string): void {
  _title = title;
  emitChange();
}

/** Read by the Header component — subscribes to changes for re-render. */
export function getDashboardTitle(): string {
  return _title;
}

/** React hook for components that want to read the title reactively. */
export function useDashboardTitle(): string {
  const [title, setTitle] = useState(_title);

  useEffect(() => {
    const handler = () => setTitle(_title);
    _subscribers.add(handler);
    return () => {
      _subscribers.delete(handler);
    };
  }, []);

  return title;
}