import { type Timestamp } from 'firebase/firestore';

export type ProjectStatus = 'backlog' | 'in_progress' | 'review' | 'done';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  invoiceId?: string | null; // linked invoice
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number; // 0-100
  deadline?: Timestamp;
  budget?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectFormData {
  title: string;
  description?: string;
  clientId?: string;
  invoiceId?: string | null; // linked invoice
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: Date;
  budget?: number;
  progress?: number;
}
