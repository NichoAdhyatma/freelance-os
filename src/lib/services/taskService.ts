/**
 * Task service — Firestore CRUD operations for tasks.
 *
 * Uses Firebase JS SDK (client-side) with offline cache support.
 * Collection path: users/{uid}/projects/{projectId}/tasks/{taskId}
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { getDb, getFirebaseAuth } from '@/lib/firebase/config';
import { type Task, type TaskFormData, type TaskStatus } from '@/types/task';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tasksRef(projectId: string) {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) throw new Error('Not authenticated');
  return collection(getDb()!, 'users', uid, 'projects', projectId, 'tasks');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createTask(projectId: string, data: TaskFormData): Promise<string> {
  // Use composite index (status, order) to get max order efficiently
  const q = query(
    tasksRef(projectId),
    where('status', '==', data.status),
    orderBy('order', 'desc'),
    limit(1),
  );
  const snapshot = await getDocs(q);
  const maxOrder = snapshot.empty ? 0 : ((snapshot.docs[0].data().order as number) ?? 0);
  const nextOrder = maxOrder + 1;

  const ref = doc(tasksRef(projectId));
  const now = Timestamp.now();
  await setDoc(ref, {
    title: data.title,
    description: data.description || '',
    status: data.status,
    priority: data.priority,
    assignee: data.assignee || null,
    dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getTask(projectId: string, taskId: string): Promise<Task | null> {
  const ref = doc(tasksRef(projectId), taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Task;
}

export async function updateTask(
  projectId: string,
  taskId: string,
  data: Partial<TaskFormData>,
): Promise<void> {
  const ref = doc(tasksRef(projectId), taskId);
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.assignee !== undefined) updates.assignee = data.assignee || null;
  if (data.dueDate !== undefined) {
    updates.dueDate = data.dueDate ? Timestamp.fromDate(data.dueDate) : null;
  }

  await updateDoc(ref, updates);
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus,
  order?: number,
): Promise<void> {
  const ref = doc(tasksRef(projectId), taskId);
  const updates: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
  };
  if (order !== undefined) {
    updates.order = order;
  }
  await updateDoc(ref, updates);
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(tasksRef(projectId), taskId));
}

// ─── Batch operations ──────────────────────────────────────────────────────────

export async function swapTaskOrders(
  projectId: string,
  taskA: { id: string; order: number },
  taskB: { id: string; order: number },
): Promise<void> {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) throw new Error('Not authenticated');

  const db = getDb()!;
  const batch = writeBatch(db);

  const refA = doc(db, 'users', uid, 'projects', projectId, 'tasks', taskA.id);
  const refB = doc(db, 'users', uid, 'projects', projectId, 'tasks', taskB.id);

  batch.update(refA, { order: taskB.order });
  batch.update(refB, { order: taskA.order });

  await batch.commit();
}

// ─── Real-time subscription ──────────────────────────────────────────────────

export function subscribeToTasks(projectId: string, callback: (tasks: Task[]) => void): () => void {
  // No Firestore orderBy — sort client-side to handle missing/null order gracefully
  const unsubscribe = onSnapshot(
    tasksRef(projectId),
    (snapshot) => {
      const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Task);
      // Sort by order, fall back to id for tasks without order field
      tasks.sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });
      callback(tasks);
    },
    (err) => {
      console.error('[subscribeToTasks] subscription error:', err);
      callback([]);
    },
  );
  return unsubscribe;
}
