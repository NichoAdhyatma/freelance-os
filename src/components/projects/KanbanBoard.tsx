'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type Project, type ProjectStatus } from '@/types/project';

import { ProjectCard } from './ProjectCard';

interface KanbanBoardProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  onAddProject: (status: ProjectStatus) => void;
}

const COLUMNS: { status: ProjectStatus; label: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog', color: 'bg-muted' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-500/10' },
  { status: 'review', label: 'Review', color: 'bg-yellow-500/10' },
  { status: 'done', label: 'Done', color: 'bg-green-500/10' },
];

export function KanbanBoard({
  projects,
  onEdit,
  onDelete,
  onStatusChange,
  onAddProject,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colProjects = projects.filter((p) => p.status === col.status);

        return (
          <div
            key={col.status}
            className="bg-muted/30 flex w-72 shrink-0 flex-col rounded-lg border"
          >
            {/* Column Header */}
            <div
              className={cn(
                'flex items-center justify-between rounded-t-lg border-b p-3',
                col.color,
              )}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="bg-muted text-muted-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium">
                  {colProjects.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onAddProject(col.status)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Column Content */}
            <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto p-3">
              {colProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground text-sm">No projects</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 text-xs"
                    onClick={() => onAddProject(col.status)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              ) : (
                colProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
