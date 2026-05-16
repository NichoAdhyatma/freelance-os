import { type Timestamp } from 'firebase/firestore';

export type UserPlan = 'free' | 'pro' | 'agency';

export type LicenseStatus = 'inactive' | 'active' | 'suspended' | 'expired';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  plan: UserPlan;
  licenseKey?: string;
  licenseStatus: LicenseStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}
