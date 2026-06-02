'use client';

import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { setDashboardTitle } from '@/app/dashboard/_context';
import { ClientInlineRow } from '@/components/clients/ClientInlineRow';
import { ClientRow } from '@/components/clients/ClientRow';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { SummaryCard, SummaryCardGrid } from '@/components/dashboard/SummaryCard';
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
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
import { useProjects } from '@/hooks/useProjects';
import { type ClientFormData } from '@/types/client';

type SortField = 'recent' | 'name' | null;
type SortDir = 'asc' | 'desc' | null;

const PAGE_SIZE = 10;

export default function ClientsPage() {
  setDashboardTitle('Clients');

  const router = useRouter();
  const { clients, loading, addClient, editClient, removeClient, total } = useClients();
  const { projects } = useProjects();

  const [addingRow, setAddingRow] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'has_projects'>('all');
  const [sortField, setSortField] = useState<SortField>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  const clientProjectCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      if (p.clientId) counts[p.clientId] = (counts[p.clientId] || 0) + 1;
    }
    return counts;
  }, [projects]);

  const stats = useMemo(() => {
    const activeClients = clients.filter((c) => (clientProjectCount[c.id] || 0) > 0).length;
    return { total, activeClients };
  }, [clients, total, clientProjectCount]);

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
    let result = clients;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }

    if (filter === 'has_projects') {
      result = result.filter((c) => (clientProjectCount[c.id] || 0) > 0);
    }

    const sorted = [...result];
    if (sortField === 'name') {
      sorted.sort((a, b) =>
        sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
      );
    }
    return sorted;
  }, [clients, debouncedSearch, filter, sortField, sortDir, clientProjectCount]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const hasProjectsCount = clients.filter((c) => (clientProjectCount[c.id] || 0) > 0).length;

  const handleCancelAdd = () => setAddingRow(false);

  const handleDelete = async (id: string) => {
    const projCount = clientProjectCount[id] || 0;
    const msg = projCount > 0
      ? `This client has ${projCount} project(s). Delete anyway?`
      : 'Delete this client? This action cannot be undone.';
    if (!confirm(msg)) return;
    try {
      await removeClient(id);
      toast.success('Client deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  const handleDuplicate = async (client: typeof clients[number]) => {
    try {
      await addClient({
        name: `${client.name} (Copy)`,
        email: client.email || undefined,
        whatsapp: client.whatsapp || undefined,
        company: client.company || undefined,
        notes: client.notes || undefined,
      });
      toast.success('Client duplicated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate client');
    }
  };

  const handleSubmitInline = async (data: ClientFormData) => {
    try {
      await addClient(data);
      toast.success('Client added');
      setAddingRow(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      throw err;
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <SummaryCardGrid>
        <SummaryCard label="Total Clients" value={stats.total} sub="All time" icon={<Users className="h-5 w-5" />} />
        <SummaryCard label="Active Clients" value={stats.activeClients} sub="Has projects" subColor="green" icon={<Users className="h-5 w-5" />} />
        <SummaryCard label="Total Projects" value={projects.length} sub="Across all clients" subColor="default" icon={<Users className="h-5 w-5" />} />
        <SummaryCard label="Total Invoices" value="—" sub="Via finance page" subColor="default" icon={<Users className="h-5 w-5" />} />
      </SummaryCardGrid>

      {/* Search + Create */}
      <div className="flex items-center justify-between gap-4">
        <TableSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search clients..."
        />
        <Button onClick={() => setAddingRow(true)} size="sm" className="shrink-0">
          <Users className="h-4 w-4" />
          New Client
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => { setFilter(v as 'all' | 'has_projects'); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All ({clients.length})</TabsTrigger>
          <TabsTrigger value="has_projects">Has Projects ({hasProjectsCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {paginated.length === 0 && !addingRow ? (
        <EmptyState
          variant={search ? 'no-results' : 'no-data'}
          title={search ? 'No clients found' : 'No clients yet'}
          description={search ? `Pencarian "${search}" tidak ditemukan.` : 'Add your first client to start managing relationships'}
          actionLabel={search ? 'Reset Filter' : 'Add Client'}
          onAction={search ? () => { setSearch(''); setPage(1); } : () => setAddingRow(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)]">
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--border-default)]">
                <TableHead className="select-none text-xs font-medium w-12 border-r border-[var(--border-default)] text-[var(--text-tertiary)]">#</TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">
                  <span className="flex cursor-pointer items-center gap-1" onClick={() => handleSort('name')}>
                    Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </span>
                </TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">Company</TableHead>
                <TableHead className="select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)]">Contact</TableHead>
                <TableHead className="select-none text-xs font-medium text-[var(--text-tertiary)]">Projects</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addingRow && (
                <ClientInlineRow mode="add" onSave={handleSubmitInline} onCancel={handleCancelAdd} />
              )}
              {paginated.map((client, idx) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  index={start + idx}
                  projectCount={clientProjectCount[client.id] || 0}
                  onSave={async (id, data) => { await editClient(id, data); }}
                  onDelete={() => handleDelete(client.id)}
                  onDuplicate={() => handleDuplicate(client)}
                  onAddNew={() => setAddingRow(true)}
                  onNavigate={() => router.push(`/dashboard/clients/${client.id}`)}
                />
              ))}
            </TableBody>
          </Table>

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