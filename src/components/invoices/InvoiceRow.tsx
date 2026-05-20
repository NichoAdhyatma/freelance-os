'use client';

import { Copy, Download, MoreHorizontal, Pencil, Plus, Send, Trash2, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { TableCell, TableRow } from '@/components/ui/table';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import { EditableCell } from '@/components/invoices/EditableCell';
import { useProjects } from '@/hooks/useProjects';
import { formatIDR } from '@/lib/utils';
import type { Invoice, InvoiceFormData, InvoiceStatus } from '@/types/invoice';
import type { Client } from '@/types/client';

interface InvoiceRowProps {
  invoice: Invoice;
  index: number;
  clients: Client[];
  projectTitle?: string;
  onSave: (id: string, data: Partial<InvoiceFormData>) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddNew: () => void;
  onAddClient: () => void;
  onDownloadPDF: () => void | Promise<void>;
  onSendWhatsApp: () => void;
  downloading?: boolean;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'paid', label: 'Paid', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'overdue', label: 'Overdue', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
];

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
  cancelled: 'bg-muted text-muted-foreground',
};

export function InvoiceRow({
  invoice,
  index,
  clients,
  projectTitle,
  onSave,
  onDelete,
  onDuplicate,
  onAddNew,
  onAddClient,
  onDownloadPDF,
  onSendWhatsApp,
  downloading,
}: InvoiceRowProps) {
  const dueDate = invoice.dueDate.toDate();
  const isOverdue = dueDate < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const statusColor = STATUS_COLORS[invoice.status] ?? 'bg-muted text-muted-foreground';

  const clientDisplay = (client: Client) =>
    client.company ? `${client.name} — ${client.company}` : client.name;

  const displayClient = invoice.clientId
    ? clients.find((c) => c.id === invoice.clientId)
    : null;

  const ClientCell = () => {
    const [open, setOpen] = useState(false);
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className="group relative flex items-center">
          <PopoverPrimitive.Trigger
            className="flex cursor-pointer items-center gap-1 px-2 py-1 -mx-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            {displayClient ? clientDisplay(displayClient) : '—'}
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </PopoverPrimitive.Trigger>
          <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
        </div>
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
                    onClick={() => { onSave(invoice.id, { clientId: undefined }).then(() => setOpen(false)); }}
                  >
                    — No client —
                  </button>
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      className="flex w-full items-center gap-2 px-2 py-2 text-sm hover:bg-muted"
                      onClick={() => { onSave(invoice.id, { clientId: c.id }).then(() => setOpen(false)); }}
                    >
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{clientDisplay(c)}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t border-border pt-1">
                <button
                  className="flex w-full items-center gap-2 px-2 py-2 text-sm text-primary hover:bg-muted"
                  onClick={() => { setOpen(false); onAddClient(); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add new client
                </button>
              </div>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  };

  // ── Project cell ─────────────────────────────────────────────────────────
  const { projects } = useProjects();
  const ProjectCell = () => {
    const [open, setOpen] = useState(false);
    const clientProjects = projects.filter((p) => p.clientId === invoice.clientId);
    const selected = clientProjects.find((p) => p.id === invoice.projectId);

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className="group relative flex items-center">
          <PopoverPrimitive.Trigger
            className="flex cursor-pointer items-center gap-1 px-2 py-1 -mx-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            <span className="whitespace-nowrap">{selected?.title || '—'}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
          </PopoverPrimitive.Trigger>
          <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
        </div>
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
                    onClick={() => { onSave(invoice.id, { projectId: undefined }).then(() => setOpen(false)); }}
                  >
                    — No project —
                  </button>
                  {clientProjects.map((p) => (
                    <button
                      key={p.id}
                      className="flex w-full items-center gap-2 px-2 py-2 text-sm hover:bg-muted"
                      onClick={() => { onSave(invoice.id, { projectId: p.id }).then(() => setOpen(false)); }}
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
  };

  const [editingAmount, setEditingAmount] = useState(false);
  const [editAmount, setEditAmount] = useState(String(invoice.amount));

  const handleSaveAmount = async () => {
    const num = Number(editAmount.replace(/\D/g, ''));
    if (isNaN(num) || num <= 0) { toast.error('Invalid amount'); return; }
    try {
      await onSave(invoice.id, { amount: num });
      setEditingAmount(false);
      toast.success('Amount updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const AmountCell = () =>
    editingAmount ? (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-sm text-muted-foreground">Rp</span>
        <Input
          autoFocus
          value={editAmount ? Number(editAmount).toLocaleString('id-ID') : ''}
          onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          className="h-8 w-36 pl-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleSaveAmount(); }
            if (e.key === 'Escape') { setEditingAmount(false); setEditAmount(String(invoice.amount)); }
          }}
          onBlur={handleSaveAmount}
        />
      </div>
    ) : (
      <div className="group relative flex items-center">
        <span
          className="flex cursor-pointer items-center gap-1 px-2 py-1 -mx-2 rounded text-sm whitespace-nowrap text-muted-foreground hover:text-foreground hover:bg-accent/50"
          onClick={() => { setEditAmount(String(invoice.amount)); setEditingAmount(true); }}
        >
          {formatIDR(invoice.amount)}
        </span>
        <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
      </div>
    );

  const DueDateCell = () => {
    const [open, setOpen] = useState(false);
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className="group relative flex items-center">
          <PopoverPrimitive.Trigger
            className="flex cursor-pointer items-center gap-1 px-2 py-1 -mx-2 rounded text-sm hover:text-foreground hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
              {format(dueDate, 'dd MMM yyyy', { locale: id })}
            </span>
          </PopoverPrimitive.Trigger>
          <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
        </div>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
            <PopoverPrimitive.Popup className="rounded-lg border bg-popover p-2 shadow-md">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={(d) => {
                  if (d) { onSave(invoice.id, { dueDate: d }); }
                  setOpen(false);
                }}
                disabled={(d) => d < new Date('2020-01-01')}
              />
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  };

  const StatusCell = () => {
    const [open, setOpen] = useState(false);
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className="group relative flex items-center">
          <PopoverPrimitive.Trigger
            className="flex cursor-pointer items-center px-2 py-1 -mx-2 rounded hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            <Badge className={statusColor} variant="outline">
              {STATUS_OPTIONS.find((o) => o.value === invoice.status)?.label ?? invoice.status}
            </Badge>
          </PopoverPrimitive.Trigger>
          <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
        </div>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner align="start" className="z-50">
            <PopoverPrimitive.Popup className="flex flex-col rounded-lg border bg-popover p-1 shadow-md">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
                  onClick={async () => {
                    setOpen(false);
                    try {
                      await onSave(invoice.id, { status: o.value });
                      toast.success('Status updated');
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : 'Failed to save');
                    }
                  }}
                >
                  <span className={`h-2 w-2 rounded-full ${o.color.replace(/.*bg-(\S+).*/g, 'bg-$1')}`} />
                  {o.label}
                </button>
              ))}
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  };

  return (
    <TableRow
      className="border-b border-border hover:bg-accent/50"
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Add New Invoice', icon: <Plus className="h-4 w-4" />, onClick: onAddNew },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
    >
      {/* # */}
      <TableCell className="w-12 border-r border-border py-3 pl-4 pr-2 text-muted-foreground text-sm">
        {index}
      </TableCell>

      {/* Invoice # */}
      <TableCell className="border-r border-border font-mono py-3 text-muted-foreground text-sm">
        {invoice.invoiceNumber}
      </TableCell>

      {/* Client */}
      <TableCell className="w-fit border-r border-border py-3">
        <ClientCell />
      </TableCell>

      {/* Project */}
      <TableCell className="w-fit border-r border-border py-3 text-sm">
        <ProjectCell />
      </TableCell>

      {/* Amount */}
      <TableCell className="w-fit border-r border-border py-3">
        <AmountCell />
      </TableCell>

      {/* Due Date */}
      <TableCell className="border-r border-border py-3">
        <DueDateCell />
      </TableCell>

      {/* Status */}
      <TableCell className="border-r border-border py-3">
        <StatusCell />
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3 pr-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Send WhatsApp"
            onClick={onSendWhatsApp}
          >
            <Send className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Download PDF"
            disabled={downloading}
            onClick={onDownloadPDF}
          >
            {downloading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="bg-background hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md border">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}