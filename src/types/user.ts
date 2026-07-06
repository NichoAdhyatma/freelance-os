import { type Timestamp } from 'firebase/firestore';

export type UserPlan = 'free' | 'pro' | 'agency';

export type LicenseStatus = 'inactive' | 'active' | 'suspended' | 'expired';

export interface User {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  company?: string;
  phone?: string;
  address?: string;
  logo?: string;
  bankDetails?: BankDetails;
  plan: UserPlan;
  licenseKey?: string;
  licenseStatus: LicenseStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  company?: string;
  phone?: string;
  address?: string;
  logo?: string;
  bankDetails?: BankDetails;
}
