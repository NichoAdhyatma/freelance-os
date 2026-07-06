'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  separator?: boolean;
}

interface MenuState {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

let globalMenuState: MenuState = { open: false, x: 0, y: 0, items: [] };
const listeners = new Set<() => void>();

function broadcast(state: MenuState) {
  globalMenuState = state;
  listeners.forEach((l) => l());
}

export function openContextMenu(x: number, y: number, items: ContextMenuItem[]) {
  broadcast({ open: true, x, y, items });
}

export function closeContextMenu() {
  broadcast({ ...globalMenuState, open: false });
}

/** Component that renders the context menu portal. Put this once in the layout. */
export function ContextMenuLayer({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    setMounted(true);
    const update = () => forceUpdate({});
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  // Listen to global state changes
  useEffect(() => {
    if (!globalMenuState.open) return;

    const handleClick = () => closeContextMenu();
    const handleContextMenu = () => closeContextMenu();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeContextMenu();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [globalMenuState.open]);

  // Adjust position to keep menu in viewport
  const getPosition = useCallback(() => {
    const menuWidth = 180;
    const menuHeight = globalMenuState.items.length * 40;
    let x = globalMenuState.x;
    let y = globalMenuState.y;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 12;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 12;
    }

    return { x, y };
  }, []);

  if (!mounted || !globalMenuState.open) {
    return <>{children}</>;
  }

  const pos = getPosition();

  return (
    <>
      {children}
      {createPortal(
        <div
          className="fixed z-50 min-w-45 rounded-lg border border-border bg-popover shadow-lg"
          style={{
            left: pos.x,
            top: pos.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {globalMenuState.items.map((item, i) => (
            item.separator ? (
              <div key={`sep-${i}`} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={i}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors ${
                  item.destructive ? 'text-destructive' : 'text-popover-foreground'
                } ${!item.onClick ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                    closeContextMenu();
                  }
                }}
                disabled={!item.onClick}
              >
                {item.icon && <span className="w-4 h-4 flex items-center justify-center shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
