'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type Task, type TaskPriority } from '@/types/task';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/10 text-blue-500',
  high: 'bg-orange-500/10 text-orange-500',
  urgent: 'bg-red-500/10 text-red-500',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <Card className={cn('group flex items-start gap-2 p-3 transition-all hover:border-primary/30')}>
      {/* Drag handle */}
      <div className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium">{task.title}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn('text-[10px] px-1.5 py-0 h-4', PRIORITY_COLORS[task.priority])}
          >
            {PRIORITY_LABELS[task.priority]}
          </Badge>

          {task.dueDate && (
            <span className="text-muted-foreground text-[10px]">
              {format(task.dueDate.toDate(), 'dd MMM')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit(task);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(task.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
