'use client';

import { format } from 'date-fns';
import { ArrowRight, CalendarIcon, Check, Copy, ExternalLink, FileText, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { EditableRow, type CellDef, useEditableRow } from '@/components/shared/EditableRow';
import { ClientSelectCell } from '@/components/shared/EditableRow/cells/SelectCell';
import { PopoverCell } from '@/components/shared/EditableRow/cells/PopoverCell';
import { ProgressCell, ProgressDisplay } from '@/components/shared/EditableRow/cells/ProgressCell';
import { TextCell } from '@/components/shared/EditableRow/cells/TextCell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { getStatusStyle, PRIORITY_CONFIG, PRIORITY_LABELS } from '@/lib/tokens';
import type { Project, ProjectFormData, ProjectPriority } from '@/types/project';

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// ── Column Width Config ────────────────────────────────────────────────────────
export const PROJECT_COLUMNS = {
  index: 'w-8',
  title: 'w-60',
  client: 'w-44',
  priority: 'w-24',
  progress: 'w-32',
  deadline: 'w-36',
  invoice: 'w-36',
  actions: 'w-10',
} as const;
export type ProjectColumnKey = keyof typeof PROJECT_COLUMNS;

type CellKey = 'title' | 'client' | 'priority' | 'progress' | 'deadline' | 'invoice';

interface ProjectRowProps {
  project: Project;
  index: number;
  onSave: (data: Partial<ProjectFormData> & { projectId?: string | null }) => Promise<void>;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddNew: () => void;
  onNavigate: () => void;
  onAddClient: () => void;
  onAddInvoice: (projectId: string) => void;
}

export function ProjectRow({
  project,
  index,
  onSave,
  onDelete,
  onDuplicate,
  onAddNew,
  onNavigate,
  onAddClient,
  onAddInvoice,
}: ProjectRowProps) {
  const { clients } = useClients();
  const { invoices } = useInvoices();
  const router = useRouter();

  const [editingCell, setEditingCell] = useState<CellKey | null>(null);
  const [editTitle, setEditTitle] = useState(project.title);
  const [editProgress, setEditProgress] = useState(project.progress ?? 0);

  const { isEditing, startEditing, revertCell } = useEditableRow<CellKey>({
    editingCell,
    setEditingCell,
    onSwitchCell: async (key) => {
      const data: Partial<ProjectFormData> = {};
      if (key === 'title') data.title = editTitle.trim();
      if (key === 'progress') data.progress = editProgress;
      await onSave(data);
    },
    resetEditState: (key) => {
      if (key === 'title') setEditTitle(project.title);
      if (key === 'progress') setEditProgress(project.progress ?? 0);
    },
  });

  const deadline = project.deadline?.toDate();
  const isOverdue = deadline && deadline < new Date() && project.status !== 'done';
  const clientDisplay = (c: typeof clients[number]) =>
    c.company ? `${c.name} — ${c.company}` : c.name;
  const displayClient = project.clientId ? clients.find((c) => c.id === project.clientId) : null;
  const projectInvoices = invoices.filter((i) => i.projectId === project.id);

  const handleSaveTitle = async (value: string) => {
    await onSave({ title: value });
    setEditingCell(null);
  };

  const handleSaveProgress = async (value: number) => {
    await onSave({ progress: value });
    setEditingCell(null);
  };

  const cells: CellDef<CellKey>[] = [
    {
      key: 'title',
      width: PROJECT_COLUMNS.title,
      display: (
        <div className="w-full truncate px-2 py-1 rounded font-medium hover:text-primary hover:bg-accent/50">
          {project.title}
        </div>
      ),
      edit: (
        <TextCell
          value={editTitle}
          onSave={handleSaveTitle}
          onRevert={() => revertCell('title')}
          className="h-8 text-sm"
        />
      ),
    },
    {
      key: 'client',
      width: PROJECT_COLUMNS.client,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
          {displayClient ? clientDisplay(displayClient) : '—'}
        </div>
      ),
      edit: (
        <ClientSelectCell
          value={project.clientId ?? ''}
          clients={clients}
          onChange={(v) => onSave({ clientId: v || undefined }).then(() => setEditingCell(null))}
          onAddNew={onAddClient}
          onTriggerEdit={() => startEditing('client')}
        />
      ),
    },
    {
      key: 'priority',
      width: PROJECT_COLUMNS.priority,
      display: (
        <div className="px-2 py-1">
          <StatusBadge
            config={PRIORITY_CONFIG}
            status={project.priority}
            label={PRIORITY_LABELS[project.priority as keyof typeof PRIORITY_LABELS]}
            size="sm"
          />
        </div>
      ),
      edit: (
        <Select
          value={project.priority}
          onValueChange={(v) => onSave({ priority: v as ProjectPriority }).then(() => setEditingCell(null))}
        >
          <SelectTrigger hideIcon className="h-7 w-full cursor-pointer border-0 bg-transparent shadow-none p-0 [&]:justify-start [&]:gap-0 data-[state=open]:bg-accent/50" onClick={() => startEditing('priority')}>
            <StatusBadge
              config={PRIORITY_CONFIG}
              status={project.priority}
              label={PRIORITY_LABELS[project.priority as keyof typeof PRIORITY_LABELS]}
              size="sm"
            />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => {
              const dotStyle = getStatusStyle(PRIORITY_CONFIG, o.value);
              return (
                <SelectItem key={o.value} value={o.value} className="gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: dotStyle.style?.background }} />
                  {o.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'progress',
      width: PROJECT_COLUMNS.progress,
      display: <ProgressDisplay value={project.progress ?? 0} />,
      edit: null,
      editable: false,
    },
    {
      key: 'deadline',
      width: PROJECT_COLUMNS.deadline,
      display: (
        <div className="w-full truncate px-2 py-1 rounded text-sm hover:text-foreground hover:bg-accent/50">
          {isOverdue && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 inline-block mr-1" />}
          <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
            {deadline ? format(deadline, 'dd MMM yyyy') : '—'}
          </span>
        </div>
      ),
      edit: (
        <PopoverCell
          className="flex flex-1 cursor-pointer items-center gap-1 px-2 py-1 rounded text-sm hover:text-foreground hover:bg-accent/50"
          trigger={
            <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
              {deadline ? format(deadline, 'dd MMM yyyy') : '—'}
            </span>
          }
          content={
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(d) => {
                if (d) onSave({ deadline: d });
                setEditingCell(null);
              }}
              disabled={(d) => d < new Date('2020-01-01')}
            />
          }
          onTriggerEdit={() => startEditing('deadline')}
        />
      ),
    },
    {
      key: 'invoice',
      width: PROJECT_COLUMNS.invoice,
      display: (
        projectInvoices.length > 0 ? (
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {projectInvoices.map((inv) => (
              <Badge
                key={inv.id}
                variant="outline"
                className="cursor-pointer text-xs font-mono hover:bg-accent"
                onClick={() => router.push('/dashboard/finance')}
              >
                {inv.invoiceNumber}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
      edit: null,
      editable: false,
    },
  ];

  return (
    <EditableRow
      cells={cells}
      index={index}
      isEditing={isEditing}
      onCellClick={startEditing}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Add New Project', icon: <Plus className="h-4 w-4" />, onClick: onAddNew },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
      actions={
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onPointerDown={(e) => { e.preventDefault(); onNavigate(); }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      }
    />
  );
}

// ── Client select popover ───────────────────────────────────────────────────

function ClientSelectPopover({
  clientId,
  onChange,
  onAddClient,
}: {
  clientId: string;
  onChange: (id: string) => void;
  onAddClient: () => void;
}) {
  const { clients } = useClients();
  const [open, setOpen] = useState(false);

  const clientDisplay = (client: typeof clients[number]) =>
    client.company ? `${client.name} — ${client.company}` : client.name;

  const selected = clients.find((c) => c.id === clientId);

  return (
    <PopoverCell
      className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-muted"
      trigger={
        <>
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{selected ? clientDisplay(selected) : 'Select client'}</span>
        </>
      }
      content={
        <div className="flex w-72 flex-col gap-1 p-2">
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
          <div className="border-t border-border pt-1">
            <button
              className="flex w-full items-center gap-2 px-2 py-2 text-sm text-primary hover:bg-muted"
              onClick={() => { setOpen(false); onAddClient(); }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add new client
            </button>
          </div>
        </div>
      }
    />
  );
}

// ── Invoice select popover ───────────────────────────────────────────────────

function InvoiceSelectPopover({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { invoices } = useInvoices();
  const [open, setOpen] = useState(false);

  const selected = invoices.find((i) => i.id === value);

  return (
    <PopoverCell
      className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-muted"
      trigger={
        <>
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {selected ? `${selected.invoiceNumber} · Rp ${selected.amount.toLocaleString('id-ID')}` : 'No invoice'}
          </span>
        </>
      }
      content={
        <div className="flex w-72 flex-col gap-1 p-2">
          <div className="px-1 py-1.5 text-xs font-medium text-muted-foreground">Select Invoice</div>
          {invoices.length === 0 ? (
            <p className="px-2 py-2 text-xs text-muted-foreground">No invoices yet</p>
          ) : (
            <div className="max-h-56 overflow-y-auto">
              <button
                className="flex w-full items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-muted"
                onClick={() => { onChange(''); setOpen(false); }}
              >
                — No invoice —
              </button>
              {invoices.map((inv) => (
                <button
                  key={inv.id}
                  className="flex w-full flex-col items-start gap-0.5 px-2 py-2 text-sm hover:bg-muted"
                  onClick={() => { onChange(inv.id); setOpen(false); }}
                >
                  <div className="flex w-full items-center gap-2">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-mono text-xs">{inv.invoiceNumber}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Rp {inv.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}

// ── Add row (full editable) ────────────────────────────────────────────────

interface ProjectAddRowProps {
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  pendingClientId?: string | null;
  onAddClient: () => void;
}

export function ProjectAddRow({ onSave, onCancel, pendingClientId, onAddClient }: ProjectAddRowProps) {
  const { clients } = useClients();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), clientId: clientId || undefined, invoiceId: invoiceId || undefined, priority, progress, deadline, status: 'backlog' });
      toast.success('Project created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <TableRow className="bg-muted/20 border-b border-border h-12">
      <TableCell className="w-8 border-r border-border py-2 pl-4 pr-2 text-muted-foreground text-sm shrink-0">+</TableCell>
      <TableCell className={`${PROJECT_COLUMNS.title} border-r border-border py-2 pr-2 shrink-0`}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project name..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </TableCell>
      <TableCell className={`${PROJECT_COLUMNS.client} border-r border-border py-2 pr-2 shrink-0`}>
        <ClientSelectPopover clientId={clientId} onChange={setClientId} onAddClient={onAddClient} />
      </TableCell>
      <TableCell className={`${PROJECT_COLUMNS.priority} border-r border-border py-2 pr-2 shrink-0`}>
        <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
          <SelectTrigger className="h-8 text-xs"><span>{PRIORITY_LABELS[priority]}</span></SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className={`${PROJECT_COLUMNS.progress} border-r border-border py-2 pr-2 shrink-0`}>
        <Input
          value={String(progress)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setProgress(isNaN(n) ? 0 : Math.min(100, Math.max(0, n)));
          }}
          inputMode="numeric"
          className="h-8 w-14 text-center text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }}
        />
      </TableCell>
      <TableCell className={`${PROJECT_COLUMNS.deadline} border-r border-border py-2 pr-2 shrink-0`}>
        <PopoverCell
          className="flex h-8 w-full cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-muted"
          trigger={
            <>
              <span className="shrink-0"><CalendarIcon className="h-3 w-3" /></span>
              {deadline ? format(deadline, 'dd MMM yyyy') : 'Pick date'}
            </>
          }
          content={
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(d) => setDeadline(d)}
              disabled={(d) => d < new Date('2020-01-01')}
            />
          }
        />
      </TableCell>
      <TableCell className={`${PROJECT_COLUMNS.invoice} border-r border-border py-2 pr-2 shrink-0`}>
        <InvoiceSelectPopover value={invoiceId} onChange={setInvoiceId} />
      </TableCell>
      <TableCell className={`${PROJECT_COLUMNS.actions} py-2 pr-4 shrink-0`}>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave} disabled={saving}>
            <span className="text-green-500"><Check className="h-3.5 w-3.5" /></span>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <span className="text-muted-foreground"><X className="h-3.5 w-3.5" /></span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
