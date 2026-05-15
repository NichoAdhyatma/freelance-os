'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIDR } from '@/lib/utils';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  agency: 'Agency',
};

export default function SettingsPage() {
  const { userProfile, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  const planBadgeClass =
    userProfile?.plan === 'agency'
      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      : userProfile?.plan === 'pro'
        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
        : 'bg-muted text-muted-foreground';

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Informasi yang ditampilkan di akun kamu</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      {/* Account info section */}
      <Card>
        <CardHeader>
          <CardTitle>Akun</CardTitle>
          <CardDescription>Informasi akun — tidak dapat diubah</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user?.email ?? '—'}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Plan</p>
            <Badge className={`${planBadgeClass} border-0`}>
              {PLAN_LABELS[userProfile?.plan ?? 'free']}
            </Badge>
          </div>
          {userProfile?.licenseKey && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">License Key</p>
              <p className="font-mono text-xs font-medium">{userProfile.licenseKey}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Member Sejak</p>
            <p className="text-sm font-medium">
              {userProfile?.createdAt
                ? new Date(userProfile.createdAt.toDate()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}