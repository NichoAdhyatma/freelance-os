'use client';

import { setDashboardTitle } from '@/app/dashboard/_context';

setDashboardTitle('Settings');

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}