'use client';

import { FolderKanban, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { setDashboardTitle } from '@/app/dashboard/_context';
import { InlineAddClientCard } from '@/components/clients/InlineAddClientCard';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { QuickAddInvoiceSheet } from '@/components/invoices/QuickAddInvoiceSheet';
import { ProjectAddRow, ProjectRow, PROJECT_COLUMNS } from '@/components/projects/ProjectRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/DataTableSkeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjects } from '@/hooks/useProjects';
import { type ProjectFormData } from '@/types/project';

type SortField = 'recent' | 'title' | 'priority' | 'deadline' | null;
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
  const [addingInvoiceInline, setAddingInvoiceInline] = useState(false);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
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
    let result = projects;

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          getClientById(p.clientId ?? '')?.name.toLowerCase().includes(q),
      );
    }

    const sorted = [...result];
    if (sortField === 'title') {
      sorted.sort((a, b) =>
        sortDir === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title),
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

  const handleDuplicate = async (project: typeof projects[number]) => {
    try {
      const { title, clientId, priority } = project;
      await addProject({
        title: `${title} (Copy)`,
        clientId: clientId || undefined,
        priority: priority || 'medium',
        status: 'backlog',
      });
      toast.success('Project duplicated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate project');
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
      {/* Summary Stats */}
      <StatsGrid
        items={[
          { label: 'Total Projects', value: stats.total, sub: 'All time', icon: <FolderKanban className="h-5 w-5" /> },
          { label: 'Active', value: stats.active, sub: 'In progress', subColor: 'yellow', icon: <FolderKanban className="h-5 w-5" /> },
          { label: 'Completed', value: stats.done, sub: 'Done', subColor: 'green', icon: <FolderKanban className="h-5 w-5" /> },
          { label: 'Overdue', value: stats.overdue, sub: 'Need attention', subColor: 'red', icon: <FolderKanban className="h-5 w-5" /> },
        ]}
      />

      {/* Search + Create */}
      <div className="flex items-center justify-between gap-4">
        <TableSearchBar
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search projects or clients..."
        />
        <Button
          onClick={() => { setPage(1); setAddingRow(true); setPendingClientId(null); }}
          size="sm"
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

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
          onAction={search ? () => { setSearch(''); setPage(1); } : () => { setPage(1); setAddingRow(true); setPendingClientId(null); }}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)]">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="border-[var(--border-default)]">
                <TableHead
                  className={`select-none text-xs font-medium ${PROJECT_COLUMNS.index} border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pl-4 pr-2 shrink-0`}
                >
                  #
                </TableHead>
                <TableHead
                  className={`select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pr-2 ${PROJECT_COLUMNS.title} overflow-hidden shrink-0`}
                >
                  <span className="flex cursor-pointer items-center gap-1 truncate" onClick={() => handleSort('title')}>
                    Title <SortIcon field="title" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                  </span>
                </TableHead>
                <TableHead
                  className={`select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pr-2 ${PROJECT_COLUMNS.client} overflow-hidden shrink-0`}
                >
                  Client
                </TableHead>
                <TableHead
                  className={`select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pr-2 ${PROJECT_COLUMNS.priority} shrink-0`}
                >
                  Priority
                </TableHead>
                <TableHead
                  className={`select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pr-2 ${PROJECT_COLUMNS.progress} shrink-0`}
                >
                  Progress
                </TableHead>
                <TableHead
                  className={`select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pr-2 ${PROJECT_COLUMNS.deadline} overflow-hidden shrink-0`}
                >
                  <span className="flex cursor-pointer items-center gap-1" onClick={() => handleSort('deadline')}>
                    Deadline <SortIcon field="deadline" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
                  </span>
                </TableHead>
                <TableHead
                  className={`select-none text-xs font-medium border-r border-[var(--border-default)] text-[var(--text-tertiary)] py-2 pr-2 ${PROJECT_COLUMNS.invoice} overflow-hidden shrink-0`}
                >
                  Invoice
                </TableHead>
                {addingRow && (
                  <TableHead
                    className={`select-none text-xs font-medium text-[var(--text-tertiary)] py-2 pr-4 ${PROJECT_COLUMNS.actions} shrink-0`}
                  >
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {addingRow && (
                <ProjectAddRow
                  key="__add__"
                  onSave={handleSubmitInline}
                  onCancel={handleCancelAdd}
                  pendingClientId={pendingClientId}
                  onAddClient={() => setAddingClientInline(true)}
                />
              )}
              {paginated.map((project, idx) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  index={start + idx}
                  showActions={addingRow}
                  onSave={(data) => handleCellSave(project.id, data)}
                  onDelete={() => handleDelete(project.id)}
                  onDuplicate={() => handleDuplicate(project)}
                  onAddNew={() => { setPage(1); setAddingRow(true); setPendingClientId(null); }}
                  onOpen={() => router.push(`/dashboard/projects/${project.id}`)}
                  onAddClient={() => setAddingClientInline(true)}
                  onAddInvoice={(projectId) => { setPendingProjectId(projectId); setAddingInvoiceInline(true); }}
                />
              ))}
            </TableBody>
          </Table>

          <InlineAddClientCard
            open={addingClientInline}
            onClose={() => setAddingClientInline(false)}
            onCreated={(clientId) => {
              setPendingClientId(clientId);
              setAddingClientInline(false);
            }}
          />

          <QuickAddInvoiceSheet
            open={addingInvoiceInline}
            onOpenChange={(open) => {
              setAddingInvoiceInline(open);
              if (!open) setPendingProjectId(null);
            }}
            initialProjectId={pendingProjectId ?? undefined}
            initialClientId={pendingProjectId ? projects.find((p) => p.id === pendingProjectId)?.clientId ?? undefined : undefined}
            onCreated={(invoiceId) => {
              setAddingInvoiceInline(false);
              setPendingProjectId(null);
              if (pendingProjectId) editProject(pendingProjectId, { invoiceId });
            }}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-default)]"
            >
              <p className="text-sm text-[var(--text-tertiary)]">
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
