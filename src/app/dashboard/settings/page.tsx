'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const PLAN_LABELS: Record<string, string> = {
  pro: 'Pro',
  agency: 'Agency',
};

const PLAN_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  agency: { bg: 'oklch(0.6 0.18 320 / 15%)', color: 'oklch(0.6 0.18 320)', border: 'oklch(0.6 0.18 320 / 30%)' },
  pro: { bg: 'oklch(0.65 0.14 220 / 15%)', color: 'oklch(0.65 0.14 220)', border: 'oklch(0.65 0.14 220 / 30%)' },
};

export default function SettingsPage() {
  const { userProfile, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-xl" style={{ background: 'oklch(0.16 0.015 265)', border: '1px solid rgb(255 255 255 / 6%)' }} />
        <div className="h-40 rounded-xl" style={{ background: 'oklch(0.16 0.015 265)', border: '1px solid rgb(255 255 255 / 6%)' }} />
      </div>
    );
  }

  const planStyle = userProfile?.plan ? PLAN_STYLES[userProfile.plan] : null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile section */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'oklch(0.16 0.015 265)', borderColor: 'rgb(255 255 255 / 6%)' }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid rgb(255 255 255 / 5%)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.97 0 0)' }}>Profile</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(255 255 255 / 30%)' }}>Account information displayed on your profile</p>
        </div>
        <div className="p-6">
          <ProfileForm />
        </div>
      </div>

      {/* Account info section */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: 'oklch(0.16 0.015 265)', borderColor: 'rgb(255 255 255 / 6%)' }}
      >
        <div
          className="px-6 py-4"
          style={{ borderBottom: '1px solid rgb(255 255 255 / 5%)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.97 0 0)' }}>Account</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(255 255 255 / 30%)' }}>Account details — cannot be modified</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'rgb(255 255 255 / 40%)' }}>Email</p>
            <p className="text-sm font-medium" style={{ color: 'oklch(0.97 0 0)' }}>{user?.email ?? '—'}</p>
          </div>
          {userProfile?.plan && planStyle && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'rgb(255 255 255 / 40%)' }}>Plan</p>
              <span
                className="inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide"
                style={{ background: planStyle.bg, color: planStyle.color, border: `1px solid ${planStyle.border}` }}
              >
                {PLAN_LABELS[userProfile.plan] ?? userProfile.plan}
              </span>
            </div>
          )}
          {userProfile?.licenseKey && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'rgb(255 255 255 / 40%)' }}>License Key</p>
              <p className="font-mono text-xs font-medium" style={{ color: 'rgb(255 255 255 / 50%)' }}>{userProfile.licenseKey}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'rgb(255 255 255 / 40%)' }}>Member Since</p>
            <p className="text-sm font-medium" style={{ color: 'oklch(0.97 0 0)' }}>
              {userProfile?.createdAt
                ? format(userProfile.createdAt.toDate(), 'dd MMMM yyyy', { locale: undefined as any })
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}