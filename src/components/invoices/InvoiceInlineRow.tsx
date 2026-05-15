'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import type { InvoiceFormData } from '@/types/invoice';

interface InvoiceInlineRowProps {
  mode: 'add';
  onSave: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
}

export function InvoiceInlineRow({ mode, onSave, onCancel }: InvoiceInlineRowProps) {
  const { clients } = useClients();
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Client is required');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      toast.error('Valid amount is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        clientId,
        amount: Number(amount),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      toast.success('Invoice created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/20 border-border border-b">
      <td className="py-2 pl-4 pr-2">
        <span className="text-muted-foreground text-sm">+</span>
      </td>
      <td className="py-2 pr-2">
        <span className="text-muted-foreground text-xs font-mono">NEW</span>
      </td>
      <td className="py-2 pr-2">
        <Select value={clientId} onValueChange={(v) => setClientId(v ?? '')}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs">—</span></td>
      <td className="py-2 pr-2">
        <Input
          autoFocus
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </td>
      <td className="py-2 pr-2">
        <span className="text-muted-foreground text-xs">14 days</span>
      </td>
      <td className="py-2 pr-2">
        <span className="rounded border border-yellow-500/20 bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-500">
          Draft
        </span>
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={handleSave}
            disabled={saving}
          >
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}