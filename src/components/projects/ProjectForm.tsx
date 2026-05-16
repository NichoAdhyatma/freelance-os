'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronDown, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { QuickAddClientSheet } from '@/components/clients/QuickAddClientSheet';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { cn } from '@/lib/utils';
import {
  type Project,
  type ProjectFormData,
  type ProjectPriority,
  type ProjectStatus,
} from '@/types/project';

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialData?: Project | null;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function ProjectForm({ open, onOpenChange, onSubmit, initialData }: ProjectFormProps) {
  const { clients } = useClients();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>('backlog');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [budget, setBudget] = useState('');

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setClientId(initialData.clientId || '');
        setStatus(initialData.status as ProjectStatus);
        setPriority(initialData.priority as ProjectPriority);
        setDeadline(initialData.deadline ? initialData.deadline.toDate() : undefined);
        setBudget(initialData.budget ? String(initialData.budget) : '');
      } else {
        setTitle('');
        setDescription('');
        setClientId('');
        setStatus('backlog');
        setPriority('medium');
        setDeadline(undefined);
        setBudget('');
      }
      setErrors({});
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (budget && isNaN(Number(budget))) newErrors.budget = 'Budget must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        clientId: clientId || undefined,
        status,
        priority,
        deadline,
        budget: budget ? Number(budget) : undefined,
      });
      onOpenChange(false);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the project details below.'
              : 'Fill in the details to create a new project.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Redesign Company Website"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              rows={3}
            />
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Client</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setQuickAddOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add New
              </Button>
            </div>
            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
              <PopoverTrigger>
                <div
                  role="combobox"
                  className={cn(
                    'flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors',
                    !clientId && 'text-muted-foreground',
                  )}
                >
                  <User className="mr-2 h-4 w-4 shrink-0" />
                  {clientId
                    ? (clients.find((c) => c.id === clientId)?.name ?? 'Select client')
                    : 'No client (optional)'}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search clients..." autoFocus />
                  <CommandList>
                    <CommandEmpty>
                      {clients.length === 0 ? 'No clients yet.' : 'No client found.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => {
                            setClientId(client.id);
                            setClientPopoverOpen(false);
                          }}
                          className="flex items-center gap-2"
                        >
                          <Check
                            className={cn(
                              'h-4 w-4 shrink-0',
                              clientId === client.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate">
                            {client.name}
                            {client.company && (
                              <span className="text-muted-foreground ml-1 text-xs">
                                · {client.company}
                              </span>
                            )}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deadline & Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'w-full justify-start text-left font-normal h-10 px-3 py-2 rounded-md border bg-background text-sm flex items-center',
                    !deadline && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, 'dd MMM yyyy', { locale: id }) : 'Pick date'}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date('2020-01-01')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget (IDR)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000000"
                className={errors.budget ? 'border-destructive' : ''}
              />
              {errors.budget && <p className="text-destructive text-xs">{errors.budget}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>

          <QuickAddClientSheet
            open={quickAddOpen}
            onOpenChange={setQuickAddOpen}
            onCreated={(newClientId) => {
              setClientId(newClientId);
              setClientPopoverOpen(false);
            }}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
