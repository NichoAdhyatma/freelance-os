'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowRight, Calendar, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { type Project, type ProjectPriority, type ProjectStatus } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  review: { label: 'Review', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  done: { label: 'Done', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

const PRIORITY_CONFIG: Record<ProjectPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-500' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-500' },
};

const NEXT_STATUS: Record<ProjectStatus, ProjectStatus> = {
  backlog: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: 'backlog',
};

export function ProjectCard({ project, onEdit, onDelete, onStatusChange }: ProjectCardProps) {
  const router = useRouter();
  const status = project.status as ProjectStatus;
  const priority = project.priority as ProjectPriority;
  const statusConfig = STATUS_CONFIG[status];
  const priorityConfig = PRIORITY_CONFIG[priority];

  const deadlineDate = project.deadline ? project.deadline.toDate() : null;
  const isOverdue = deadlineDate && deadlineDate < new Date() && status !== 'done';

  return (
    <Card
      className="group hover:border-primary/50 relative cursor-pointer transition-all hover:shadow-md"
      onClick={() => router.push(`/dashboard/projects/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{project.title}</CardTitle>
            {project.description && (
              <CardDescription className="mt-1 line-clamp-2">{project.description}</CardDescription>
            )}
          </div>

          <DropdownMenu onOpenChange={() => {}}>
            <DropdownMenuTrigger
              className="hover:bg-accent h-8 w-8 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onStatusChange(project.id, NEXT_STATUS[status])}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Move to {STATUS_CONFIG[NEXT_STATUS[status]].label}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(project.id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2">
          <Badge className={statusConfig.color} variant="outline">
            {statusConfig.label}
          </Badge>
          <Badge className={priorityConfig.color} variant="outline">
            {priorityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        {deadlineDate && (
          <div
            className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {isOverdue ? 'Overdue • ' : ''}
              {format(deadlineDate, 'dd MMM yyyy', { locale: id })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
