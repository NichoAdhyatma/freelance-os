'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Building2, CheckCircle, MoreHorizontal, Pencil, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { type Invoice, type InvoiceStatus } from '@/types/invoice';

interface InvoiceCardProps {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  onSend: (id: string) => void;
  onMarkPaid: (id: string) => void;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  sent: { label: 'Sent', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  paid: { label: 'Paid', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function InvoiceCard({ invoice, onEdit, onDelete, onSend, onMarkPaid }: InvoiceCardProps) {
  const { getClientById } = useClients();
  const { projects } = useProjects();

  const status = invoice.status as InvoiceStatus;
  const config = STATUS_CONFIG[status];
  const dueDate = invoice.dueDate.toDate();
  const isOverdue = dueDate < new Date() && status !== 'paid' && status !== 'cancelled';

  const client = invoice.clientId ? getClientById(invoice.clientId) : null;
  const project = invoice.projectId ? projects.find((p) => p.id === invoice.projectId) : null;

  return (
    <Card className="group hover:border-primary/50 transition-all hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-muted-foreground font-mono text-sm">
              {invoice.invoiceNumber}
            </CardTitle>
            <CardDescription className="text-foreground mt-1 max-w-[200px] truncate font-medium">
              {client ? (
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="block max-w-[200px] truncate hover:underline"
                >
                  {client.name}
                </Link>
              ) : (
                'No client'
              )}
            </CardDescription>
            {project && (
              <p className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-xs">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{project.title}</span>
              </p>
            )}
          </div>
          <Badge className={config.color} variant="outline">
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{formatCurrency(invoice.amount)}</span>
          {(invoice.tax ?? 0) > 0 && (
            <span className="text-muted-foreground text-xs">
              incl. tax {formatCurrency(invoice.tax ?? 0)}
            </span>
          )}
        </div>

        <div
          className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}
        >
          <span>
            {isOverdue ? 'Overdue • ' : 'Due '}
            {format(dueDate, 'dd MMM yyyy', { locale: id })}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs"
            onClick={() => onEdit(invoice)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="bg-background hover:bg-accent flex h-8 w-8 items-center justify-center rounded-md border">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status === 'draft' && (
                <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invoice
                </DropdownMenuItem>
              )}
              {(status === 'sent' || status === 'overdue' || status === 'pending') && (
                <DropdownMenuItem onClick={() => onMarkPaid(invoice.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(invoice.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
