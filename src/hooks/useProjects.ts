'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  createProject,
  deleteProject,
  getProjectStats,
  subscribeToProjects,
  updateProject,
  updateProjectProgress,
} from '@/lib/services/projectService';
import { type Project, type ProjectFormData, type ProjectStatus } from '@/types/project';

export interface ProjectStats {
  total: number;
  active: number;
  done: number;
  upcoming: number;
}

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToProjects((projectList) => {
      setProjects(projectList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const addProject = useCallback(async (data: ProjectFormData) => {
    try {
      setError(null);
      await createProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
      throw err;
    }
  }, []);

  const editProject = useCallback(async (id: string, data: Partial<ProjectFormData>) => {
    try {
      setError(null);
      await updateProject(id, data);
    } catch (err: any) {
      setError(err.message || 'Failed to update project');
      throw err;
    }
  }, []);

  const removeProject = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteProject(id);
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      throw err;
    }
  }, []);

  const setProgress = useCallback(async (id: string, progress: number) => {
    try {
      await updateProjectProgress(id, progress);
    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
      throw err;
    }
  }, []);

  const refreshStats = useCallback(async (): Promise<ProjectStats | null> => {
    return getProjectStats();
  }, []);

  // ─── Computed ──────────────────────────────────────────────────────────────

  const byStatus = useCallback(
    (status: ProjectStatus) => {
      return projects.filter((p) => p.status === status);
    },
    [projects],
  );

  return {
    projects,
    loading,
    error,
    addProject,
    editProject,
    removeProject,
    setProgress,
    refreshStats,
    byStatus,
    total: projects.length,
  };
}
