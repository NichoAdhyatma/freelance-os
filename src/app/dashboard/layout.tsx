'use client';

import { useState } from 'react';

import { CommandPalette } from '@/components/shared/CommandPalette';
import { Header } from '@/components/shared/Header';
import { KeyboardNavProvider } from '@/components/shared/KeyboardNavProvider';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Sidebar } from '@/components/shared/Sidebar';
import { ContextMenuLayer } from '@/components/shared/RowContextMenu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ProtectedRoute requireLicense={true}>
      <ContextMenuLayer>
        <KeyboardNavProvider
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onOpenCommandPalette={() => {
            // CommandPalette is controlled via a global event — dispatch it
            window.dispatchEvent(new CustomEvent('toggle-command-palette'));
          }}
        >
          <div className="flex h-screen overflow-hidden">
            {sidebarOpen && <Sidebar />}
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} sidebarOpen={sidebarOpen} />
              <main className="bg-background flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
          <CommandPalette />
        </KeyboardNavProvider>
      </ContextMenuLayer>
    </ProtectedRoute>
  );
}