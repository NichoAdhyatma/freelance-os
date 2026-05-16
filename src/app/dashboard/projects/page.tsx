'use client';

import { format } from 'date-fns';
import { AlertTriangle, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/DataTableSkeleton';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ProjectInlineRow } from '@/components/projects/ProjectInlineRow';
import { InlineAddClientCard } from '@/components/clients/InlineAddClientCard';
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { SummaryCard, SummaryCardGrid } from '@/components/dashboard/SummaryCard';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useDebounce } from '@/hooks/useDebounce';
import { useProjects } from '@/hooks/useProjects';
import { setDashboardTitle } from '@/app/dashboard/_context';
import { type Project, type ProjectFormData } from '@/types/project';
import { formatIDR } from '@/lib/utils';

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

type SortField = 'recent' | 'title' | 'priority' | 'budget' | 'deadline' | null;
type SortDir = 'asc' | 'desc' | null;

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  setDashboardTitle('Projects');

  const { loading: authLoading } = useAuth();
  const { projects, loading, addProject, editProject, removeProject } = useProjects();
  const { getClientById } = useClients();

  const [addingRow, setAddingRow] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
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
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length);
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
                <ProjectInlineRow
                  mode="add"
                  onSave={handleSubmitInline}
                  onCancel={handleCancelAdd}
                  pendingClientId={pendingClientId}
                  onAddingClientChange={(adding) => setAddingClientInline(adding)}
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
              {/* Edit row — replaces display row at same position */}
              {editingProjectId && (() => {
                const project = projects.find((p) => p.id === editingProjectId);
                if (!project) return null;
                return (
                  <ProjectInlineRow
                    key={project.id}
                    mode="edit"
                    initialData={project}
                    onSave={async (data) => {
                      await editProject(editingProjectId, data);
                      toast.success('Project updated');
                      setEditingProjectId(null);
                    }}
                    onCancel={() => setEditingProjectId(null)}
                    pendingClientId={pendingClientId}
                    onAddingClientChange={(adding) => setAddingClientInline(adding)}
                  />
                );
              })()}

              {/* Existing rows */}
              {paginated
                .filter((p) => p.id !== editingProjectId)
                .map((project, idx) => {
                  const client = project.clientId ? getClientById(project.clientId) : null;
                  const deadline = project.deadline?.toDate();
                  const isOverdue = deadline && deadline < new Date() && project.status !== 'done';

                  return (
                    <TableRow
                      data-edit-row
                      key={project.id}
                      className="border-border hover:bg-accent/50 cursor-pointer"
                      onClick={() => setEditingProjectId(project.id)}
                    >
                    <TableCell className="text-muted-foreground py-3 text-sm">{start + idx}</TableCell>
                    <TableCell className="max-w-[200px] py-3">
                      <span className="block truncate font-medium">{project.title}</span>
                    </TableCell>
                    <TableCell className="max-w-[140px] py-3">
                      <span className="text-muted-foreground block truncate text-sm">
                        {client?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.medium}>
                        {PRIORITY_LABELS[project.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {project.budget ? formatIDR(project.budget) : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 w-20" />
                        <span className="text-muted-foreground w-8 text-xs">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {deadline ? (
                        <span className="flex items-center gap-1 text-sm">
                          {isOverdue && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
                          <span className={isOverdue ? 'text-red-400' : 'text-muted-foreground'}>
                            {format(deadline, 'dd MMM yyyy')}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingProjectId(project.id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-7 w-7"
                          onClick={() => handleDelete(project.id)}
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
                {filtered.length === 0 ? 'No results' : `Showing ${start}–${end} of ${filtered.length}`}
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