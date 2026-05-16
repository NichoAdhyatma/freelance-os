/**
 * Project service — Firestore CRUD operations for projects.
 *
 * Uses Firebase JS SDK (client-side) with offline cache support.
 * Collection path: users/{uid}/projects/{projectId}
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { getDb, getFirebaseAuth } from '@/lib/firebase/config';
import { type Project, type ProjectFormData } from '@/types/project';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function projectsRef() {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) throw new Error('Not authenticated');
  return collection(getDb()!, 'users', uid, 'projects');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createProject(data: ProjectFormData): Promise<string> {
  const ref = doc(projectsRef());
  const now = Timestamp.now();
  await setDoc(ref, {
    title: data.title,
    description: data.description || '',
    clientId: data.clientId || null,
    status: data.status,
    priority: data.priority,
    progress: 0,
    deadline: data.deadline ? Timestamp.fromDate(data.deadline) : null,
    budget: data.budget || null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getProject(id: string): Promise<Project | null> {
  const ref = doc(projectsRef(), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function updateProject(id: string, data: Partial<ProjectFormData>): Promise<void> {
  const ref = doc(projectsRef(), id);
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.clientId !== undefined) updates.clientId = data.clientId || null;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.budget !== undefined) updates.budget = data.budget || null;
  if (data.deadline !== undefined) {
    updates.deadline = data.deadline ? Timestamp.fromDate(data.deadline) : null;
  }

  await updateDoc(ref, updates);
}

export async function updateProjectProgress(id: string, progress: number): Promise<void> {
  const ref = doc(projectsRef(), id);
  await updateDoc(ref, {
    progress: Math.min(100, Math.max(0, progress)),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(projectsRef(), id));
}

// ─── Real-time subscription ──────────────────────────────────────────────────

export function subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  const q = query(projectsRef(), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Project);
      callback(projects);
    },
    () => {
      callback([]);
    },
  );
  return unsubscribe;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getProjectStats() {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) return null;

  const snapshot = await getDocs(projectsRef());
  const docs = snapshot.docs.map((d) => d.data() as Project);

  const active = docs.filter((p) => p.status === 'in_progress').length;
  const done = docs.filter((p) => p.status === 'done').length;
  const total = docs.length;

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = docs.filter((p) => {
    if (!p.deadline) return false;
    const d = p.deadline.toDate();
    return d >= now && d <= in7days && p.status !== 'done';
  }).length;

  return { total, active, done, upcoming };
}
