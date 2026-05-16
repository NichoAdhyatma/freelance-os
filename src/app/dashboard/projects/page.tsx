'use client';

import { FolderKanban, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { openContextMenu } from '@/components/shared/RowContextMenu';
import { InlineAddClientCard } from '@/components/clients/InlineAddClientCard';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/DataTableSkeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { SummaryCard, SummaryCardGrid } from '@/components/dashboard/SummaryCard';
import { ProjectRow, ProjectAddRow } from '@/components/projects/ProjectRow';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjects } from '@/hooks/useProjects';
import { setDashboardTitle } from '@/app/dashboard/_context';
import { type ProjectFormData } from '@/types/project';

type SortField = 'recent' | 'title' | 'priority' | 'budget' | 'deadline' | null;
type SortDir = 'asc' | 'desc' | null;

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  setDashboardTitle('Projects');

  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { projects, loading, addProject, editProject, removeProject } = useProjects();
  const { getClientById } = useClients();

  const [addingRow, setAddingRow] = useState(false);
  const [addingClientInline, setAddingClientInline] = useState(false);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('recent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const total = projects.length;
    const active = projects.filter(
      (p) => p.status === 'in_progress' || p.status === 'review' || p.status === 'backlog',
    ).length;
    const done = projects.filter((p) => p.status === 'done').length;
    const overdue = projects.filter((p) => {
      if (!p.deadline || p.status === 'done') return false;
      return p.deadline.toDate() < now;
    }).length;
    return { total, active, done, overdue };
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

  // Filtered + sorted + paginated
  const filtered = useMemo(() => {
    let result = projects;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          getClientById(p.clientId ?? '')
            ?.name.toLowerCase()
            .includes(q),
      );
    }

    const sorted = [...result];
    if (sortField === 'title') {
      sorted.sort((a, b) =>
        sortDir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title),
      );
    } else if (sortField === 'budget') {
      sorted.sort((a, b) =>
        sortDir === 'asc' ? (a.budget || 0) - (b.budget || 0) : (b.budget || 0) - (a.budget || 0),
      );
    } else if (sortField === 'deadline') {
      sorted.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return sortDir === 'asc'
          ? a.deadline.toMillis() - b.deadline.toMillis()
          : b.deadline.toMillis() - a.deadline.toMillis();
      });
    }
    return sorted;
  }, [projects, debouncedSearch, sortField, sortDir, getClientById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleOpenNew = () => {
    setPendingClientId(null);
    setAddingRow(true);
  };

  const handleCancelAdd = () => {
    setAddingRow(false);
    setPendingClientId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project? This action cannot be undone.')) return;
    try {
      await removeProject(id);
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleSubmitInline = async (data: ProjectFormData) => {
    try {
      await addProject(data);
      toast.success('Project created');
      setAddingRow(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
      throw err;
    }
  };

  const handleCellSave = async (id: string, data: Partial<ProjectFormData>) => {
    await editProject(id, data);
  };

  if (authLoading || loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Summary Stats */}
      <SummaryCardGrid>
        <SummaryCard
          label="Total Projects"
          value={stats.total}
          sub="All time"
          icon={<FolderKanban className="h-6 w-6" />}
        />
        <SummaryCard
          label="Active"
          value={stats.active}
          sub="In progress"
          subColor="yellow"
          icon={<FolderKanban className="h-6 w-6" />}
        />
        <SummaryCard
          label="Completed"
          value={stats.done}
          sub="Done"
          subColor="green"
          icon={<FolderKanban className="h-6 w-6" />}
        />
        <SummaryCard
          label="Overdue"
          value={stats.overdue}
          sub="Need attention"
          subColor="red"
          icon={<FolderKanban className="h-6 w-6" />}
        />
      </SummaryCardGrid>

      {/* Search */}
      <TableSearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search projects or clients..."
      />

      {/* Inline add row */}
      {addingRow && (
        <>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full">
              <tbody>
                <ProjectAddRow
                  onSave={handleSubmitInline}
                  onCancel={handleCancelAdd}
                  pendingClientId={pendingClientId}
                  onAddClient={() => setAddingClientInline(true)}
                />
              </tbody>
            </table>
          </div>
          <InlineAddClientCard
            open={addingClientInline}
            onClose={() => setAddingClientInline(false)}
            onCreated={(clientId) => {
              setPendingClientId(clientId);
              setAddingClientInline(false);
            }}
          />
        </>
      )}

      {/* Table or Empty State */}
      {paginated.length === 0 && !addingRow ? (
        <EmptyState
          variant={search ? 'no-results' : 'no-data'}
          title={search ? 'No projects found' : 'No projects yet'}
          description={
            search
              ? `Pencarian "${search}" tidak ditemukan.`
              : 'Create your first project to start tracking work'
          }
          actionLabel={search ? 'Reset Filter' : 'Create Project'}
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
                  <span className="flex cursor-pointer items-center gap-1" onClick={() => handleSort('title')}>
                    Title <SortIcon field="title" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  Client
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  Priority
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  <span className="flex cursor-pointer items-center gap-1" onClick={() => handleSort('budget')}>
                    Budget <SortIcon field="budget" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  Progress
                </TableHead>
                <TableHead className="text-muted-foreground select-none text-xs font-medium">
                  <span className="flex cursor-pointer items-center gap-1" onClick={() => handleSort('deadline')}>
                    Deadline <SortIcon field="deadline" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground w-20 select-none text-xs font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((project, idx) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={start + idx - 1}
                  onSave={(data) => handleCellSave(project.id, data)}
                  onDelete={() => handleDelete(project.id)}
                  onNavigate={() => router.push(`/dashboard/projects/${project.id}`)}
                  onAddClient={() => setAddingClientInline(true)}
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-border flex items-center justify-between border-t px-6 py-4">
              <p className="text-muted-foreground text-sm">
                {filtered.length === 0 ? 'No results' : `Showing ${start}–${Math.min(start + PAGE_SIZE - 1, filtered.length)} of ${filtered.length}`}
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
    </div>
  );
}