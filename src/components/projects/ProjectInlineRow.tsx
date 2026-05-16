'use client';

import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import type { Project, ProjectFormData, ProjectPriority, ProjectStatus } from '@/types/project';

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface ProjectInlineRowProps {
  mode: 'add' | 'edit';
  initialData?: Project | null;
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  pendingClientId?: string | null;
  onAddingClientChange?: (adding: boolean) => void;
  onNavigate?: () => void;
}

export function ProjectInlineRow({
  mode,
  initialData,
  onSave,
  onCancel,
  pendingClientId,
  onAddingClientChange,
  onNavigate,
}: ProjectInlineRowProps) {
  const { clients } = useClients();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [clientId, setClientId] = useState(initialData?.clientId ?? pendingClientId ?? '');
  const [priority, setPriority] = useState<ProjectPriority>(initialData?.priority ?? 'medium');
  const [budget, setBudget] = useState<string>(initialData?.budget ? String(initialData.budget) : '');
  const [progress, setProgress] = useState(initialData?.progress ?? 0);
  const [deadline, setDeadline] = useState<Date | undefined>(initialData?.deadline?.toDate());
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);

  // Sync pendingClientId from parent (after client creation from card)
  useEffect(() => {
    if (pendingClientId && pendingClientId !== clientId) {
      setClientId(pendingClientId);
    }
  }, [pendingClientId, clientId]);

  // Auto-focus title input in add mode when row mounts
  useEffect(() => {
    if (mode === 'add' && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [mode]);

  const handleSaveAndExit = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        clientId: clientId || undefined,
        priority,
        budget: budget ? Number(budget) : undefined,
        progress,
        deadline,
        status: (initialData?.status as ProjectStatus) ?? 'backlog',
      });
      onCancel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [title, clientId, priority, budget, progress, deadline, saving, onSave, onCancel, initialData?.status]);

  const handleBudgetChange = (raw: string) => setBudget(raw.replace(/\D/g, ''));
  const handleProgressChange = (raw: string) => {
    const num = parseInt(raw, 10);
    if (isNaN(num)) { setProgress(0); return; }
    setProgress(Math.min(100, Math.max(0, num)));
  };

  const handleBlur = (e: React.FocusEvent<HTMLTableRowElement>) => {
    if (!rowRef.current?.contains(e.relatedTarget as Node)) {
      handleSaveAndExit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.name === 'title') {
      e.preventDefault();
      handleSaveAndExit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const pyClass = mode === 'add' ? 'py-2' : 'py-3';

  return (
    <tr ref={rowRef} onBlur={handleBlur} className={mode === 'add' ? 'bg-muted/20 border-b border-border' : 'border-b border-border hover:bg-accent/50'}>
      {/* # */}
      <td className={`${pyClass} pl-4 pr-2`}>
        <span className="text-muted-foreground text-sm">{mode === 'add' ? '+' : '✏️'}</span>
      </td>

      {/* Title */}
      <td className={`${pyClass} pr-2`}>
        <Input
          ref={mode === 'add' ? titleInputRef : undefined}
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project name..."
          className="h-8 text-sm"
          onKeyDown={handleKeyDown}
        />
      </td>

      {/* Client */}
      <td className={`${pyClass} pr-2`}>
        <div className="flex items-center gap-1">
          <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')}>
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0 p-0"
              title="Add new client"
              onClick={() => onAddingClientChange(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>

      {/* Priority */}
      <td className={`${pyClass} pr-2`}>
        <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* Budget */}
      <td className={`${pyClass} pr-2`}>
        <Input
          value={budget}
          onChange={(e) => handleBudgetChange(e.target.value)}
          placeholder="0"
          inputMode="numeric"
          className="h-8 w-28 text-sm"
          onKeyDown={handleKeyDown}
        />
      </td>

      {/* Progress */}
      <td className={`${pyClass} pr-2`}>
        <div className="flex items-center gap-2">
          <Input
            value={String(progress)}
            onChange={(e) => handleProgressChange(e.target.value)}
            inputMode="numeric"
            className="h-8 w-14 text-sm text-center"
            onKeyDown={handleKeyDown}
          />
          <Progress value={progress} className="h-2 w-16" />
        </div>
      </td>

      {/* Deadline */}
      <td className={`${pyClass} pr-2`}>
        <Popover>
          <PopoverTrigger className="flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-muted">
            <CalendarIcon className="h-3 w-3" />
            {deadline ? format(deadline, 'dd MMM') : 'Pick date'}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(d) => setDeadline(d)}
              disabled={(d) => d < new Date('2020-01-01')}
            />
          </PopoverContent>
        </Popover>
      </td>

      {/* Actions */}
      <td className={`${pyClass} pr-4`}>
        {onNavigate ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onPointerDown={(e) => {
              e.preventDefault();
              handleSaveAndExit().then(() => onNavigate?.());
            }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </td>
    </tr>
  );
}