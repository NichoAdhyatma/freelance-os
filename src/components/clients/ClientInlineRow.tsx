'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClientFormData } from '@/types/client';

interface ClientInlineRowProps {
  mode: 'add' | 'edit';
  initialData?: { name?: string; email?: string; company?: string; whatsapp?: string } | null;
  onSave: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
}

export function ClientInlineRow({ mode, initialData, onSave, onCancel }: ClientInlineRowProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [company, setCompany] = useState(initialData?.company ?? '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nama harus diisi');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      });
      toast.success(mode === 'add' ? 'Client ditambahkan' : 'Client diupdate');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/30 border-b border-border">
      {/* # */}
      <td className="w-8 border-r border-border py-2 pl-4 pr-2 text-muted-foreground text-sm">
        +
      </td>
      {/* Name */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama client..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !saving) handleSave();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={saving}
        />
      </td>
      {/* Company */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Perusahaan"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !saving) handleSave();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={saving}
        />
      </td>
      {/* Email */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          type="email"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !saving) handleSave();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={saving}
        />
      </td>
      {/* WhatsApp */}
      <td className="border-r border-border py-2 pr-2">
        <Input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="+62 812 xxxx xxxx"
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !saving) handleSave();
            if (e.key === 'Escape') onCancel();
          }}
          disabled={saving}
        />
      </td>
      {/* Actions */}
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          {/* preventDefault on pointerDown stops Input onBlur from firing */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onPointerDown={(e) => e.preventDefault()}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border border-muted-foreground border-t-transparent" />
            ) : (
              <Check className="h-3.5 w-3.5 text-green-500" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onPointerDown={(e) => e.preventDefault()}
            onClick={onCancel}
            disabled={saving}
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
