'use client';

import { Copy, Download, Eye, Plus, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';
import { toast } from 'sonner';

import { EditableRow, type CellDef, useEditableRow } from '@/components/shared/EditableRow';
import { ClientSelectCell } from '@/components/shared/EditableRow/cells/SelectCell';
import { PopoverCell } from '@/components/shared/EditableRow/cells/PopoverCell';
import { SelectCell } from '@/components/shared/EditableRow/cells/SelectCell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import { useProjects } from '@/hooks/useProjects';
import { formatIDR } from '@/lib/utils';
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
  downloading,
}: InvoiceRowProps) {
  const { projects } = useProjects();
  const dueDate = invoice.dueDate.toDate();
  const isOverdue = dueDate < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';

  const [editingCell, setEditingCell] = useState<CellKey | null>(null);
  const [editAmount, setEditAmount] = useState(String(invoice.amount));

  const { isEditing, startEditing, revertCell } = useEditableRow<CellKey>({
    editingCell,
    setEditingCell,
    onSwitchCell: async (key) => {
      if (key === 'amount') {
        const num = Number(editAmount.replace(/\D/g, ''));
        if (!isNaN(num) && num > 0) {
          await onSave(invoice.id, { amount: num });
        }
      }
    },
    resetEditState: (key) => {
      if (key === 'amount') setEditAmount(String(invoice.amount));
    },
  });

  const clientDisplay = (c: Client) => c.company ? `${c.name} — ${c.company}` : c.name;
  const displayClient = invoice.clientId ? clients.find((c) => c.id === invoice.clientId) : null;
  const clientProjects = projects.filter((p) => p.clientId === invoice.clientId);
  const displayProject = invoice.projectId ? clientProjects.find((p) => p.id === invoice.projectId) : null;

  const handleSaveAmount = async () => {
    const num = Number(editAmount.replace(/\D/g, ''));
    if (isNaN(num) || num <= 0) { toast.error('Invalid amount'); return; }
    await onSave(invoice.id, { amount: num });
    setEditingCell(null);
  };

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
          onTriggerEdit={() => startEditing('client')}
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
          onTriggerEdit={() => startEditing('project')}
        />
      ),
    },
    {
      key: 'amount',
      width: INVOICE_COLUMNS.amount,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
          {formatIDR(invoice.amount)}
        </div>
      ),
      edit: (
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
              if (e.key === 'Escape') { e.preventDefault(); revertCell('amount'); }
            }}
            onBlur={handleSaveAmount}
          />
        </div>
      ),
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
          onTriggerEdit={() => startEditing('dueDate')}
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
          onTriggerEdit={() => startEditing('status')}
        />
      ),
    },
  ];

  return (
    <EditableRow
      cells={cells}
      index={index}
      showActions={showActions}
      isEditing={isEditing}
      onCellClick={startEditing}
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
