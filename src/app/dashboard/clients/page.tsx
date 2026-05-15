'use client';

import { Mail, Pencil, Plus, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ClientForm } from '@/components/clients/ClientForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { SummaryCard, SummaryCardGrid } from '@/components/dashboard/SummaryCard';
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { Button } from '@/components/ui/button';
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
import { useProjects } from '@/hooks/useProjects';
import { setDashboardTitle } from '@/app/dashboard/_context';
import { formatIDR } from '@/lib/utils';
import { type Client, type ClientFormData } from '@/types/client';

type SortField = 'recent' | 'name' | 'revenue' | null;
type SortDir = 'asc' | 'desc' | null;
const PAGE_SIZE = 10;

export default function ClientsPage() {
  setDashboardTitle('Clients');

  const { clients, loading, addClient, editClient, removeClient, total, totalRevenue } =
    useClients();
  const { projects } = useProjects();

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'has_projects'>('all');
  const [sortField, setSortField] = useState<SortField>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const activeClients = clients.filter((c) => (clientProjectCount[c.id] || 0) > 0).length;
    const avgRevenue = total > 0 ? Math.round(totalRevenue / total) : 0;
    return { total, totalRevenue, activeClients, avgRevenue };
  }, [clients, total, totalRevenue]);

  // Project count per client
  const clientProjectCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of projects) {
      if (p.clientId) counts[p.clientId] = (counts[p.clientId] || 0) + 1;
    }
    return counts;
  }, [projects]);

  // Sort handler — cycles: asc → desc → clear
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortField('recent');
        setSortDir(null);
      }
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
    } else if (sortField === 'revenue') {
      sorted.sort((a, b) =>
        sortDir === 'asc'
          ? (a.totalRevenue || 0) - (b.totalRevenue || 0)
          : (b.totalRevenue || 0) - (a.totalRevenue || 0),
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

  const handleOpenNew = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const projCount = clientProjectCount[id] || 0;
    const msg =
      projCount > 0
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

  const handleSubmit = async (data: ClientFormData) => {
    try {
      if (editingClient) {
        await editClient(editingClient.id, data);
        toast.success('Client updated');
      } else {
        await addClient(data);
        toast.success('Client added');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save client');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <SummaryCardGrid>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </SummaryCardGrid>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Summary Stats */}
      <SummaryCardGrid>
        <SummaryCard
          label="Total Clients"
          value={stats.total}
          sub="All time"
          icon={<Users className="h-6 w-6" />}
        />
        <SummaryCard
          label="Active Clients"
          value={stats.activeClients}
          sub="Has projects"
          subColor="green"
          icon={<Users className="h-6 w-6" />}
        />
        <SummaryCard
          label="Total Revenue"
          value={formatIDR(stats.totalRevenue)}
          sub="Combined"
          subColor="default"
          icon={<Users className="h-6 w-6" />}
        />
        <SummaryCard
          label="Avg Revenue"
          value={formatIDR(stats.avgRevenue)}
          sub="Per client"
          subColor="default"
          icon={<Users className="h-6 w-6" />}
        />
      </SummaryCardGrid>

      {/* Search */}
      <TableSearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search clients..."
      />

      {/* Filter Tabs */}
      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as 'all' | 'has_projects');
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="all">All ({clients.length})</TabsTrigger>
          <TabsTrigger value="has_projects">Has Projects ({hasProjectsCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {paginated.length === 0 ? (
        <EmptyState
          icon={<Users className="h-16 w-16" />}
          title={search ? 'No clients found' : 'No clients yet'}
          description={
            search
              ? `Pencarian "${search}" tidak ditemukan.`
              : 'Add your first client to start managing relationships'
          }
          actionLabel={search ? 'Reset Filter' : 'Add Client'}
          onAction={search ? () => { setSearch(''); setPage(1); } : handleOpenNew}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-12 select-none text-xs font-medium">
                  #
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  <span
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('name')}
                  >
                    Name{' '}
                    <SortIcon
                      field="name"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">Company</TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">Contact</TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  Projects
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  <span
                    className="flex cursor-pointer items-center"
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue{' '}
                    <SortIcon
                      field="revenue"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground w-20 select-none text-xs font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((client, idx) => {
                const projectCount = clientProjectCount[client.id] || 0;
                return (
                  <TableRow key={client.id} className="border-border hover:bg-accent/50">
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {start + idx}
                    </TableCell>
                    <TableCell className="max-w-[200px] py-3">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[140px] py-3 text-sm">
                      <span className="truncate">{client.company || '—'}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {client.email && (
                          <a
                            href={`mailto:${client.email}`}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                          >
                            <Mail className="h-3 w-3" />
                            <span className="max-w-[120px] truncate">{client.email}</span>
                          </a>
                        )}
                        {client.whatsapp && (
                          <a
                            href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground flex items-center text-xs hover:text-green-500"
                          >
                            <span className="text-[10px]">WA</span>
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {projectCount > 0 ? (
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="text-primary hover:underline"
                        >
                          {projectCount}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {client.totalRevenue ? formatIDR(client.totalRevenue) : '—'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(client)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-7 w-7"
                          onClick={() => handleDelete(client.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingClient}
      />
    </div>
  );
}