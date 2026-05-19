'use client';

import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FolderKanban,
  Pencil,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { use } from 'react';
import { toast } from 'sonner';

import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { TaskForm } from '@/components/projects/TaskForm';
import { TaskKanban, type TaskKanbanHandle } from '@/components/projects/TaskKanban';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { formatIDR } from '@/lib/utils';
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
  const { invoices, remove: removeInvoice, markPaid, add: addInvoice } = useInvoices();

  const [formOpen, setFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<Task['status']>('todo');
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);

  const projectInvoices = invoices.filter((i) => i.projectId === id);

  const totalBilled = projectInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = projectInvoices.reduce((sum, i) => {
    if (i.status === 'paid') return sum + i.amount;
    if ((i.amountPaid ?? 0) > 0) return sum + i.amountPaid!;
    return sum;
  }, 0);
  const outstanding = totalBilled - totalPaid;

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

  const handleCreateInvoice = async (data: any) => {
    await addInvoice(data);
    toast.success('Invoice created');
  };

  const getInvoiceStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      paid: 'bg-green-500/10 text-green-400 border-green-500/20',
      overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
      cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };
    return colors[status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
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
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskKanban ref={kanbanRef} projectId={id} onEditTask={handleTaskEdit} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {projectInvoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="text-muted-foreground/20 mb-3 h-10 w-10" />
                <h3 className="mb-1 text-sm font-medium">No invoices for this project yet</h3>
                <p className="text-muted-foreground mb-4 text-xs">
                  Create your first invoice to track payments for this project.
                </p>
                <Button size="sm" onClick={() => setInvoiceFormOpen(true)}>
                  Create First Invoice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Total Billed</p>
                    <p className="text-xl font-bold">{formatIDR(totalBilled)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Total Paid</p>
                    <p className="text-xl font-bold text-green-500">{formatIDR(totalPaid)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Outstanding</p>
                    <p className="text-xl font-bold text-yellow-500">{formatIDR(outstanding)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Invoice Table */}
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Invoice #</TableHead>
                      <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Amount</TableHead>
                      <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Status</TableHead>
                      <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Due Date</TableHead>
                      <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="border-border border-r font-mono text-xs">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell className="border-border border-r text-sm font-medium">
                          {formatIDR(inv.amount)}
                        </TableCell>
                        <TableCell className="border-border border-r">
                          <Badge className={getInvoiceStatusColor(inv.status)}>
                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-border border-r text-sm text-muted-foreground">
                          {format(inv.dueDate.toDate(), 'dd MMM yyyy', { locale: idLocale })}
                        </TableCell>
                        <TableCell className="flex items-center gap-2">
                          {inv.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={async () => {
                                await markPaid(inv.id, inv.amount);
                                toast.success('Invoice marked as paid');
                              }}
                            >
                              Mark Paid
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-red-500 hover:text-red-400"
                            onClick={async () => {
                              if (!confirm('Delete this invoice?')) return;
                              await removeInvoice(inv.id);
                              toast.success('Invoice deleted');
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Create Button */}
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setInvoiceFormOpen(true)}>
                  Create Invoice
                </Button>
              </div>
            </div>
          )}
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

      {/* Invoice Form Dialog */}
      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        onSubmit={handleCreateInvoice}
        defaultClientId={project.clientId}
        defaultProjectId={id}
      />
    </div>
  );
}
