'use client';

import { format } from 'date-fns';
import { AlertTriangle, FolderKanban, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ProjectForm } from '@/components/projects/ProjectForm';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { SummaryCardGrid } from '@/components/dashboard/SummaryCard';
import { StatItem } from '@/components/dashboard/SummaryCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { projects, loading, addProject, editProject, removeProject } = useProjects();
  const { getClientById } = useClients();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    return { total, active, done, overdue, totalBudget };
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
    setEditingProject(null);
    setFormOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
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

  const handleSubmit = async (data: ProjectFormData) => {
    try {
      if (editingProject) {
        await editProject(editingProject.id, data);
        toast.success('Project updated');
      } else {
        await addProject(data);
        toast.success('Project created');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
      throw err;
    }
  };

  if (authLoading || loading) {
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
          New Project
        </Button>
      </div>

      {/* Summary Stats */}
      <SummaryCardGrid>
        <div className="bg-card border-border col-span-2 flex items-center justify-between rounded-xl border px-5 py-4 lg:col-span-1">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium">Total Projects</p>
            <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
          </div>
          <FolderKanban className="text-muted-foreground h-8 w-8" />
        </div>
        <div className="bg-card border-border col-span-2 flex items-center justify-between rounded-xl border px-5 py-4 lg:col-span-1">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium">Active</p>
            <p className="text-3xl font-bold tracking-tight">{stats.active}</p>
          </div>
          <FolderKanban className="text-yellow-500 h-8 w-8" />
        </div>
        <div className="bg-card border-border col-span-2 flex items-center justify-between rounded-xl border px-5 py-4 lg:col-span-1">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium">Completed</p>
            <p className="text-3xl font-bold tracking-tight">{stats.done}</p>
          </div>
          <FolderKanban className="text-green-500 h-8 w-8" />
        </div>
        <div className="bg-card border-border col-span-2 flex items-center justify-between rounded-xl border px-5 py-4 lg:col-span-1">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium">Total Budget</p>
            <p className="text-3xl font-bold tracking-tight">{formatIDR(stats.totalBudget)}</p>
          </div>
          <FolderKanban className="text-muted-foreground h-8 w-8" />
        </div>
      </SummaryCardGrid>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search by project or client name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pr-8 pl-9"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              setPage(1);
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <FolderKanban className="text-muted-foreground/30 mb-4 h-16 w-16" />
          <h3 className="mb-1 text-lg font-semibold">
            {search ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-muted-foreground mb-4 text-sm">
            {search
              ? `No results for "${search}"`
              : 'Create your first project to start tracking work'}
          </p>
          {!search && (
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
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
                  <span
                    className="flex cursor-pointer items-center gap-1"
                    onClick={() => handleSort('title')}
                  >
                    Title{' '}
                    <SortIcon
                      field="title"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">
                  Priority
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">
                  <span
                    className="flex cursor-pointer items-center gap-1"
                    onClick={() => handleSort('budget')}
                  >
                    Budget{' '}
                    <SortIcon
                      field="budget"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">
                  Progress
                </TableHead>
                <TableHead className="text-muted-foreground text-xs font-medium">
                  <span
                    className="flex cursor-pointer items-center gap-1"
                    onClick={() => handleSort('deadline')}
                  >
                    Deadline{' '}
                    <SortIcon
                      field="deadline"
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    />
                  </span>
                </TableHead>
                <TableHead className="text-muted-foreground w-20 text-xs font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((project, idx) => {
                const client = project.clientId ? getClientById(project.clientId) : null;
                const deadline = project.deadline?.toDate();
                const isOverdue = deadline && deadline < new Date() && project.status !== 'done';

                return (
                  <TableRow
                    key={project.id}
                    className="border-border hover:bg-accent/50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  >
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {start + idx}
                    </TableCell>
                    <TableCell className="max-w-[200px] py-3">
                      <span className="block truncate font-medium">{project.title}</span>
                    </TableCell>
                    <TableCell className="max-w-[140px] py-3">
                      <span className="text-muted-foreground block truncate text-sm">
                        {client?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        className={PRIORITY_COLORS[project.priority] ?? PRIORITY_COLORS.medium}
                      >
                        {PRIORITY_LABELS[project.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground py-3 text-sm">
                      {project.budget ? formatIDR(project.budget) : '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2 w-20" />
                        <span className="text-muted-foreground w-8 text-xs">
                          {project.progress}%
                        </span>
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
                          onClick={() => handleEdit(project)}
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
                  Next ��
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={editingProject}
      />
    </div>
  );
}