'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClientFormData } from '@/types/client';

interface ClientInlineRowProps {
  mode: 'add' | 'edit';
  initialData?: { name?: string; email?: string; company?: string } | null;
  onSave: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
}

export function ClientInlineRow({ mode, initialData, onSave, onCancel }: ClientInlineRowProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [company, setCompany] = useState(initialData?.company ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
      });
      toast.success(mode === 'add' ? 'Client added' : 'Client updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/20 border-b border-border">
      {/* # */}
      <td className="w-8 border-r border-border py-2 pl-4 pr-2 text-muted-foreground text-sm">{mode === 'add' ? '+' : '✏️'}</td>
      {/* Name */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Client name..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </td>
      {/* Company */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="h-8 text-sm"
        />
      </td>
      {/* Contact */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="h-8 text-sm"
        />
      </td>
      {/* Projects */}
      <td className="border-r border-border py-2 pr-2">
        <span className="text-muted-foreground text-xs">—</span>
      </td>
      {/* Revenue */}
      <td className="py-2 pr-4">
        <span className="text-muted-foreground text-xs">—</span>
      </td>
      {/* Actions */}
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
