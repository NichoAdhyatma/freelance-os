import { type Timestamp } from 'firebase/firestore';

export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  title?: string;
  projectId?: string;
  amount: number;
  tax?: number;
  discount?: number;
  status: InvoiceStatus;
  dueDate: Timestamp;
  paidAt?: Timestamp;
  notes?: string;
  items?: InvoiceItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceFormData {
  clientId: string;
  title?: string;
  projectId?: string | null;
  amount: number;
  tax?: number;
  discount?: number;
  status?: InvoiceStatus;
  dueDate: Date;
  notes?: string;
  items?: InvoiceItem[];
}
