import { type Timestamp } from 'firebase/firestore';

export interface Client {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  notes?: string;
  totalRevenue: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ClientFormData {
  name: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  company?: string;
  website?: string;
  address?: string;
  notes?: string;
}
