'use client';

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Plus, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTasks } from '@/hooks/useTasks';
import { swapTaskOrders } from '@/lib/services/taskService';
import { type Task, type TaskStatus } from '@/types/task';

import { TaskCard } from './TaskCard';

export interface TaskKanbanHandle {
  startEdit: (task: Task) => void;
}

interface TaskKanbanProps {
  projectId: string;
  onEditTask?: (task: Task) => void;
}

// ─── Sortable wrapper ────────────────────────────────────────────────────────

interface SortableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function SortableTaskCard({ task, onEdit, onDelete }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} className="contents">
        <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

// ─── Column definition ────────────────────────────────────────────────────────

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

// ─── Main component ───────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  tasks,
  addingToColumn,
  newTaskTitle,
  onAddClick,
  onAddChange,
  onAddKeyDown,
  onAddSubmit,
  onAddCancel,
  onEditTask,
  onDeleteTask,
}: {
  column: { id: TaskStatus; label: string };
  tasks: Task[];
  addingToColumn: TaskStatus | null;
  newTaskTitle: string;
  onAddClick: () => void;
  onAddChange: (v: string) => void;
  onAddKeyDown: (e: React.KeyboardEvent) => void;
  onAddSubmit: () => void;
  onAddCancel: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef} className="flex w-72 flex-shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{column.label}</span>
        <span className="text-muted-foreground text-xs">{tasks.length}</span>
      </div>

      {/* Sortable task list */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          className={`min-h-[200px] flex-1 space-y-2 rounded-lg transition-colors ${isOver ? 'bg-primary/5 border-primary/30 border-2 border-dashed' : ''}`}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}

          {/* Inline add */}
          {addingToColumn === column.id ? (
            <div className="border-border bg-card space-y-2 rounded-lg border p-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => onAddChange(e.target.value)}
                placeholder="Task title..."
                autoFocus
                onKeyDown={onAddKeyDown}
              />
              <div className="flex items-center gap-1">
                <Button size="sm" className="h-7 flex-1" onClick={onAddSubmit}>
                  <Check className="mr-1 h-3 w-3" />
                  Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onAddCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={onAddClick}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </button>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const TaskKanban = forwardRef<TaskKanbanHandle, TaskKanbanProps>(
  ({ projectId, onEditTask }, ref) => {
    const { tasks, byStatus, addTask, moveTask, removeTask } = useTasks({ projectId });

    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      }),
    );

    useImperativeHandle(ref, () => ({
      startEdit: (task: Task) => onEditTask?.(task),
    }));

    const handleDragStart = (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      setActiveTask(task ?? null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const task = tasks.find((t) => t.id === activeId);
      if (!task) return;

      // overId is a column id → empty column drop
      if (COLUMNS.some((col) => col.id === overId)) {
        if (overId !== task.status) {
          await moveTask(activeId, overId as TaskStatus);
        }
        return;
      }

      // overId is a task id
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;

      const targetStatus = overTask.status;

      if (targetStatus !== task.status) {
        // Cross-column: insert at overTask's position
        const columnTasks = byStatus(targetStatus);
        const overIndex = columnTasks.findIndex((t) => t.id === overId);
        const nextTask = columnTasks[overIndex + 1] as Task | undefined;
        const newOrder = nextTask
          ? (nextTask as Task).order + 0.5
          : (columnTasks[overIndex] as Task).order + 1;
        await moveTask(activeId, targetStatus, newOrder);
      } else {
        // Same column: atomic swap using batch write
        if (activeId === overId) return;

        const columnTasks = byStatus(targetStatus);
        const overTaskObj = columnTasks.find((t) => t.id === overId);
        const activeTaskObj = columnTasks.find((t) => t.id === activeId);
        if (!overTaskObj || !activeTaskObj) return;

        try {
          await swapTaskOrders(projectId, activeTaskObj, overTaskObj);
        } catch (err) {
          toast.error('Failed to reorder tasks. Please try again.');
        }
      }
    };

    const handleInlineAdd = async (status: TaskStatus) => {
      if (!newTaskTitle.trim()) return;
      try {
        await addTask({ title: newTaskTitle.trim(), status, priority: 'medium' });
        setNewTaskTitle('');
        setAddingToColumn(null);
      } catch (err: any) {
        console.error('Failed to add task:', err?.message ?? err);
      }
    };

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={byStatus(column.id)}
              addingToColumn={addingToColumn}
              newTaskTitle={newTaskTitle}
              onAddClick={() => {
                setAddingToColumn(column.id);
                setNewTaskTitle('');
              }}
              onAddChange={setNewTaskTitle}
              onAddKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineAdd(column.id);
                if (e.key === 'Escape') {
                  setAddingToColumn(null);
                  setNewTaskTitle('');
                }
              }}
              onAddSubmit={() => handleInlineAdd(column.id)}
              onAddCancel={() => {
                setAddingToColumn(null);
                setNewTaskTitle('');
              }}
              onEditTask={onEditTask ?? ((/* task */) => {})}
              onDeleteTask={(id) => removeTask(id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    );
  },
);

TaskKanban.displayName = 'TaskKanban';
