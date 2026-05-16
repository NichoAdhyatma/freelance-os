'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireLicense?: boolean;
}

export function ProtectedRoute({ children, requireLicense = false }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Auth still checking — wait
    if (loading) return;

    // No user → redirect to login
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // User is authenticated — proceed (even if profile is null/offline)
    // Profile can be loaded later via refreshProfile
    if (requireLicense && userProfile?.licenseStatus !== 'active') {
      router.push('/activate');
      return;
    }

    setChecked(true);
  }, [user, userProfile, loading, router, pathname, requireLicense]);

  if (loading || !checked) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
