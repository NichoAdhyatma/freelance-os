'use client';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { getDb, getFirebaseAuth } from '@/lib/firebase/config';
import { type Invoice, type InvoiceFormData, type InvoiceStatus } from '@/types/invoice';

function invoicesRef() {
  const auth = getFirebaseAuth();
  const uid = auth?.currentUser?.uid;
  if (!uid || !getDb()) throw new Error('Not authenticated');
  return collection(getDb()!, 'users', uid, 'invoices');
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${year}-${rand}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createInvoice(data: InvoiceFormData): Promise<string> {
  const ref = doc(invoicesRef());
  const now = Timestamp.now();
  await setDoc(ref, {
    invoiceNumber: generateInvoiceNumber(),
    clientId: data.clientId,
    projectId: data.projectId || null,
    amount: data.amount,
    tax: data.tax ?? 0,
    discount: data.discount ?? 0,
    items: data.items || [],
    status: 'draft' as InvoiceStatus,
    dueDate: Timestamp.fromDate(data.dueDate),
    notes: data.notes || null,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const snap = await getDoc(doc(invoicesRef(), id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Invoice;
}

export async function updateInvoice(
  id: string,
  data: Partial<InvoiceFormData & { status?: InvoiceStatus; amountPaid?: number }>,
): Promise<void> {
  const ref = doc(invoicesRef(), id);
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.clientId !== undefined) updates.clientId = data.clientId;
  if (data.projectId !== undefined) updates.projectId = data.projectId || null;
  if (data.tax !== undefined) updates.tax = data.tax;
  if (data.discount !== undefined) updates.discount = data.discount;
  if (data.dueDate !== undefined) updates.dueDate = Timestamp.fromDate(data.dueDate);
  if (data.notes !== undefined) updates.notes = data.notes || null;
  if (data.items !== undefined) updates.items = data.items;
  if (data.status !== undefined) updates.status = data.status;
  if (data.amountPaid !== undefined) updates.amountPaid = data.amountPaid;

  await updateDoc(ref, updates);
}

export async function deleteInvoice(id: string): Promise<void> {
  await deleteDoc(doc(invoicesRef(), id));
}

// ─── Real-time ──────────────────────────────────────────────────────────────

export function subscribeToInvoices(callback: (invoices: Invoice[]) => void): () => void {
  const q = query(invoicesRef(), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Invoice));
    },
    () => callback([]),
  );
}
