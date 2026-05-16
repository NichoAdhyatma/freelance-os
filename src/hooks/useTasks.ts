'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { updateProjectProgress } from '@/lib/services/projectService';
import {
  createTask,
  deleteTask,
  subscribeToTasks,
  updateTask,
  updateTaskStatus,
} from '@/lib/services/taskService';
import { type Task, type TaskFormData, type TaskStatus } from '@/types/task';

interface UseTasksOptions {
  projectId: string;
}

export function useTasks({ projectId }: UseTasksOptions) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTasks(projectId, (taskList) => {
      setTasks(taskList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, projectId]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const addTask = useCallback(
    async (data: TaskFormData) => {
      try {
        setError(null);
        const newId = await createTask(projectId, data);
        return newId;
      } catch (err: any) {
        setError(err.message || 'Failed to create task');
        throw err;
      }
    },
    [projectId],
  );

  const editTask = useCallback(
    async (taskId: string, data: Partial<TaskFormData>) => {
      try {
        setError(null);
        await updateTask(projectId, taskId, data);
      } catch (err: any) {
        setError(err.message || 'Failed to update task');
        throw err;
      }
    },
    [projectId],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      try {
        setError(null);
        await deleteTask(projectId, taskId);
      } catch (err: any) {
        setError(err.message || 'Failed to delete task');
        throw err;
      }
    },
    [projectId],
  );

  // Called when dragging — update status and/or order
  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus, newOrder?: number) => {
      try {
        setError(null);
        await updateTaskStatus(projectId, taskId, newStatus, newOrder);
      } catch (err: any) {
        setError(err.message || 'Failed to move task');
        throw err;
      }
    },
    [projectId],
  );

  // ─── Progress Sync ──────────────────────────────────────────────────────────
  // Recalculate project progress whenever tasks change (fire-and-forget)

  const syncProgress = useCallback(() => {
    if (tasks.length === 0) {
      updateProjectProgress(projectId, 0).catch(() => {});
      return;
    }
    const done = tasks.filter((t) => t.status === 'done').length;
    const progress = Math.round((done / tasks.length) * 100);
    updateProjectProgress(projectId, progress).catch(() => {});
  }, [projectId, tasks]);

  // Sync progress whenever tasks change
  useEffect(() => {
    if (tasks.length > 0 || tasks.length === 0) {
      syncProgress();
    }
  }, [tasks]);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const byStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);
    },
    [tasks],
  );

  return {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    removeTask,
    moveTask,
    byStatus,
    total: tasks.length,
    doneCount: tasks.filter((t) => t.status === 'done').length,
  };
}
