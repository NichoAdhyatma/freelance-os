'use client';

import { Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { setDashboardTitle } from '@/app/dashboard/_context';
import { InlineAddClientCard } from '@/components/clients/InlineAddClientCard';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { InvoiceInlineRow } from '@/components/invoices/InvoiceInlineRow';
import { InvoiceRow, INVOICE_COLUMNS } from '@/components/invoices/InvoiceRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { downloadInvoicePDF } from '@/lib/pdf/downloadInvoicePDF';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/DataTableSkeleton';
import {
  Table,
  TableBody,
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

type StatusFilter = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';
type SortField = 'recent' | 'amount' | 'due' | null;
type SortDir = 'asc' | 'desc' | null;

const PAGE_SIZE = 10;

export default function FinancePage() {
  setDashboardTitle('Finance');
  const router = useRouter();

  const { invoices, loading, add, edit, remove } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();

  const [addingRow, setAddingRow] = useState(false);
  const [addingClientInline, setAddingClientInline] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    const outstanding = invoices
      .filter((i) => i.status === 'sent' || i.status === 'overdue' || i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);
    const overdue = invoices.filter((i) => i.status === 'overdue').length;
    const draft = invoices.filter((i) => i.status === 'draft').length;
    return { totalRevenue, outstanding, overdue, draft };
  }, [invoices]);

  const statusCounts = useMemo(
    () => ({
      total: invoices.length,
      draft: invoices.filter((i) => i.status === 'draft').length,
      sent: invoices.filter((i) => i.status === 'sent').length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
    }),
    [invoices],
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField('recent'); setSortDir(null); }
    } else {
      setSortField(field as SortField);
      setSortDir('asc');
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

  const handleCancelAdd = () => setAddingRow(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await remove(id);
      toast.success('Invoice deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleDuplicate = async (invoice: typeof invoices[number]) => {
    try {
      await add({
        clientId: invoice.clientId,
        projectId: invoice.projectId || undefined,
        title: invoice.title,
        amount: invoice.amount,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: invoice.items,
        notes: invoice.notes || undefined,
      });
      toast.success('Invoice duplicated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate');
    }
  };

  const handleSubmitInline = async (data: any) => {
    try {
      await add(data);
      toast.success('Invoice created');
      setAddingRow(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      throw err;
    }
  };

  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  const handleDownloadPDF = async (invoice: typeof invoices[number]) => {
    if (downloading[invoice.id]) return;
    setDownloading((prev) => ({ ...prev, [invoice.id]: true }));
    try {
      const client = invoice.clientId ? clients.find((c) => c.id === invoice.clientId) ?? null : null;
      const project = invoice.projectId ? projects.find((p) => p.id === invoice.projectId) : null;
      await downloadInvoicePDF({ invoice, client, projectTitle: project?.title });
      toast.success('PDF downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Gagal generate PDF');
    } finally {
      setDownloading((prev) => ({ ...prev, [invoice.id]: false }));
    }
  };

  const handleSendWhatsApp = (invoice: typeof invoices[number]) => {
    const client = invoice.clientId ? clients.find((c) => c.id === invoice.clientId) : null;
    if (!client) { toast.error('Client tidak ditemukan.'); return; }
    if (!client.whatsapp) { toast.error('Client ini belum memiliki nomor WhatsApp.'); return; }
    const waNumber = client.whatsapp.replace(/\D/g, '');
    const dueDate = invoice.dueDate.toDate();
    const total = (invoice.amount ?? 0) + (invoice.tax ?? 0) - (invoice.discount ?? 0);
    const message = `Halo ${client.name}! 👋\n\nBerikut invoice untuk pekerjaan yang telah diselesaikan:\n\n📄 *${invoice.invoiceNumber}*\n🏢 *${client.company || ''}*\n💰 *Total: ${formatIDR(total)}*\n📅 *Jatuh Tempo: ${format(dueDate, 'dd MMMM yyyy', { locale: id })}*\n\nMohon melakukan pembayaran sebelum jatuh tempo. Terima kasih! 🙏\n\n—\nDikirim via Freelancer OS`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <PageSkeleton showSearch={false} />;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <StatsGrid
        items={[
          { label: 'Total Revenue', value: formatIDR(stats.totalRevenue), sub: 'Completed', subColor: 'green' },
          { label: 'Outstanding', value: formatIDR(stats.outstanding), sub: 'Awaiting', subColor: 'yellow' },
          { label: 'Sent', value: statusCounts.sent, sub: 'In progress' },
          { label: 'Overdue', value: stats.overdue, sub: 'Needs action', subColor: 'red' },
        ]}
      />

      {/* Search + Create */}
      <div className="flex items-center justify-between gap-4">
        <TableSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search invoices..."
        />
        <Button onClick={() => router.push('/dashboard/invoices/new')} size="sm" className="shrink-0">
          <Receipt className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as StatusFilter); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.total})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({statusCounts.sent})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({statusCounts.paid})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({statusCounts.overdue})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {paginated.length === 0 && !addingRow ? (
        <EmptyState
          variant={search ? 'no-results' : 'no-data'}
          title={search ? 'No invoices found' : 'No invoices yet'}
          description={search ? `Pencarian "${search}" tidak ditemukan.` : 'Create your first invoice to start tracking payments'}
          actionLabel={search ? 'Reset Filter' : 'Create Invoice'}
          onAction={search ? () => { setSearch(''); setPage(1); } : () => router.push('/dashboard/invoices/new')}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)]">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border-default)]">
                <TableHead className="select-none text-xs font-medium w-12 border-r border-[var(--border-default)] text-[var(--text-tertiary)]">#</TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">Invoice #</TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">Client</TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">Project</TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">
                  Amount <SortIcon field="amount" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">
                  Due Date <SortIcon field="due" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead className="select-none text-xs font-medium text-[var(--text-tertiary)]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addingRow && (
                <InvoiceInlineRow mode="add" onSave={handleSubmitInline} onCancel={handleCancelAdd} />
              )}
              {paginated.map((inv, idx) => (
                <InvoiceRow
                  key={inv.id}
                  invoice={inv}
                  index={start + idx}
                  clients={clients}
                  projectTitle={inv.projectId ? projects.find((p) => p.id === inv.projectId)?.title : undefined}
                  onSave={async (id, data) => { await edit(id, data); }}
                  onDelete={() => handleDelete(inv.id)}
                  onDuplicate={() => handleDuplicate(inv)}
                  onAddNew={() => setAddingRow(true)}
                  onAddClient={() => setAddingClientInline(true)}
                  onDownloadPDF={() => handleDownloadPDF(inv)}
                  onSendWhatsApp={() => handleSendWhatsApp(inv)}
                  downloading={downloading[inv.id]}
                />
              ))}
            </TableBody>
          </Table>

          <InlineAddClientCard
            open={addingClientInline}
            onClose={() => setAddingClientInline(false)}
            onCreated={(clientId) => setAddingClientInline(false)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)]">
              <p className="text-sm text-[var(--text-tertiary)]">
                {filtered.length === 0 ? 'No results' : `Showing ${start}–${end} of ${filtered.length}`}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>{p}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next →</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}