'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, ChevronDown, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useClients } from '@/hooks/useClients';
import { cn } from '@/lib/utils';
import { createInvoice } from '@/lib/services/invoiceService';

interface QuickAddInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (invoiceId: string) => void;
  initialClientId?: string;
  initialProjectId?: string;
}

export function QuickAddInvoiceSheet({
  open,
  onOpenChange,
  onCreated,
  initialClientId,
  initialProjectId,
}: QuickAddInvoiceSheetProps) {
  const { clients } = useClients();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientId, setClientId] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  );

  // Pre-fill client when sheet opens
  useEffect(() => {
    if (open && initialClientId) {
      setClientId(initialClientId);
      setErrors((prev) => {
        const n = { ...prev };
        delete n.clientId;
        return n;
      });
    }
  }, [open, initialClientId]);

  const resetForm = () => {
    setClientId(initialClientId ?? '');
    setAmount('');
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
    setErrors({});
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!clientId.trim()) newErrors.clientId = 'Client is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = 'Valid amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const newInvoiceId = await createInvoice({
        clientId: clientId.trim(),
        amount: Number(amount),
        dueDate,
        projectId: initialProjectId,
      });
      toast.success('Invoice created successfully');
      onCreated(newInvoiceId);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add New Invoice</SheetTitle>
          <SheetDescription>
            Quickly add an invoice while creating your project.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-4">
          {/* Client */}
          <div className="space-y-1.5">
            <label htmlFor="quick-invoice-client" className="text-sm font-medium">
              Client <span className="text-destructive">*</span>
            </label>
            <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
              <PopoverTrigger>
                <div
                  role="combobox"
                  className={cn(
                    'flex h-10 w-full cursor-pointer items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted transition-colors',
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
                            setErrors((prev) => {
                              const n = { ...prev };
                              delete n.clientId;
                              return n;
                            });
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
            {errors.clientId && (
              <p className="text-destructive text-xs">{errors.clientId}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="quick-invoice-amount" className="text-sm font-medium">
              Amount (IDR) <span className="text-destructive">*</span>
            </label>
            <Input
              id="quick-invoice-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000000"
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && (
              <p className="text-destructive text-xs">{errors.amount}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="quick-invoice-due" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="quick-invoice-due"
              type="date"
              value={dueDate.toISOString().split('T')[0]}
              onChange={(e) => setDueDate(new Date(e.target.value + 'T00:00:00'))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Add Invoice'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}