/** Shared constants used across client and server code */
export const LICENSE_KEY_REGEX = /^FOS-(FREE|PRO|AGENCY)-[A-Z0-9]+(-[A-Z0-9]+)*$/i;

export type LicensePlan = 'free' | 'pro' | 'agency';

export const PLAN_FROM_LICENSE: Record<string, LicensePlan> = {
  FREE: 'free',
  PRO: 'pro',
  AGENCY: 'agency',
};
