'use client';

import { Check, Plus, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import type { InvoiceFormData } from '@/types/invoice';

interface InvoiceInlineRowProps {
  mode: 'add';
  onSave: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
}

// ── Client select popover ───────────────────────────────────────────────────

function ClientSelectMenu({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { clients } = useClients();
  const [open, setOpen] = useState(false);

  const clientDisplay = (client: (typeof clients)[number]) =>
    client.company ? `${client.name} — ${client.company}` : client.name;

  const selected = clients.find((c) => c.id === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{selected ? clientDisplay(selected) : 'Select client'}</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup className="flex w-72 flex-col gap-1 rounded-lg border bg-popover p-2 shadow-md">
            <div className="px-1 py-1.5 text-xs font-medium text-muted-foreground">Select Client</div>
            {clients.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">No clients yet</p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                <button
                  className="flex w-full items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => { onChange(''); setOpen(false); }}
                >
                  — No client —
                </button>
                {clients.map((c) => (
                  <button
                    key={c.id}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm hover:bg-muted"
                    onClick={() => { onChange(c.id); setOpen(false); }}
                  >
                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{clientDisplay(c)}</span>
                  </button>
                ))}
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── Project select popover ──────────────────────────────────────────────────

function ProjectSelectMenu({
  clientId,
  value,
  onChange,
}: {
  clientId: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);

  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const selected = clientProjects.find((p) => p.id === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selected ? selected.title : 'Select project...'}</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup className="flex w-72 flex-col gap-1 rounded-lg border bg-popover p-2 shadow-md">
            <div className="px-1 py-1.5 text-xs font-medium text-muted-foreground">Select Project</div>
            {clientProjects.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">No projects</p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                <button
                  className="flex w-full items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => { onChange(''); setOpen(false); }}
                >
                  — No project —
                </button>
                {clientProjects.map((p) => (
                  <button
                    key={p.id}
                    className="flex w-full items-center gap-2 px-2 py-2 text-sm hover:bg-muted"
                    onClick={() => { onChange(p.id); setOpen(false); }}
                  >
                    <span className="truncate">{p.title}</span>
                  </button>
                ))}
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

// ── Add row ─────────────────────────────────────────────────────────────────

export function InvoiceInlineRow({ mode, onSave, onCancel }: InvoiceInlineRowProps) {
  const { projects } = useProjects();
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Client is required');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      toast.error('Valid amount is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        clientId,
        projectId: projectId || undefined,
        amount: Number(amount),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      toast.success('Invoice created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/20 border-b border-border">
      <td className="w-8 border-r border-border py-2 pl-4 pr-2 text-muted-foreground text-sm">+</td>
      <td className="border-r border-border py-2 pr-2">
        <span className="text-muted-foreground text-xs font-mono">NEW</span>
      </td>
      <td className="border-r border-border py-2 pr-2">
        <ClientSelectMenu value={clientId} onChange={(id) => { setClientId(id); setProjectId(''); }} />
      </td>
      <td className="border-r border-border py-2 pr-2">
        {clientId ? (
          <ProjectSelectMenu clientId={clientId} value={projectId} onChange={setProjectId} />
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </td>
      <td className="border-r border-border py-2 pr-2">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-muted-foreground">
            Rp
          </span>
          <Input
            autoFocus
            value={amount ? Number(amount).toLocaleString('id-ID') : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setAmount(raw);
            }}
            inputMode="numeric"
            placeholder="0"
            className="h-8 w-32 pl-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onCancel();
            }}
          />
        </div>
      </td>
      <td className="border-r border-border py-2 pr-2">
        <span className="text-muted-foreground text-xs">14 days</span>
      </td>
      <td className="border-r border-border py-2 pr-2">
        <span className="rounded border border-yellow-500/20 bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-500">
          Draft
        </span>
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}