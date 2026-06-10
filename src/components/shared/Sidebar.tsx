'use client';

import {
  FolderKanban,
  LayoutDashboard,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import type { ClientForm } from '@/components/clients/ClientForm';
import type { InvoiceForm } from '@/components/invoices/InvoiceForm';
import type { ProjectForm } from '@/components/projects/ProjectForm';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { type ClientFormData } from '@/types/client';
import { type InvoiceFormData } from '@/types/invoice';
import { type ProjectFormData } from '@/types/project';

const ClientFormDynamic = dynamic(() => import('@/components/clients/ClientForm').then(m => m.ClientForm), { ssr: false }) as typeof ClientForm;
const InvoiceFormDynamic = dynamic(() => import('@/components/invoices/InvoiceForm').then(m => m.InvoiceForm), { ssr: false }) as typeof InvoiceForm;
const ProjectFormDynamic = dynamic(() => import('@/components/projects/ProjectForm').then(m => m.ProjectForm), { ssr: false }) as typeof ProjectForm;

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Finance', href: '/dashboard/finance', icon: Receipt },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [createType, setCreateType] = useState<'client' | 'project' | 'invoice' | null>(null);

  const { addClient } = useClients();
  const { addProject } = useProjects();
  const { add } = useInvoices();

  const handleClientSubmit = async (data: ClientFormData) => {
    await addClient(data);
    toast.success('Client added');
    setCreateType(null);
  };

  const handleProjectSubmit = async (data: ProjectFormData) => {
    await addProject(data);
    toast.success('Project created');
    setCreateType(null);
  };

  const handleInvoiceSubmit = async (data: InvoiceFormData) => {
    await add(data);
    toast.success('Invoice created');
    setCreateType(null);
  };

  return (
    <aside
      className="relative flex w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-base)]"
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, var(--primary) 50%, transparent)',
          opacity: 0.4,
        }}
      />

      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--border-subtle)] px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'var(--accent-muted)', border: '1px solid var(--primary)', opacity: 0.8 }}
        >
          <Sparkles className="h-4 w-4" style={{ color: 'var(--primary)' }} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Freelancer OS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
                isActive
                  ? 'font-medium text-[var(--primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
              style={isActive ? { background: 'var(--accent-muted)' } : {}}
            >
              {isActive && (
                <div
                  className="absolute left-0 h-5 w-0.5 rounded-full"
                  style={{ background: 'var(--primary)' }}
                />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="border-t border-[var(--border-subtle)] px-3 py-2 space-y-0.5">
        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
                isActive ? 'font-medium text-[var(--primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
              )}
              style={isActive ? { background: 'var(--accent-muted)' } : {}}
            >
              {isActive && (
                <div className="absolute left-0 h-5 w-0.5 rounded-full" style={{ background: 'var(--primary)' }} />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Quick-Create FAB */}
      <div className="border-t border-[var(--border-subtle)] px-3 py-3">
        <button
          onClick={() => setCreateType('project')}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus className="h-4 w-4" />
          New
        </button>

        {/* Quick-create mini menu */}
        {createType && (
          <div
            className="mt-2 rounded-xl overflow-hidden border"
            style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}
          >
            {[
              { icon: Users, label: 'New Client', type: 'client' as const },
              { icon: FolderKanban, label: 'New Project', type: 'project' as const },
              { icon: Receipt, label: 'New Invoice', type: 'invoice' as const },
            ].map(({ icon: Icon, label, type }) => (
              <button
                key={type}
                onClick={() => setCreateType(type)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <div className="border-t border-[var(--border-subtle)] px-3 py-2">
              <button
                onClick={() => setCreateType(null)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <ClientFormDynamic
        open={createType === 'client'}
        onOpenChange={(open: boolean) => !open && setCreateType(null)}
        onSubmit={handleClientSubmit}
      />
      <ProjectFormDynamic
        open={createType === 'project'}
        onOpenChange={(open: boolean) => !open && setCreateType(null)}
        onSubmit={handleProjectSubmit}
      />
      <InvoiceFormDynamic
        open={createType === 'invoice'}
        onOpenChange={(open: boolean) => !open && setCreateType(null)}
        onSubmit={handleInvoiceSubmit}
      />
    </aside>
  );
}
