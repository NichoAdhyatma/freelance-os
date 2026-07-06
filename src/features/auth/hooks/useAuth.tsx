'use client';

import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { getUserProfile, updateUserProfile } from '@/features/auth/services/authService';
import { getFirebaseAuth, isConfigured } from '@/lib/firebase/config';
import { type User, type BankDetails } from '@/types/user';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatar?: string;
    company?: string;
    phone?: string;
    address?: string;
    logo?: string;
    bankDetails?: BankDetails;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetched = useRef(false);

  const refreshProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Set loading = false immediately when auth state is resolved
      setLoading(false);

      if (firebaseUser && !profileFetched.current) {
        profileFetched.current = true;
        // Fetch profile in background — non-blocking
        getUserProfile(firebaseUser.uid)
          .then((profile) => {
            setUserProfile(profile);
          })
          .catch(() => {
            // Offline or failed — user is still authenticated
            setUserProfile(null);
          });
      } else if (!firebaseUser) {
        profileFetched.current = false;
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    profileFetched.current = false;
    if (!isConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  };

  const handleUpdateProfile = async (data: {
    name?: string;
    avatar?: string;
    company?: string;
    phone?: string;
    address?: string;
    logo?: string;
    bankDetails?: BankDetails;
  }) => {
    if (!user) throw new Error('Not authenticated');
    await updateUserProfile(user.uid, data);
    await refreshProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signOut: handleSignOut,
        refreshProfile,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
