'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

/** Global singleton — one context menu for the whole app */
interface MenuState {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

let menuState: MenuState = { open: false, x: 0, y: 0, items: [] };
const listeners = new Set<(s: MenuState) => void>();

function broadcast(s: MenuState) {
  menuState = s;
  listeners.forEach((l) => l({ ...menuState }));
}

function close() {
  broadcast({ ...menuState, open: false });
}

/** Open context menu at cursor position */
export function openContextMenu(x: number, y: number, items: ContextMenuItem[]) {
  broadcast({ open: true, x, y, items });
}

/** Component that renders the portal. Put this once in the layout. */
export function ContextMenuLayer({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MenuState>({ ...menuState });

  useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const handle = () => close();
    document.addEventListener('click', handle);
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('click', handle);
      document.removeEventListener('keydown', handle);
    };
  }, [state.open]);

  return (
    <>
      {children}
      {state.open &&
        createPortal(
          <div
            className="bg-popover text-popover-foreground fixed z-[9999] min-w-[160px] rounded-lg border shadow-md"
            style={{ left: state.x, top: state.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {state.items.map((item, i) => (
              <button
                key={i}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  item.destructive ? 'text-destructive' : ''
                }`}
                onClick={() => {
                  item.onClick();
                  close();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
