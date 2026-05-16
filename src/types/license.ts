import { type Timestamp } from 'firebase/firestore';

export type LicenseType = 'free' | 'pro' | 'agency';

export type LicenseKeyStatus = 'available' | 'activated' | 'revoked' | 'expired';

export interface License {
  id: string;
  key: string;
  type: LicenseType;
  status: LicenseKeyStatus;
  activatedBy?: string;
  activatedAt?: Timestamp;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}

export interface LicenseValidationResult {
  valid: boolean;
  message: string;
  license?: License;
}
