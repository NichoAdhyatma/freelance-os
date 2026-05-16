/**
 * Client service — Firestore CRUD operations for clients.
 *
 * Uses Firebase JS SDK (client-side) with offline cache support.
 * Collection path: users/{uid}/clients/{clientId}
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
import { type Client, type ClientFormData } from '@/types/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function clientsRef() {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) throw new Error('Not authenticated');
  return collection(getDb()!, 'users', uid, 'clients');
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createClient(data: ClientFormData): Promise<string> {
  const ref = doc(clientsRef());
  const now = Timestamp.now();
  await setDoc(ref, {
    name: data.name.trim(),
    email: data.email?.trim() || null,
    whatsapp: data.whatsapp?.trim() || null,
    phone: data.phone?.trim() || null,
    company: data.company?.trim() || null,
    website: data.website?.trim() || null,
    address: data.address?.trim() || null,
    notes: data.notes?.trim() || null,
    totalRevenue: 0,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getClient(id: string): Promise<Client | null> {
  const ref = doc(clientsRef(), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Client;
}

export async function updateClient(
  id: string,
  data: Partial<ClientFormData & { totalRevenue?: number }>,
): Promise<void> {
  const ref = doc(clientsRef(), id);
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.email !== undefined) updates.email = data.email?.trim() || null;
  if (data.whatsapp !== undefined) updates.whatsapp = data.whatsapp?.trim() || null;
  if (data.phone !== undefined) updates.phone = data.phone?.trim() || null;
  if (data.company !== undefined) updates.company = data.company?.trim() || null;
  if (data.website !== undefined) updates.website = data.website?.trim() || null;
  if (data.address !== undefined) updates.address = data.address?.trim() || null;
  if (data.notes !== undefined) updates.notes = data.notes?.trim() || null;
  if (data.totalRevenue !== undefined) updates.totalRevenue = data.totalRevenue;

  await updateDoc(ref, updates);
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(clientsRef(), id));
}

// ─── Real-time subscription ─────────────────────────────────────────────────────

export function subscribeToClients(callback: (clients: Client[]) => void): () => void {
  const q = query(clientsRef(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Client));
    },
    () => callback([]),
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getClientStats() {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) return null;

  const snapshot = await getDocs(clientsRef());
  const docs = snapshot.docs.map((d) => d.data() as Client);

  const total = docs.length;
  const totalRevenue = docs.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
  const avgRevenue = total > 0 ? Math.round(totalRevenue / total) : 0;

  return { total, totalRevenue, avgRevenue };
}
