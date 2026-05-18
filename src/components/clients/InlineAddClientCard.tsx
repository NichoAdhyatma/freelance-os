'use client';

import { Building2, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useClients } from '@/hooks/useClients';
import type { ClientFormData } from '@/types/client';

interface InlineAddClientCardProps {
  open: boolean;
  onClose: () => void;
  onCreated: (clientId: string) => void;
}

export function InlineAddClientCard({ open, onClose, onCreated }: InlineAddClientCardProps) {
  const { addClient } = useClients();
  const [form, setForm] = useState({ name: '', company: '' });
  const [loading, setLoading] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // Reset form when card closes
  useEffect(() => {
    if (!open) {
      setForm({ name: '', company: '' });
    }
  }, [open]);

  // Auto-focus name input
  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Client name is required');
      return;
    }
    setLoading(true);
    try {
      const data: ClientFormData = {
        name: form.name.trim(),
        company: form.company.trim() || undefined,
      };
      const newId = await addClient(data);
      toast.success('Client created');
      onCreated(newId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Card — centered */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center">
        <div
          className="relative w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
          style={{
            animation: 'cardEnter 200ms ease-out forwards',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium">Add New Client</span>
            </div>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Body */}
          <div className="space-y-3 p-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                ref={nameRef}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Client or company name"
                className="h-9"
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Company</label>
              <div className="relative">
                <Building2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Company name (optional)"
                  className="h-9 pl-9"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
            <Button variant="ghost" size="sm" className="h-8" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={handleSubmit}
              disabled={loading || !form.name.trim()}
            >
              {loading ? 'Creating...' : 'Add Client'}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardEnter {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}