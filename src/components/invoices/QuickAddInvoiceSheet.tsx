'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { createInvoice } from '@/lib/services/invoiceService';

interface QuickAddInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (invoiceId: string) => void;
  initialClientId?: string;
}

export function QuickAddInvoiceSheet({
  open,
  onOpenChange,
  onCreated,
  initialClientId,
}: QuickAddInvoiceSheetProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  );

  // Pre-fill client when sheet opens
  useEffect(() => {
    if (open && initialClientId) {
      setClientId(initialClientId);
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
      });
      toast.success('Invoice created — linked to project');
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
            <Input
              id="quick-invoice-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID or name"
              className={errors.clientId ? 'border-destructive' : ''}
              autoFocus
            />
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