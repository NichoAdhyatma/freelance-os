'use client';

import { Header } from '@/components/shared/Header';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Sidebar } from '@/components/shared/Sidebar';
import { ContextMenuLayer } from '@/components/shared/RowContextMenu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireLicense={false}>
      <ContextMenuLayer>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="bg-background flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </ContextMenuLayer>
    </ProtectedRoute>
  );
}
