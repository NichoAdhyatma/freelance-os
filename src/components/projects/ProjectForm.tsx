'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronDown, FileText, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { QuickAddClientSheet } from '@/components/clients/QuickAddClientSheet';
import { QuickAddInvoiceSheet } from '@/components/invoices/QuickAddInvoiceSheet';
import { Badge } from '@/components/ui/badge';
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
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { updateInvoice } from '@/lib/services/invoiceService';
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
  const { invoices } = useInvoices();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [invoicePopoverOpen, setInvoicePopoverOpen] = useState(false);
  const [quickAddInvoiceOpen, setQuickAddInvoiceOpen] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>('backlog');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setClientId(initialData.clientId || '');
        setInvoiceId(initialData.invoiceId ?? '');
        setStatus(initialData.status as ProjectStatus);
        setPriority(initialData.priority as ProjectPriority);
        setDeadline(initialData.deadline ? initialData.deadline.toDate() : undefined);
      } else {
        setTitle('');
        setDescription('');
        setClientId('');
        setInvoiceId('');
        setStatus('backlog');
        setPriority('medium');
        setDeadline(undefined);
      }
      setErrors({});
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
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
        invoiceId: invoiceId || undefined,
        status,
        priority,
        deadline,
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

          {/* Invoice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Invoice</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setQuickAddInvoiceOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add New
              </Button>
            </div>
            <Popover open={invoicePopoverOpen} onOpenChange={setInvoicePopoverOpen}>
              <PopoverTrigger>
                <div
                  role="combobox"
                  className={cn(
                    'flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors',
                    !invoiceId && 'text-muted-foreground',
                  )}
                >
                  <FileText className="mr-2 h-4 w-4 shrink-0" />
                  {invoiceId
                    ? (() => {
                        const inv = invoices.find((i) => i.id === invoiceId);
                        return inv ? `${inv.invoiceNumber} · Rp ${inv.amount.toLocaleString('id-ID')}` : 'Select invoice';
                      })()
                    : 'No invoice (optional)'}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search invoices..." autoFocus />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-1">
                        {invoices.length === 0 ? 'No invoices yet.' : 'No invoice found.'}
                      </div>
                    </CommandEmpty>
                    {invoiceId && (

                      <div className="px-2 py-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground text-xs"
                          onClick={async () => {
                            if (invoiceId) {
                              const prev = invoices.find(i => i.id === invoiceId);
                              if (prev?.projectId === initialData?.id) {
                                updateInvoice(invoiceId, { projectId: null }).catch(() => {});
                              }
                            }
                            setInvoiceId('');
                            setInvoicePopoverOpen(false);
                          }}
                        >
                          Clear linked invoice
                        </Button>
                      </div>
                    )}
                    <CommandGroup>
                      {invoices.map((inv) => {
                        const usedByProject = inv.projectId ? projects.find((p) => p.id === inv.projectId) : null;
                        const isUsedByOther = usedByProject && usedByProject.id !== initialData?.id;
                        return (
                          <CommandItem
                            key={inv.id}
                            value={inv.id}
                            onSelect={async () => {
                              // Clear previous invoice's projectId if linked to this project
                              if (invoiceId && invoiceId !== inv.id) {
                                const prev = invoices.find(i => i.id === invoiceId);
                                if (prev?.projectId === initialData?.id) {
                                  await updateInvoice(invoiceId, { projectId: null });
                                }
                              }
                              // Set new invoice and link it to this project
                              setInvoiceId(inv.id);
                              setInvoicePopoverOpen(false);
                              if (initialData?.id) {
                                await updateInvoice(inv.id, { projectId: initialData.id });
                              }
                            }}
                            className="flex flex-col items-start gap-0.5 py-2"
                          >
                            <div className="flex w-full items-center gap-2">
                              <Check
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  invoiceId === inv.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span className="truncate text-sm font-medium">{inv.invoiceNumber}</span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                Rp {inv.amount.toLocaleString('id-ID')}
                              </span>
                            </div>
                            {isUsedByOther && (
                              <div className="ml-6">
                                <Badge variant="secondary" className="text-xs">
                                  Used in {usedByProject.title}
                                </Badge>
                              </div>
                            )}
                          </CommandItem>
                        );
                      })}
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

          {/* Deadline */}
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

          <QuickAddInvoiceSheet
            open={quickAddInvoiceOpen}
            onOpenChange={setQuickAddInvoiceOpen}
            onCreated={(newInvoiceId) => {
              setInvoiceId(newInvoiceId);
              setInvoicePopoverOpen(false);
            }}
            initialClientId={clientId || undefined}
            initialProjectId={initialData?.id}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
