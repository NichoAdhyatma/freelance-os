'use client';

import {
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { ClientForm } from '@/components/clients/ClientForm';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { cn } from '@/lib/utils';
import { type ClientFormData } from '@/types/client';
import { type InvoiceFormData } from '@/types/invoice';
import { type ProjectFormData } from '@/types/project';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
  { name: 'Finance', href: '/dashboard/finance', icon: Receipt },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [createType, setCreateType] = useState<'client' | 'project' | 'invoice' | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

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
    <div className="border-border bg-card flex h-full w-64 flex-col border-r">
      {/* Logo */}
      <div className="border-border flex h-16 items-center gap-2 border-b px-4">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold">Freelancer OS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="border-border border-t px-3 py-4">
        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick-Create FAB */}
      <div className="border-border border-t px-3 py-3">
        {fabOpen ? (
          <div className="space-y-1">
            <button
              onClick={() => {
                setCreateType('client');
                setFabOpen(false);
              }}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <Users className="h-4 w-4" /> New Client
            </button>
            <button
              onClick={() => {
                setCreateType('project');
                setFabOpen(false);
              }}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <FolderKanban className="h-4 w-4" /> New Project
            </button>
            <button
              onClick={() => {
                setCreateType('invoice');
                setFabOpen(false);
              }}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
            >
              <Receipt className="h-4 w-4" /> New Invoice
            </button>
            <button
              onClick={() => setFabOpen(false)}
              className="text-muted-foreground hover:bg-muted flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setFabOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Create New
          </button>
        )}
      </div>

      {/* Client Form Dialog */}
      <ClientForm
        open={createType === 'client'}
        onOpenChange={(open) => !open && setCreateType(null)}
        onSubmit={handleClientSubmit}
      />

      {/* Project Form Dialog */}
      <ProjectForm
        open={createType === 'project'}
        onOpenChange={(open) => !open && setCreateType(null)}
        onSubmit={handleProjectSubmit}
      />

      {/* Invoice Form Dialog */}
      <InvoiceForm
        open={createType === 'invoice'}
        onOpenChange={(open) => !open && setCreateType(null)}
        onSubmit={handleInvoiceSubmit}
      />
    </div>
  );
}
