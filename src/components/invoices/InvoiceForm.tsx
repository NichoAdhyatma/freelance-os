'use client';

// Default due date computed once at module level (not during render)
const DEFAULT_DUE_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronDown, FolderKanban, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { updateProject } from '@/lib/services/projectService';
import { cn } from '@/lib/utils';
import { type Invoice, type InvoiceFormData, InvoiceStatus } from '@/types/invoice';

interface DefaultIds {
  defaultClientId?: string;
  defaultProjectId?: string;
}

interface InvoiceFormProps extends DefaultIds {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  initialData?: Invoice | null;
}

export function InvoiceForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  defaultClientId,
  defaultProjectId,
}: InvoiceFormProps) {
  const { clients } = useClients();
  const { projects } = useProjects();
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [discount, setDiscount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(DEFAULT_DUE_DATE);
  const [notes, setNotes] = useState('');
  const initialProjectId = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setClientId(initialData.clientId || '');
        setProjectId(initialData.projectId || '');
        initialProjectId.current = initialData.projectId || null;
        setAmount(String(initialData.amount));
        setTax(String(initialData.tax ?? 0));
        setDiscount(String(initialData.discount ?? 0));
        setDueDate(initialData.dueDate.toDate());
        setNotes(initialData.notes || '');
      } else {
        setClientId(defaultClientId ?? '');
        setProjectId(defaultProjectId ?? '');
        setAmount('');
        setTax('');
        setDiscount('');
        setDueDate(DEFAULT_DUE_DATE);
        setNotes('');
      }
    }
  }, [open, initialData]);

  // Auto-fill client when a project is selected
  const handleProjectSelect = async (selectedProjectId: string) => {
    const prevProjectId = projectId;
    setProjectId(selectedProjectId);
    setProjectPopoverOpen(false);
    const project = projects.find((p) => p.id === selectedProjectId);
    if (project?.clientId) {
      setClientId(project.clientId);
    }
    // Bidirectional sync
    if (prevProjectId && prevProjectId !== selectedProjectId) {
      await updateProject(prevProjectId, { invoiceId: undefined });
    }
    if (selectedProjectId && initialData?.id) {
      await updateProject(selectedProjectId, { invoiceId: initialData.id });
    } else if (!selectedProjectId && prevProjectId && initialData?.id) {
      // Cleared: only remove from old project (don't assign to new)
      await updateProject(prevProjectId, { invoiceId: undefined });
    }
  };

  // Filter projects by selected client (if any)
  const visibleProjects = clientId
    ? projects.filter((p) => !p.clientId || p.clientId === clientId)
    : projects;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      toast.error('Client is required');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      toast.error('Valid amount is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        clientId: clientId.trim(),
        projectId: projectId || undefined,
        amount: Number(amount),
        tax: tax ? Number(tax) : undefined,
        discount: discount ? Number(discount) : undefined,
        dueDate,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch {
      /* handled by parent */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update invoice details.' : 'Create a new invoice for your client.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="client">Client *</Label>
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
                    : 'Select client'}
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

          <div className="space-y-1.5">
            <Label htmlFor="project">Project</Label>
            <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
              <PopoverTrigger>
                <div
                  role="combobox"
                  className={cn(
                    'flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors',
                    !projectId && 'text-muted-foreground',
                  )}
                >
                  <FolderKanban className="mr-2 h-4 w-4 shrink-0" />
                  {projectId
                    ? (projects.find((p) => p.id === projectId)?.title ?? 'Select project')
                    : 'No project (optional)'}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search projects..." autoFocus />
                  <CommandList>
                    <CommandEmpty>No projects found</CommandEmpty>
                    <CommandGroup>
                      {visibleProjects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.id}
                          onSelect={() => handleProjectSelect(project.id)}
                        >
                          <Check
                            className={cn(
                              'h-4 w-4 shrink-0',
                              projectId === project.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate">{project.title}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (IDR) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000000"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax">Tax (IDR)</Label>
              <Input
                id="tax"
                type="number"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                placeholder="500000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discount">Discount (IDR)</Label>
              <Input
                id="discount"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'w-full justify-start text-left font-normal h-10 px-3 py-2 rounded-md border bg-background text-sm flex items-center',
                    !dueDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dueDate, 'dd MMM yyyy', { locale: id })}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setDueDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, etc."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
