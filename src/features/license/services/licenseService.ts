/**
 * License service — client-side entry point.
 *
 * All license operations go through API routes (server-side Admin SDK).
 * This keeps security-sensitive writes server-side and avoids browser
 * network restrictions to Firestore.
 *
 * Use Firebase JS SDK directly only for:
 *   - Reading license status from user's own profile
 *   - Subscribing to profile changes (handled by useAuth)
 */
import { getIdToken, signOut } from 'firebase/auth';

import { getFirebaseAuth } from '@/lib/firebase/config';
import { type LicenseValidationResult } from '@/types/license';

// Timeout wrapper for fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }
    throw error;
  }
}

export async function activateLicense(
  _userId: string,
  licenseKey: string,
): Promise<LicenseValidationResult> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    return { valid: false, message: 'You must be logged in to activate a license.' };
  }

  let idToken: string;
  try {
    idToken = await getIdToken(auth.currentUser, false);
  } catch {
    return { valid: false, message: 'Session expired. Please log in again.' };
  }

  let response: Response;
  try {
    response = await fetchWithTimeout('/api/licenses/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ licenseKey }),
    });
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, message: error.message };
    }
    return { valid: false, message: 'Network error. Please check your connection.' };
  }

  if (response.status === 401) {
    try {
      await signOut(auth);
    } catch {
      /* ignore */
    }
    return { valid: false, message: 'Session expired. Please log in again.' };
  }

  const data = await response.json();
  return {
    valid: data.valid,
    message: data.message || data.error || 'Activation failed.',
  };
}

export async function validateLicenseKey(licenseKey: string): Promise<LicenseValidationResult> {
  try {
    const response = await fetchWithTimeout('/api/licenses/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey }),
    });
    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, message: error.message };
    }
    return { valid: false, message: 'Network error during validation.' };
  }
}

export async function getLicenseByKey(licenseKey: string) {
  return validateLicenseKey(licenseKey);
}
