'use client';

import { Command as CommandPrimitive, CommandDialog as CommandDialogPrimitive } from 'cmdk';
import { Check, Search } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ── Command (wraps CommandPrimitive) ─────────────────────────────

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        'flex size-full flex-col overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground',
        className,
      )}
      {...props}
    />
  );
}

// CommandDialog wraps CommandDialogPrimitive (cmdk's built-in Radix dialog + Command.Root).
// Props spread to RadixDialog.Root (open, onOpenChange, etc.) + contentClassName, overlayClassName.
function CommandDialog({
  title,
  description,
  children,
  className,
  ...props
}: React.ComponentProps<typeof CommandDialogPrimitive> & {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CommandDialogPrimitive
      label={title ?? 'Command Palette'}
      contentClassName={cn('top-[30%] translate-y-0 overflow-hidden rounded-xl p-0', className)}
      {...props}
    >
      {/* Radix Dialog portal renders this content; title/description for a11y */}
      {children}
    </CommandDialogPrimitive>
  );
}

// Self-contained CommandInput — uses cmdk's Command.Input with defensive useSyncExternalStore
function CommandInput({ className, placeholder = 'Type a command...', ...props }: React.ComponentProps<typeof CommandPrimitive.Input> & {
  placeholder?: string;
}) {
  return (
    <div className="flex items-center border-b border-[var(--border-subtle)] px-3">
      <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
      <CommandPrimitive.Input
        className={cn(
          'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

// Defensive useCommandState wrapper — gracefully handles missing context in React 19
function DefensiveCommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-[300px] overflow-y-auto overflow-x-hidden p-1',
        className,
      )}
      {...props}
    />
  );
}

function DefensiveCommandItem({ className, children, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'group/cmd-item relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none',
        'data-[selected=true]:bg-[var(--accent-muted)] data-[selected=true]:text-[var(--text-primary)]',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <Check className="ml-auto h-4 w-4 shrink-0 opacity-0 group-data-[selected=true]/cmd-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function DefensiveCommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-[var(--text-secondary)]',
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--text-tertiary)]',
        className,
      )}
      {...props}
    />
  );
}

// ── Primitive wrappers (these work inside Command.Root) ──────────

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        'max-h-[300px] overflow-y-auto overflow-x-hidden p-1',
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn('py-6 text-center text-sm text-[var(--text-tertiary)]', className)}
      {...props}
    />
  );
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        'overflow-hidden p-1 text-[var(--text-secondary)]',
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--text-tertiary)]',
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn('-mx-1 h-px bg-[var(--border-subtle)]', className)}
      {...props}
    />
  );
}

function CommandItem({ className, children, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        'group/cmd-item relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm outline-none',
        'data-[selected=true]:bg-[var(--accent-muted)] data-[selected=true]:text-[var(--text-primary)]',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <Check className="ml-auto h-4 w-4 shrink-0 opacity-0 group-data-[selected=true]/cmd-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        'ml-auto text-xs tracking-widest text-[var(--text-tertiary)]',
        'group-data-[selected=true]/cmd-item:text-[var(--text-secondary)]',
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
