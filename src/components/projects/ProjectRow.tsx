'use client';

import { ArrowRight, CalendarIcon, Check, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { useClients } from '@/hooks/useClients';
import { formatIDR } from '@/lib/utils';
import type { Project, ProjectFormData, ProjectPriority } from '@/types/project';

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

type CellKey = 'title' | 'client' | 'priority' | 'budget' | 'progress' | 'deadline';

interface ProjectRowProps {
  project: Project;
  index: number;
  onSave: (data: Partial<ProjectFormData>) => Promise<void>;
  onDelete: () => void;
  onNavigate: () => void;
  pendingClientId?: string | null;
  onAddingClientChange?: (adding: boolean) => void;
}

export function ProjectRow({ project, index, onSave, onDelete, onNavigate, pendingClientId, onAddingClientChange }: ProjectRowProps) {
  const { clients } = useClients();
  const [editingCell, setEditingCell] = useState<CellKey | null>(null);

  // Local state for the cell being edited
  const [editTitle, setEditTitle] = useState(project.title);
  const [editClient, setEditClient] = useState(project.clientId ?? '');
  const [editPriority, setEditPriority] = useState<ProjectPriority>(project.priority);
  const [editBudget, setEditBudget] = useState<string>(project.budget ? String(project.budget) : '');
  const [editProgress, setEditProgress] = useState(project.progress ?? 0);
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(project.deadline?.toDate());

  // Original values for revert on Escape
  const origRef = useRef({ title: project.title, clientId: project.clientId ?? '', priority: project.priority, budget: project.budget ?? 0, progress: project.progress ?? 0, deadline: project.deadline?.toDate() });

  // Sync when pendingClientId comes from client creation
  useEffect(() => {
    if (pendingClientId && pendingClientId !== editClient) {
      setEditClient(pendingClientId);
      onSave({ clientId: pendingClientId }).then(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingClientId]);

  // Save a specific cell
  const saveCell = async (key: CellKey) => {
    setEditingCell(null);
    try {
      const data: Partial<ProjectFormData> = {};
      if (key === 'title') data.title = editTitle.trim();
      if (key === 'client') data.clientId = editClient || undefined;
      if (key === 'priority') data.priority = editPriority;
      if (key === 'budget') data.budget = editBudget ? Number(editBudget) : undefined;
      if (key === 'progress') data.progress = editProgress;
      if (key === 'deadline') data.deadline = editDeadline;
      await onSave(data);
      toast.success('Saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  // Revert a cell to original value
  const revertCell = (key: CellKey) => {
    setEditingCell(null);
    if (key === 'title') setEditTitle(origRef.current.title);
    if (key === 'client') setEditClient(origRef.current.clientId);
    if (key === 'priority') setEditPriority(origRef.current.priority);
    if (key === 'budget') setEditBudget(origRef.current.budget ? String(origRef.current.budget) : '');
    if (key === 'progress') setEditProgress(origRef.current.progress);
    if (key === 'deadline') setEditDeadline(origRef.current.deadline);
  };

  // ── Cell render helpers ────────────────────────────────────────────

  const TitleCell = () => {
    if (editingCell === 'title') {
      return (
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
      );
    }
    return (
      <span className="block cursor-pointer truncate font-medium hover:text-primary" onClick={() => setEditingCell('title')}>
        {project.title}
      </span>
    );
  };

  const ClientCell = () => {
    const client = clients.find((c) => c.id === editClient);
    if (editingCell === 'client') {
      return (
        <div className="flex items-center gap-1">
          <Select value={editClient} onValueChange={(v) => { setEditClient(v ?? ''); }}>
            <SelectTrigger className="h-8 w-full min-w-[120px] text-sm">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onAddingClientChange && (
            <Button type="button" variant="outline" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={() => onAddingClientChange?.(true)}>
              <span className="text-xs">+</span>
            </Button>
          )}
        </div>
      );
    }
    return (
      <span className="block cursor-pointer truncate text-sm text-muted-foreground hover:text-foreground" onClick={() => setEditingCell('client')}>
        {client?.name ?? '—'}
      </span>
    );
  };

  const PriorityCell = () => {
    if (editingCell === 'priority') {
      return (
        <Select value={editPriority} onValueChange={(v) => { setEditPriority(v as ProjectPriority); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Badge className={PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.medium} onClick={() => setEditingCell('priority')}>
        {PRIORITY_LABELS[project.priority]}
      </Badge>
    );
  };

  const BudgetCell = () => {
    if (editingCell === 'budget') {
      return (
        <Input
          value={editBudget}
          onChange={(e) => setEditBudget(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          className="h-8 w-28 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); saveCell('budget'); }
            if (e.key === 'Escape') { e.preventDefault(); revertCell('budget'); }
          }}
          onBlur={() => saveCell('budget')}
        />
      );
    }
    return (
      <span className="cursor-pointer text-sm text-muted-foreground hover:text-foreground" onClick={() => setEditingCell('budget')}>
        {project.budget ? formatIDR(project.budget) : '—'}
      </span>
    );
  };

  const ProgressCell = () => {
    if (editingCell === 'progress') {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={String(editProgress)}
            onChange={(e) => {
              const num = parseInt(e.target.value, 10);
              setEditProgress(isNaN(num) ? 0 : Math.min(100, Math.max(0, num)));
            }}
            inputMode="numeric"
            className="h-8 w-14 text-sm text-center"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); saveCell('progress'); }
              if (e.key === 'Escape') { e.preventDefault(); revertCell('progress'); }
            }}
            onBlur={() => saveCell('progress')}
          />
          <Progress value={editProgress} className="h-2 w-16" />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Progress value={project.progress ?? 0} className="h-2 w-20" />
        <span className="cursor-pointer text-xs text-muted-foreground hover:text-foreground" onClick={() => setEditingCell('progress')}>
          {project.progress ?? 0}%
        </span>
      </div>
    );
  };

  const DeadlineCell = () => {
    const d = project.deadline?.toDate();
    const isOverdue = d && d < new Date() && project.status !== 'done';
    if (editingCell === 'deadline') {
      return (
        <Popover>
          <PopoverTrigger className="flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-muted">
            <CalendarIcon className="h-3 w-3" />
            {editDeadline ? format(editDeadline, 'dd MMM') : 'Pick date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={editDeadline}
              onSelect={(date) => {
                setEditDeadline(date);
                setEditingCell(null);
                onSave({ deadline: date }).then(() => {}).catch(() => {});
              }}
              disabled={(d) => d < new Date('2020-01-01')}
            />
          </PopoverContent>
        </Popover>
      );
    }
    return (
      <span className="flex cursor-pointer items-center gap-1 text-sm hover:text-foreground" onClick={() => setEditingCell('deadline')}>
        {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
        <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
          {d ? format(d, 'dd MMM yyyy') : '—'}
        </span>
      </span>
    );
  };

  return (
    <TableRow
      className="border-b border-border hover:bg-accent/50 cursor-default"
      onContextMenu={(e) => {
        e.preventDefault();
        // Import openContextMenu from page.tsx via a callback approach
        // The page passes onDelete, so we call it via a custom event approach
        // Actually, let's just call onDelete directly — the page's context menu handles this
        // But since this is a row, we'll call the page's context menu via window dispatch
        // Better: just call onDelete directly since the page wants to confirm
        // We'll delegate back to page via a data attribute approach
      }}
    >
      <TableCell className="py-3 pl-4 pr-2 text-muted-foreground text-sm w-8">{index + 1}</TableCell>
      <TableCell className="max-w-[200px] py-3 pr-2"><TitleCell /></TableCell>
      <TableCell className="max-w-[140px] py-3 pr-2"><ClientCell /></TableCell>
      <TableCell className="py-3 pr-2"><PriorityCell /></TableCell>
      <TableCell className="py-3 pr-2"><BudgetCell /></TableCell>
      <TableCell className="py-3 pr-2"><ProgressCell /></TableCell>
      <TableCell className="py-3 pr-2"><DeadlineCell /></TableCell>
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

// ── Add row component ──────────────────────────────────────────────────────────

interface ProjectAddRowProps {
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  pendingClientId?: string | null;
  onAddingClientChange?: (adding: boolean) => void;
}

export function ProjectAddRow({ onSave, onCancel, pendingClientId, onAddingClientChange }: ProjectAddRowProps) {
  const { clients } = useClients();
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [budget, setBudget] = useState('');
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => { titleRef.current?.focus(); }, []);
  useEffect(() => {
    if (pendingClientId && pendingClientId !== clientId) setClientId(pendingClientId);
  }, [pendingClientId, clientId]);

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await onSave({ title: title.trim(), clientId: clientId || undefined, priority, budget: budget ? Number(budget) : undefined, progress, deadline, status: 'backlog' });
      toast.success('Project created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <TableRow className="bg-muted/20 border-b border-border">
      <TableCell className="py-2 pl-4 pr-2 text-muted-foreground text-sm w-8">+</TableCell>
      <TableCell className="py-2 pr-2">
        <Input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name..." className="h-8 text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel(); }} />
      </TableCell>
      <TableCell className="py-2 pr-2">
        <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')}>
          <SelectTrigger className="h-8 w-full min-w-[120px] text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
          <SelectContent>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-2 pr-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-2 pr-2">
        <Input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-8 w-28 text-sm" placeholder="0" />
      </TableCell>
      <TableCell className="py-2 pr-2">
        <Input value={String(progress)} onChange={(e) => { const n = parseInt(e.target.value, 10); setProgress(isNaN(n) ? 0 : Math.min(100, Math.max(0, n))); }} inputMode="numeric" className="h-8 w-14 text-sm text-center" />
      </TableCell>
      <TableCell className="py-2 pr-2">
        <Input type="date" value={deadline ? format(deadline, 'yyyy-MM-dd') : ''} onChange={(e) => setDeadline(e.target.value ? new Date(e.target.value) : undefined)} className="h-8 text-xs" />
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