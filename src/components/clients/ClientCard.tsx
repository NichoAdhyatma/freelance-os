'use client';

import {
  Building2,
  ExternalLink,
  Globe,
  Mail,
  Pencil,
  Phone,
  Receipt,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useInvoices } from '@/hooks/useInvoices';
import { getAvatarStyle } from '@/lib/tokens';
import { type Client } from '@/types/client';

interface ClientCardProps {
  client: Client;
  projectCount?: number;
  activeProjectCount?: number;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ClientCard({
  client,
  projectCount = 0,
  activeProjectCount = 0,
  onEdit,
  onDelete,
}: ClientCardProps) {
  const router = useRouter();
  const { invoices } = useInvoices();
  const invoiceCount = invoices.filter((i) => i.clientId === client.id).length;

  const whatsappLink = useMemo(() => {
    if (!client.whatsapp) return null;
    const num = client.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${num}`;
  }, [client.whatsapp]);

  const emailLink = useMemo(() => {
    if (!client.email) return null;
    return `mailto:${client.email}`;
  }, [client.email]);

  const initials = getInitials(client.name);
  const avatarStyle = getAvatarStyle(client.name);

  return (
    <Card
      className="group hover:border-primary/30 relative flex cursor-pointer flex-col transition-colors"
      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
    >
      <CardContent className="flex flex-col gap-4 p-5">
        {/* Header: Avatar + Name + Company */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0" style={{ color: avatarStyle.color, background: avatarStyle.bg }}>
            <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate leading-tight font-semibold">{client.name}</h3>
            {client.company && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{client.company}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-1">
          {client.email && (
            <a
              href={emailLink!}
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
            >
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.email}</span>
            </a>
          )}
          {client.whatsapp && (
            <a
              href={whatsappLink!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
            >
              <Phone className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.whatsapp}</span>
            </a>
          )}
          {client.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs transition-colors"
            >
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          {!client.email && !client.whatsapp && !client.website && (
            <p className="text-muted-foreground text-xs italic">No contact info</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs">
            {projectCount} project{projectCount !== 1 ? 's' : ''}
          </Badge>
          {activeProjectCount > 0 && (
            <Badge
              variant="default"
              className="bg-blue-500/10 text-xs text-blue-500 hover:bg-blue-500/10"
            >
              {activeProjectCount} active
            </Badge>
          )}
          {invoiceCount > 0 && (
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Receipt className="h-3 w-3" />
              <span>
                {invoiceCount} invoice{invoiceCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {client.totalRevenue > 0 && (
            <div className="ml-auto flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              <span>{formatCurrency(client.totalRevenue)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="border-border flex items-center gap-2 border-t pt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 text-xs"
            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(client)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive h-8 w-8 p-0"
            onClick={() => onDelete(client.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
