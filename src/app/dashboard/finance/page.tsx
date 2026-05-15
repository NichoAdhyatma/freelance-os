'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Search,
  Send,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClients } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { formatIDR } from '@/lib/utils';
import { type InvoiceStatus } from '@/types/invoice';

type StatusFilter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';
type SortField = 'recent' | 'amount' | 'due';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  sent: { label: 'Sent', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  paid: { label: 'Paid', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  overdue: { label: 'Overdue', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground' },
};

function SortIcon({
  field,
  activeField,
  dir,
}: {
  field: SortField;
  activeField: SortField;
  dir: SortDir;
}) {
  if (activeField !== field)
    return <span className="text-muted-foreground/30 ml-1 text-xs">↕</span>;
  return dir === 'asc' ? (
    <span className="text-primary ml-1 text-xs">↑</span>
  ) : (
    <span className="text-primary ml-1 text-xs">↓</span>
  );
}

export default function FinancePage() {
  const { invoices, loading, add, edit, remove } = useInvoices();
  const { getClientById } = useClients();
  const { projects } = useProjects();

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let result = filter === 'all' ? invoices : invoices.filter((i) => i.status === filter);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((i) => i.invoiceNumber.toLowerCase().includes(q));
    }

    const sorted = [...result];
    if (sortField === 'amount') {
      sorted.sort((a, b) => (sortDir === 'asc' ? a.amount - b.amount : b.amount - a.amount));
    } else if (sortField === 'due') {
      sorted.sort((a, b) => {
        const aDate = a.dueDate.toDate().getTime();
        const bDate = b.dueDate.toDate().getTime();
        return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
      });
    }
    return sorted;
  }, [invoices, filter, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const outstanding = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue' || i.status === 'pending')
    .reduce((sum, i) => sum + i.amount, 0);

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
  };

  const handleOpenNew = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const handleEdit = (inv: any) => {
    setEditingInvoice(inv);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await remove(id);
      toast.success('Invoice deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleSend = async (id: string) => {
    try {
      await edit(id, { status: 'sent' });
      toast.success('Invoice marked as sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await edit(id, { status: 'paid' });
      toast.success('Invoice marked as paid');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark paid');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingInvoice) {
        await edit(editingInvoice.id, data);
        toast.success('Invoice updated');
      } else {
        await add(data);
        toast.success('Invoice created');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-12 w-40" />
          <Skeleton className="h-12 w-40" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Minimal Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{formatIDR(totalRevenue)}</span>
          <span className="text-muted-foreground text-sm">Total Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{formatIDR(outstanding)}</span>
          <span className="text-muted-foreground text-sm">Outstanding</span>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as StatusFilter);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({stats.sent})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({stats.paid})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <Receipt className="text-muted-foreground/30 mb-4 h-16 w-16" />
          <h3 className="mb-1 text-lg font-semibold">
            {search ? 'No invoices found' : 'No invoices yet'}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {search
              ? `No results for "${search}"`
              : 'Create your first invoice to start tracking payments'}
          </p>
          {!search && (
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-12 text-xs font-medium">#</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">
                  Invoice #
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">Project</TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer text-xs font-medium"
                  onClick={() => handleSort('amount')}
                >
                  <span className="flex items-center">
                    Amount
                    <SortIcon field="amount" activeField={sortField} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer text-xs font-medium"
                  onClick={() => handleSort('due')}
                >
                  <span className="flex items-center">
                    Due Date
                    <SortIcon field="due" activeField={sortField} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground w-20 text-xs font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((inv, idx) => {
                const status = inv.status as InvoiceStatus;
                const config = STATUS_CONFIG[status];
                const dueDate = inv.dueDate.toDate();
                const isOverdue =
                  dueDate < new Date() && status !== 'paid' && status !== 'cancelled';
                const project = inv.projectId ? projects.find((p) => p.id === inv.projectId) : null;

                return (
                  <TableRow key={inv.id} className="border-border hover:bg-accent/50">
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {start + idx}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 font-mono text-sm">
                      {inv.invoiceNumber}
                    </TableCell>
                    <TableCell className="max-w-[160px] py-3">
                      {inv.clientId ? (
                        <Link
                          href={`/dashboard/clients/${inv.clientId}`}
                          className="block truncate text-sm font-medium hover:underline"
                        >
                          {getClientById(inv.clientId)?.name ?? inv.clientId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] py-3 text-sm">
                      <span className="truncate">{project?.title || '—'}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {formatIDR(inv.amount)}
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}
                      >
                        {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0" />}
                        {format(dueDate, 'dd MMM yyyy', { locale: id })}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={config.color} variant="outline">
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(inv)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="bg-background hover:bg-accent flex h-7 w-7 items-center justify-center rounded-md border">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleSend(inv.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            {(status === 'sent' ||
                              status === 'overdue' ||
                              status === 'pending') && (
                              <DropdownMenuItem onClick={() => handleMarkPaid(inv.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDelete(inv.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-border flex items-center justify-between border-t px-6 py-4">
              <p className="text-muted-foreground text-sm">
                {filtered.length === 0
                  ? 'No results'
                  : `Showing ${start}–${end} of ${filtered.length}`}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <InvoiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingInvoice}
      />
    </div>
  );
}
