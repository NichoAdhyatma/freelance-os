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
import { useClients } from '@/hooks/useClients';
import type { ClientFormData } from '@/types/client';

interface QuickAddClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (clientId: string) => void;
}

export function QuickAddClientSheet({ open, onOpenChange, onCreated }: QuickAddClientSheetProps) {
  const { addClient } = useClients();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [company, setCompany] = useState('');

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setName('');
      setEmail('');
      setWhatsapp('');
      setCompany('');
      setErrors({});
    }
    onOpenChange(val);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data: ClientFormData = {
        name: name.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        company: company.trim() || undefined,
      };
      const newClientId = await addClient(data);
      toast.success('Client created — linked to project');
      onCreated(newClientId);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add New Client</SheetTitle>
          <SheetDescription>Quickly add a client while creating your project.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="quick-client-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="quick-client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client or company name"
              className={errors.name ? 'border-destructive' : ''}
              autoFocus
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="quick-client-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="quick-client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
            />
          </div>

          {/* WhatsApp */}
          <div className="space-y-1.5">
            <label htmlFor="quick-client-whatsapp" className="text-sm font-medium">
              WhatsApp
            </label>
            <Input
              id="quick-client-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+6281234567890"
            />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label htmlFor="quick-client-company" className="text-sm font-medium">
              Company
            </label>
            <Input
              id="quick-client-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Add Client'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}