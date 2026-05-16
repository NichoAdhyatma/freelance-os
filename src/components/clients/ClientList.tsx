'use client';

import { Search, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDebounce } from '@/hooks/useDebounce';
import { type Client } from '@/types/client';
import { type Project } from '@/types/project';

import { ClientCard } from './ClientCard';

type FilterTab = 'all' | 'has_projects' | 'has_invoices';
type SortOption = 'recent' | 'name_asc' | 'revenue_desc';

interface ClientListProps {
  clients: Client[];
  projects: Project[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
}

export function ClientList({ clients, projects, onEdit, onDelete }: ClientListProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sort, setSort] = useState<SortOption>('recent');

  const debouncedSearch = useDebounce(search, 300);

  const clientProjectCount = useMemo(() => {
    const counts: Record<string, { total: number; active: number }> = {};
    for (const p of projects) {
      if (!p.clientId) continue;
      if (!counts[p.clientId]) counts[p.clientId] = { total: 0, active: 0 };
      counts[p.clientId].total++;
      if (p.status === 'in_progress') counts[p.clientId].active++;
    }
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    let result = clients;

    // Search filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      );
    }

    // Tab filter
    if (filter === 'has_projects') {
      result = result.filter((c) => (clientProjectCount[c.id]?.total ?? 0) > 0);
    }

    // Sort
    const sorted = [...result];
    if (sort === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'revenue_desc') {
      sorted.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    } else {
      // recent (default) - already sorted by createdAt desc from service
    }
    return sorted;
  }, [clients, debouncedSearch, filter, sort, clientProjectCount]);

  const handleDelete = useCallback(
    (id: string) => {
      const projCount = clientProjectCount[id]?.total ?? 0;
      const message =
        projCount > 0
          ? `This client has ${projCount} project(s). Are you sure you want to delete?`
          : 'Delete this client? This action cannot be undone.';
      if (!confirm(message)) return;
      onDelete(id);
    },
    [clients, clientProjectCount, onDelete],
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="border-border bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="recent">Recent</option>
            <option value="name_asc">Name A–Z</option>
            <option value="revenue_desc">Revenue ↓</option>
          </select>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
        <TabsList>
          <TabsTrigger value="all">All ({clients.length})</TabsTrigger>
          <TabsTrigger value="has_projects">
            Has Projects ({clients.filter((c) => (clientProjectCount[c.id]?.total ?? 0) > 0).length}
            )
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid or Empty */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <Users className="text-muted-foreground/30 mb-4 h-16 w-16" />
          <h3 className="mb-1 text-lg font-semibold">
            {debouncedSearch ? 'No clients found' : 'No clients yet'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {debouncedSearch
              ? `No clients matching "${debouncedSearch}"`
              : 'Add your first client to start managing relationships'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => {
            const stats = clientProjectCount[client.id] || { total: 0, active: 0 };
            return (
              <ClientCard
                key={client.id}
                client={client}
                projectCount={stats.total}
                activeProjectCount={stats.active}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
