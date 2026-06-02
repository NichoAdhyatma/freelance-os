'use client';

import { ArrowRight, CalendarIcon, Check, ChevronDown, Copy, ExternalLink, FileText, Pencil, Plus, Trash2, User, X } from 'lucide-react';
import { format } from 'date-fns';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { openContextMenu } from '@/components/shared/RowContextMenu';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { getStatusStyle, PRIORITY_CONFIG, PRIORITY_LABELS } from '@/lib/tokens';
import type { Project, ProjectFormData, ProjectPriority } from '@/types/project';

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// ── Display row with per-cell click-to-edit ──────────────────────────────────

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

type CellKey = 'title' | 'client' | 'priority' | 'progress' | 'deadline';

export function ProjectRow({ project, index, onSave, onDelete, onDuplicate, onAddNew, onNavigate, onAddClient, onAddInvoice }: ProjectRowProps) {
  const { clients } = useClients();
  const [editingCell, setEditingCell] = useState<CellKey | null>(null);

  // Per-cell edit state
  const [editTitle, setEditTitle] = useState(project.title);
  const [editClient, setEditClient] = useState(project.clientId ?? '');
  const [editPriority, setEditPriority] = useState<ProjectPriority>(project.priority);
  const [editProgress, setEditProgress] = useState(project.progress ?? 0);
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(project.deadline?.toDate());

  // Original values for Escape revert
  const origRef = useRef({
    title: project.title,
    clientId: project.clientId ?? '',
    priority: project.priority,
    progress: project.progress ?? 0,
    deadline: project.deadline?.toDate(),
  });

  // Save one cell
  const saveCell = async (key: CellKey, overrideValue?: Partial<ProjectFormData>) => {
    setEditingCell(null);
    try {
      const data: Partial<ProjectFormData> = {};
      if (key === 'title') data.title = editTitle.trim();
      if (key === 'client') data.clientId = (overrideValue?.clientId ?? editClient) || undefined;
      if (key === 'priority') data.priority = (overrideValue?.priority as ProjectPriority) ?? editPriority;
      if (key === 'progress') data.progress = editProgress;
      if (key === 'deadline') data.deadline = overrideValue?.deadline ?? editDeadline;
      await onSave(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  // Revert one cell to original
  const revertCell = (key: CellKey) => {
    setEditingCell(null);
    if (key === 'title') setEditTitle(origRef.current.title);
    if (key === 'client') setEditClient(origRef.current.clientId);
    if (key === 'priority') setEditPriority(origRef.current.priority);
    if (key === 'progress') setEditProgress(origRef.current.progress);
    if (key === 'deadline') setEditDeadline(origRef.current.deadline);
  };

  // ── Title ──────────────────────────────────────────────────────────────
  const TitleCell = () =>
    editingCell === 'title' ? (
      <Input
        autoFocus
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className="h-8 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); saveCell('title'); }
          if (e.key === 'Escape') { e.preventDefault(); revertCell('title'); }
        }}
        onBlur={() => saveCell('title')}
      />
    ) : (
      <div className="group relative flex items-center">
        <span
          className="flex cursor-pointer items-center gap-1 px-2 py-1 -mx-2 rounded font-medium hover:text-primary hover:bg-accent/50"
          onClick={() => { setEditTitle(project.title); setEditingCell('title'); }}
        >
          {project.title}
        </span>
        <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
      </div>
    );

  // ── Client ────────────────────────────────────────────────────────────
  const clientDisplay = (client: typeof clients[number]) =>
    client.company ? `${client.name} — ${client.company}` : client.name;

  const displayClient = project.clientId
    ? clients.find((c) => c.id === project.clientId)
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
                      onClick={() => { setEditClient(''); onSave({ clientId: undefined }).then(() => setOpen(false)); }}
                    >
                      — No client —
                    </button>
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        className="flex w-full items-center gap-2 px-2 py-2 text-sm hover:bg-muted"
                        onClick={() => { setEditClient(c.id); onSave({ clientId: c.id }).then(() => setOpen(false)); }}
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
        </div>
      </PopoverPrimitive.Root>
    );
  };

  // ── Priority ──────────────────────────────────────────────────────────
  const PriorityCell = () => {
    const [open, setOpen] = useState(false);
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className="group relative flex items-center">
          <PopoverPrimitive.Trigger
            className="flex cursor-pointer items-center px-2 py-1 -mx-2 rounded hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            <StatusBadge
                  config={PRIORITY_CONFIG}
                  status={project.priority}
                  label={PRIORITY_LABELS[project.priority as keyof typeof PRIORITY_LABELS]}
                  size="sm"
                />
          </PopoverPrimitive.Trigger>
          <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
              <PopoverPrimitive.Popup className="flex flex-col rounded-lg border bg-popover p-1 shadow-md">
                {PRIORITY_OPTIONS.map((o) => {
                  const dotStyle = getStatusStyle(PRIORITY_CONFIG, o.value);
                  return (
                    <button
                      key={o.value}
                      className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
                      onClick={() => { setOpen(false); saveCell('priority', { priority: o.value as ProjectPriority }); }}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dotStyle.style?.background }} />
                      {o.label}
                    </button>
                  );
                })}
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </div>
      </PopoverPrimitive.Root>
    );
  };

  const ProgressCell = () =>
    editingCell === 'progress' ? (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={String(editProgress)}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            setEditProgress(isNaN(n) ? 0 : Math.min(100, Math.max(0, n)));
          }}
          inputMode="numeric"
          className="h-8 w-14 text-center text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveCell('progress'); }
            if (e.key === 'Escape') { e.preventDefault(); revertCell('progress'); }
          }}
          onBlur={() => saveCell('progress')}
        />
        <Progress value={editProgress} className="h-2 w-16" />
      </div>
    ) : (
      <div className="group relative flex items-center">
        <div className="flex items-center gap-2">
          <Progress value={project.progress ?? 0} className="h-2 w-20" />
          <span
            className="cursor-pointer px-2 py-1 -mx-2 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => { setEditProgress(project.progress ?? 0); setEditingCell('progress'); }}
          >
            {project.progress ?? 0}%
          </span>
        </div>
        <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
      </div>
    );

  // ── Deadline ────────────────────────────────────────────────────────
  const deadline = project.deadline?.toDate();
  const isOverdue = deadline && deadline < new Date() && project.status !== 'done';
  const DeadlineCell = () => {
    const [open, setOpen] = useState(false);
    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <div className="group relative flex items-center">
          <PopoverPrimitive.Trigger
            className="flex cursor-pointer items-center gap-1 px-2 py-1 -mx-2 rounded text-sm hover:text-foreground hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            {isOverdue && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
            <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
              {deadline ? format(deadline, 'dd MMM yyyy') : '—'}
            </span>
          </PopoverPrimitive.Trigger>
          <Pencil className="invisible group-hover:visible mr-1 h-3 w-3 text-muted-foreground shrink-0" />
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
              <PopoverPrimitive.Popup className="rounded-lg border bg-popover p-2 shadow-md">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => { setOpen(false); saveCell('deadline', { deadline: d }); }}
                  disabled={(d) => d < new Date('2020-01-01')}
                />
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </div>
      </PopoverPrimitive.Root>
    );
  };

  // ── Invoice ─────────────────────────────────────────────────────────────────
  const router = useRouter();
  const InvoiceCell = () => {
    const { invoices } = useInvoices();
    // Filter invoices that reference this project via projectId
    const projectInvoices = invoices.filter((i) => i.projectId === project.id);

    if (projectInvoices.length === 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-primary"
          onClick={() => router.push('/dashboard/finance')}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Go to Finance
        </Button>
      );
    }

    return (
      <div className="flex flex-wrap gap-1">
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
    );
  };

  return (
    <TableRow
      className="border-b border-border hover:bg-accent/50"
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu(e.clientX, e.clientY, [
          { label: 'Add New Project', icon: <Plus className="h-4 w-4" />, onClick: onAddNew },
          { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onClick: onDuplicate },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true, onClick: onDelete },
        ]);
      }}
    >
      <TableCell className="w-8 border-r border-border py-3 pl-4 pr-2 text-muted-foreground text-sm">{index}</TableCell>
      <TableCell className="w-fit border-r border-border py-3 pr-2"><TitleCell /></TableCell>
      <TableCell className="w-fit border-r border-border py-3 pr-2"><ClientCell /></TableCell>
      <TableCell className="w-fit border-r border-border py-3 pr-2"><PriorityCell /></TableCell>
      <TableCell className="border-r border-border py-3 pr-2"><ProgressCell /></TableCell>
      <TableCell className="border-r border-border py-3 pr-2"><DeadlineCell /></TableCell>
      <TableCell className="border-r border-border py-3 pr-2"><InvoiceCell /></TableCell>
      <TableCell className="py-3 pr-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onPointerDown={(e) => { e.preventDefault(); onNavigate(); }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
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
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{selected ? clientDisplay(selected) : 'Select client'}</span>
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
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
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);

  const selected = invoices.find((i) => i.id === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex h-8 w-full cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-2 text-sm text-muted-foreground hover:bg-muted"
        onClick={() => setOpen(true)}
      >
        <FileText className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {selected ? `${selected.invoiceNumber} · Rp ${selected.amount.toLocaleString('id-ID')}` : 'No invoice'}
        </span>
        <ChevronDown className="ml-auto h-3 w-3 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup className="flex w-72 flex-col gap-1 rounded-lg border bg-popover p-2 shadow-md">
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
                {invoices.map((inv) => {
                  const usedBy = inv.projectId ? projects.find((p) => p.id === inv.projectId) : null;
                  return (
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
                      {usedBy && (
                        <Badge variant="secondary" className="ml-5 text-xs">
                          Used in {usedBy.title}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
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
  const titleRef = useRef<HTMLInputElement>(null);

  // Auto-focus title
  useRef(() => { titleRef.current?.focus(); });

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
    <TableRow className="bg-muted/20 border-b border-border">
      <TableCell className="w-8 border-r border-border py-2 pl-4 pr-2 text-muted-foreground text-sm">+</TableCell>
      <TableCell className="border-r border-border py-2 pr-2">
        <Input
          ref={titleRef}
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
      <TableCell className="border-r border-border py-2 pr-2">
        <ClientSelectPopover
          clientId={clientId}
          onChange={(id) => setClientId(id)}
          onAddClient={onAddClient}
        />
      </TableCell>
      <TableCell className="border-r border-border py-2 pr-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="border-r border-border py-2 pr-2">
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
      <TableCell className="border-r border-border py-2 pr-2">
        <PopoverPrimitive.Root>
          <PopoverPrimitive.Trigger
            className="flex h-8 w-full cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-muted"
            onClick={() => {}}
          >
            <CalendarIcon className="h-3 w-3 shrink-0" />
            {deadline ? format(deadline, 'dd MMM yyyy') : 'Pick date'}
          </PopoverPrimitive.Trigger>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
              <PopoverPrimitive.Popup className="rounded-lg border bg-popover p-2 shadow-md">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => setDeadline(d)}
                  disabled={(d) => d < new Date('2020-01-01')}
                />
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </TableCell>
      <TableCell className="border-r border-border py-2 pr-2">
        <InvoiceSelectPopover
          value={invoiceId}
          onChange={setInvoiceId}
        />
      </TableCell>
      <TableCell className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave} disabled={saving}>
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
