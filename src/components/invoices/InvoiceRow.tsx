'use client';

import { Copy, Download, Eye, Plus, Send, Trash2, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { EditableRow, type CellDef } from '@/components/shared/EditableRow';
import { ClientSelectCell } from '@/components/shared/EditableRow/cells/SelectCell';
import { PopoverCell } from '@/components/shared/EditableRow/cells/PopoverCell';
import { SelectCell } from '@/components/shared/EditableRow/cells/SelectCell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { TableCell, TableRow } from '@/components/ui/table';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import { useProjects } from '@/hooks/useProjects';
import { getStatusStyle, INVOICE_STATUS_CONFIG, INVOICE_STATUS_LABELS } from '@/lib/tokens';
import type { Invoice, InvoiceFormData, InvoiceStatus } from '@/types/invoice';
import type { Client } from '@/types/client';

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

// ── Column Width Config ────────────────────────────────────────────────────────
export const INVOICE_COLUMNS = {
  index: 'w-8',
  invoiceNumber: 'w-32',
  client: 'w-44',
  project: 'w-36',
  amount: 'w-36',
  dueDate: 'w-32',
  status: 'w-24',
  actions: 'w-24',
} as const;

interface InvoiceRowProps {
  invoice: Invoice;
  index: number;
  showActions?: boolean;
  clients: Client[];
  projectTitle?: string;
  onSave: (id: string, data: Partial<InvoiceFormData>) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddNew: () => void;
  onAddClient: () => void;
  onDownloadPDF: () => void | Promise<void>;
  onSendWhatsApp: () => void;
  onPreview: () => void;
  onEditItems: () => void;
  downloading?: boolean;
}

type CellKey = 'invoiceNumber' | 'client' | 'project' | 'amount' | 'dueDate' | 'status';

export function InvoiceRow({
  invoice,
  index,
  showActions = true,
  clients,
  projectTitle,
  onSave,
  onDelete,
  onDuplicate,
  onAddNew,
  onAddClient,
  onDownloadPDF,
  onSendWhatsApp,
  onPreview,
  onEditItems,
  downloading,
}: InvoiceRowProps) {
  const { projects } = useProjects();
  const router = useRouter();
  const dueDate = invoice.dueDate.toDate();
  const isOverdue = dueDate < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';

  const [editingCell, setEditingCell] = useState<CellKey | null>(null);

  const handleCellClick = (key: CellKey) => {
    if (key === 'amount') {
      onEditItems();
      return;
    }
    setEditingCell(key);
  };

  const clientDisplay = (c: Client) => c.company ? `${c.name} — ${c.company}` : c.name;
  const displayClient = invoice.clientId ? clients.find((c) => c.id === invoice.clientId) : null;
  const clientProjects = projects.filter((p) => p.clientId === invoice.clientId);
  const displayProject = invoice.projectId ? clientProjects.find((p) => p.id === invoice.projectId) : null;

  const cells: CellDef<CellKey>[] = [
    {
      key: 'invoiceNumber',
      width: INVOICE_COLUMNS.invoiceNumber,
      display: (
        <div className="w-full truncate px-2 py-1 rounded font-mono text-xs font-medium">
          {invoice.invoiceNumber}
        </div>
      ),
      edit: null,
      editable: false,
    },
    {
      key: 'client',
      width: INVOICE_COLUMNS.client,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
          {displayClient ? clientDisplay(displayClient) : '—'}
        </div>
      ),
      edit: (
        <ClientSelectCell
          value={invoice.clientId ?? ''}
          clients={clients}
          onChange={(v) => onSave(invoice.id, { clientId: v || undefined }).then(() => setEditingCell(null))}
          onAddNew={onAddClient}
          onTriggerEdit={() => setEditingCell('client')}
        />
      ),
    },
    {
      key: 'project',
      width: INVOICE_COLUMNS.project,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
          {displayProject?.title || '—'}
        </div>
      ),
      edit: (
        <SelectCell
          value={invoice.projectId ?? ''}
          options={[
            { value: '', label: '— No project —' },
            ...clientProjects.map((p) => ({ value: p.id, label: p.title })),
          ]}
          onChange={(v) => onSave(invoice.id, { projectId: v || undefined }).then(() => setEditingCell(null))}
          onTriggerEdit={() => setEditingCell('project')}
        />
      ),
    },
    {
      key: 'amount',
      width: INVOICE_COLUMNS.amount,
      display: (
        <div className="w-full flex items-center gap-1.5 truncate px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
          <span className="truncate">
            {invoice.items?.length ? `${invoice.items.length} item${invoice.items.length !== 1 ? 's' : ''}` : '0 items'}
          </span>
          <ArrowUpRight className="h-3 w-3 shrink-0 opacity-50" />
        </div>
      ),
      edit: null,
      editable: true,
    },
    {
      key: 'dueDate',
      width: INVOICE_COLUMNS.dueDate,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-sm hover:text-foreground hover:bg-accent/50">
          <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
            {format(dueDate, 'dd MMM yyyy', { locale: id })}
          </span>
        </div>
      ),
      edit: (
        <PopoverCell
          className="flex flex-1 cursor-pointer items-center gap-1 px-2 py-1 rounded text-sm hover:text-foreground hover:bg-accent/50"
          trigger={
            <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
              {format(dueDate, 'dd MMM yyyy', { locale: id })}
            </span>
          }
          content={
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(d) => {
                if (d) onSave(invoice.id, { dueDate: d });
                setEditingCell(null);
              }}
              disabled={(d) => d < new Date('2020-01-01')}
            />
          }
          onTriggerEdit={() => setEditingCell('dueDate')}
        />
      ),
    },
    {
      key: 'status',
      width: INVOICE_COLUMNS.status,
      display: (
        <div className="px-2 py-1">
          <StatusBadge
            config={INVOICE_STATUS_CONFIG}
            status={invoice.status}
            label={INVOICE_STATUS_LABELS[invoice.status as keyof typeof INVOICE_STATUS_LABELS] ?? invoice.status}
            size="sm"
          />
        </div>
      ),
      edit: (
        <SelectCell
          value={invoice.status}
          options={STATUS_OPTIONS.map((o) => {
            const dotStyle = getStatusStyle(INVOICE_STATUS_CONFIG, o.value);
            return { value: o.value, label: o.label, style: { background: dotStyle.style?.background } };
          })}
          onChange={(v) => onSave(invoice.id, { status: v as InvoiceStatus }).then(() => setEditingCell(null))}
          onTriggerEdit={() => setEditingCell('status')}
        />
      ),
    },
  ];

  return (
    <EditableRow
      cells={cells}
      index={index}
      showActions={showActions}
      isEditing={(key) => editingCell === key}
      onCellClick={handleCellClick}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Add New Invoice', icon: <Plus className="h-4 w-4" />, onClick: onAddNew },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
      actions={
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Preview Invoice" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Send WhatsApp" onClick={onSendWhatsApp}>
            <Send className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download PDF" disabled={downloading} onClick={onDownloadPDF}>
            {downloading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      }
    />
  );
}
