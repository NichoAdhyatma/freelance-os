import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';

import { getDb, getFirebaseAuth } from '@/lib/firebase/config';
import { type User as FirestoreUser } from '@/types/user';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

function mapAuthError(error: any): Error {
  const code = error?.code;
  if (code === 'auth/email-already-in-use') {
    return new Error('This email is already registered. Please sign in instead.');
  }
  if (code === 'auth/invalid-email') {
    return new Error('Please enter a valid email address.');
  }
  if (code === 'auth/weak-password') {
    return new Error('Password should be at least 6 characters.');
  }
  if (code === 'auth/network-request-failed') {
    return new Error('Network error. Please check your internet connection.');
  }
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return new Error('Invalid email or password.');
  }
  return new Error(error?.message || 'An unexpected error occurred.');
}

export async function register(data: RegisterData): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not available.');

  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = userCredential.user;

  try {
    await updateProfile(user, { displayName: data.name });
  } catch {
    // Non-critical — proceed without display name
  }

  const db = getDb();
  if (db) {
    const userData = {
      name: data.name,
      email: data.email,
      plan: 'free' as const,
      licenseStatus: 'inactive' as const,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid), userData);
    } catch {
      // Non-critical — user was still created in Auth
    }
  }

  return user;
}

export async function login(data: LoginData): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not available.');

  try {
    const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
    return userCredential.user;
  } catch (error: any) {
    throw mapAuthError(error);
  }
}

export async function logout(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not available.');
  await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string) {
  const db = getDb();
  if (!db) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as FirestoreUser;
    }
    return null;
  } catch (error: any) {
    const isOffline =
      error?.code === 'failed-precondition' ||
      error?.code === 'unavailable' ||
      error?.message?.includes('offline');

    if (!isOffline) {
      console.warn('Could not fetch user profile:', error);
    }
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<FirestoreUser, 'name' | 'avatar'>>,
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function ensureUserProfile(uid: string, email: string, name: string): Promise<void> {
  const db = getDb();
  if (!db) return;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      const userData = {
        name,
        email,
        plan: 'free' as const,
        licenseStatus: 'inactive' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'users', uid), userData);
    }
  } catch {
    // Non-critical
  }
}
