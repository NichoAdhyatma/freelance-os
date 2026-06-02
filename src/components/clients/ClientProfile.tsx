'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Building2,
  CheckCircle2,
  FileText,
  FolderKanban,
  Globe,
  Mail,
  Pencil,
  Phone,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvatarStyle } from '@/lib/tokens';
import { type Client } from '@/types/client';
import { type Invoice, type InvoiceStatus } from '@/types/invoice';
import { type Project } from '@/types/project';

interface ClientProfileProps {
  client: Client;
  projects: Project[];
  invoices: Invoice[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', color: 'bg-blue-500/10 text-blue-500' },
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500' },
  paid: { label: 'Paid', color: 'bg-green-500/10 text-green-500' },
  overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

const PROJECT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500' },
  review: { label: 'Review', color: 'bg-yellow-500/10 text-yellow-500' },
  done: { label: 'Done', color: 'bg-green-500/10 text-green-500' },
};

export function ClientProfile({
  client,
  projects,
  invoices,
  onEdit,
  onDelete,
}: ClientProfileProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ─── Derived data ────────────────────────────────────────────────────────
  const clientProjects = useMemo(
    () => projects.filter((p) => p.clientId === client.id),
    [projects, client.id],
  );

  const clientInvoices = useMemo(
    () => invoices.filter((i) => i.clientId === client.id),
    [invoices, client.id],
  );

  const totalRevenue = useMemo(
    () =>
      clientInvoices
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + (i.amount || 0), 0),
    [clientInvoices],
  );

  const activeProjects = useMemo(
    () => clientProjects.filter((p) => p.status === 'in_progress' || p.status === 'review'),
    [clientProjects],
  );

  const paidInvoices = useMemo(
    () => clientInvoices.filter((i) => i.status === 'paid'),
    [clientInvoices],
  );

  // ─── Links ────────────────────────────────────────────────────────────────
  const whatsappLink = useMemo(() => {
    if (!client.whatsapp) return null;
    const num = client.whatsapp.replace(/\D/g, '');
    return `https://wa.me/${num}`;
  }, [client.whatsapp]);

  const emailLink = useMemo(() => {
    if (!client.email) return null;
    return `mailto:${client.email}`;
  }, [client.email]);

  const websiteHref = useMemo(() => {
    if (!client.website) return null;
    const url = client.website.startsWith('http') ? client.website : `https://${client.website}`;
    return url;
  }, [client.website]);

  // ─── Render ────────────────────────────────────────────────────────────────
  const initials = getInitials(client.name);
  const avatarStyle = getAvatarStyle(client.name);

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0" style={{ color: avatarStyle.color, background: avatarStyle.bg }}>
              <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              {client.company && (
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                  <Building2 className="h-4 w-4" />
                  {client.company}
                </p>
              )}
              {/* Contact buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium transition-all"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    WhatsApp
                  </a>
                )}
                {emailLink && (
                  <a
                    href={emailLink!}
                    className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium transition-all"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                )}
                {websiteHref && (
                  <a
                    href={websiteHref!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium transition-all"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* ── Stats Row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Total Revenue */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                <p className="text-muted-foreground text-xs">Total Revenue</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Projects */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <FolderKanban className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold">{clientProjects.length}</p>
                <p className="text-muted-foreground text-xs">Total Projects</p>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <FolderKanban className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{activeProjects.length}</p>
                <p className="text-muted-foreground text-xs">Active Projects</p>
              </div>
            </CardContent>
          </Card>

          {/* Paid Invoices */}
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{paidInvoices.length}</p>
                <p className="text-muted-foreground text-xs">Paid Invoices</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects ({clientProjects.length})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({clientInvoices.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-3">
            {clientProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <FolderKanban className="text-muted-foreground/30 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No projects for this client</p>
              </div>
            ) : (
              clientProjects.map((project) => {
                const statusCfg =
                  PROJECT_STATUS_CONFIG[project.status] || PROJECT_STATUS_CONFIG.backlog;
                return (
                  <Card key={project.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h4 className="truncate font-medium">{project.title}</h4>
                          <Badge variant="outline" className={statusCfg.color}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-4 text-xs">
                          {project.deadline && (
                            <span>
                              Due {format(project.deadline.toDate(), 'dd MMM yyyy', { locale: id })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="w-24">
                          <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
                            <span>Progress</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-3">
            {clientInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <FileText className="text-muted-foreground/30 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No invoices for this client</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Table header */}
                <div className="text-muted-foreground grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium">
                  <div className="col-span-3">Invoice #</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-3">Due Date</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>
                {clientInvoices.map((invoice) => {
                  const statusCfg =
                    STATUS_CONFIG[invoice.status as InvoiceStatus] || STATUS_CONFIG.draft;
                  return (
                    <Card key={invoice.id} className="hover:border-primary/30 transition-colors">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {invoice.invoiceNumber}
                              </p>
                              {invoice.paidAt && (
                                <p className="text-muted-foreground text-xs">
                                  Paid{' '}
                                  {format(invoice.paidAt.toDate(), 'dd MMM yyyy', { locale: id })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${statusCfg.color} shrink-0`}>
                          {statusCfg.label}
                        </Badge>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium">{formatCurrency(invoice.amount)}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(invoice.dueDate.toDate(), 'dd MMM yyyy', { locale: id })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            {client.notes ? (
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {client.notes}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <p className="text-muted-foreground text-sm">No notes for this client</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>? This action cannot be
              undone.
              {clientProjects.length > 0 && (
                <span className="text-foreground mt-2 block">
                  This client has {clientProjects.length} associated project
                  {clientProjects.length !== 1 ? 's' : ''}.
                </span>
              )}
              {clientInvoices.length > 0 && (
                <span className="text-foreground mt-1 block">
                  This client has {clientInvoices.length} associated invoice
                  {clientInvoices.length !== 1 ? 's' : ''}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setDeleteOpen(false);
                onDelete(client.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
