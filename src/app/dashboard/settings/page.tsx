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
  agency: { bg: 'var(--status-info-bg)', color: 'var(--status-info)', border: 'var(--status-info)' },
  pro: { bg: 'var(--status-info-bg)', color: 'var(--status-info)', border: 'var(--status-info)' },
};

export default function SettingsPage() {
  const { userProfile, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)]" />
        <div className="h-40 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)]" />
      </div>
    );
  }

  const planStyle = userProfile?.plan ? PLAN_STYLES[userProfile.plan] : null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile section */}
      <div
        className="rounded-xl border overflow-hidden border-[var(--border-default)] bg-[var(--surface-raised)]"
      >
        <div
          className="px-6 py-4 border-b border-[var(--border-default)]"
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Profile</h2>
          <p className="text-xs mt-0.5 text-[var(--text-tertiary)]">Account information displayed on your profile</p>
        </div>
        <div className="p-6">
          <ProfileForm />
        </div>
      </div>

      {/* Account info section */}
      <div
        className="rounded-xl border overflow-hidden border-[var(--border-default)] bg-[var(--surface-raised)]"
      >
        <div
          className="px-6 py-4 border-b border-[var(--border-default)]"
        >
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Account</h2>
          <p className="text-xs mt-0.5 text-[var(--text-tertiary)]">Account details — cannot be modified</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Email</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{user?.email ?? '—'}</p>
          </div>
          {userProfile?.plan && planStyle && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">Plan</p>
              <span
                className="inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide border"
                style={{ background: planStyle.bg, color: planStyle.color, borderColor: planStyle.border }}
              >
                {PLAN_LABELS[userProfile.plan] ?? userProfile.plan}
              </span>
            </div>
          )}
          {userProfile?.licenseKey && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">License Key</p>
              <p className="font-mono text-xs font-medium text-[var(--text-secondary)]">{userProfile.licenseKey}</p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">Member Since</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
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