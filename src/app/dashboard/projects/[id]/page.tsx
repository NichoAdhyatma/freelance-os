'use client';

import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FolderKanban,
  Pencil,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { use } from 'react';
import { toast } from 'sonner';

import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaskForm } from '@/components/projects/TaskForm';
import { TaskKanban, type TaskKanbanHandle } from '@/components/projects/TaskKanban';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { setDashboardTitle } from '@/app/dashboard/_context';
import type { ProjectPriority, ProjectStatus } from '@/types/project';
import { type Task, type TaskFormData } from '@/types/task';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  backlog: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  done: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  low: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
  setDashboardTitle('Project Details');
  const { id } = use(params);
  const { projects, loading: projectsLoading, editProject } = useProjects();
  const { getClientById } = useClients();
  const { loading: authLoading } = useAuth();
  const kanbanRef = useRef<TaskKanbanHandle>(null);
  const { total: taskTotal, doneCount: taskDone, editTask } = useTasks({ projectId: id });

  const [formOpen, setFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<Task['status']>('todo');

  const project = projects.find((p) => p.id === id);
  const loading = projectsLoading || authLoading;
  const client = project?.clientId ? getClientById(project.clientId) : null;

  const deadlineDate = project?.deadline?.toDate();
  const isProjectOverdue = deadlineDate && deadlineDate < new Date() && project?.status !== 'done';

  const handleEditSubmit = async (data: any) => {
    await editProject(id, data);
    toast.success('Project updated');
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setDefaultTaskStatus(task.status);
    setTaskFormOpen(true);
  };

  const handleTaskSubmit = async (data: TaskFormData) => {
    if (editingTask) {
      await editTask(editingTask.id, data);
      toast.success('Task updated');
    } else {
      // handled by TaskKanban inline add
    }
    setTaskFormOpen(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-10" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-4" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="ml-auto h-9 w-28" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <FolderKanban className="text-muted-foreground/30 mb-4 h-12 w-12" />
        <h2 className="mb-2 text-xl font-semibold">Project Not Found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          This project does not exist or has been deleted.
        </p>
        <Link
          href="/dashboard/projects"
          className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Projects
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="truncate text-xl font-semibold">{project.title}</h1>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => setFormOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </div>
            <Progress value={project.progress} className="h-2" />
            <p className="text-muted-foreground text-xs">{project.progress}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <CheckCircle className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {taskDone}/{taskTotal}
              </p>
              <p className="text-muted-foreground text-xs">Tasks Done</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isProjectOverdue ? 'bg-red-500/10' : 'bg-yellow-500/10'
              }`}
            >
              <Clock
                className={`h-5 w-5 ${isProjectOverdue ? 'text-red-500' : 'text-yellow-500'}`}
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                {deadlineDate ? format(deadlineDate, 'dd MMM yyyy') : 'No deadline'}
              </p>
              <p className="text-muted-foreground text-xs">Due Date</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskKanban ref={kanbanRef} projectId={id} onEditTask={handleTaskEdit} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Title</p>
                  <p className="text-sm font-medium">{project.title}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Client</p>
                  <p className="text-sm">{client?.name ?? '—'}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Description
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {project.description || 'No description'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Deadline</p>
                  <p className="flex items-center gap-1 text-sm">
                    {isProjectOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    {deadlineDate ? format(deadlineDate, 'dd MMMM yyyy') : 'No deadline'}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Status</p>
                  <Badge className={STATUS_COLORS[project.status as ProjectStatus]}>
                    {STATUS_LABELS[project.status as ProjectStatus]}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Priority</p>
                  <Badge className={PRIORITY_COLORS[project.priority as ProjectPriority]}>
                    {PRIORITY_LABELS[project.priority as ProjectPriority]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground text-sm">
                {project.description || 'No notes for this project yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleEditSubmit}
        initialData={project}
      />

      {/* Task Edit Dialog */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={(open) => {
          setTaskFormOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        initialData={editingTask}
        defaultStatus={defaultTaskStatus}
      />
    </div>
  );
}
