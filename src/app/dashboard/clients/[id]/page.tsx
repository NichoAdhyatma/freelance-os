'use client';

import { ArrowLeft } from 'lucide-react';
import { setDashboardTitle } from '@/app/dashboard/_context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { use } from 'react';
import { toast } from 'sonner';

import { ClientForm } from '@/components/clients/ClientForm';
import { ClientProfile } from '@/components/clients/ClientProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { type ClientFormData } from '@/types/client';

interface ClientProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function ClientProfilePage({ params }: ClientProfilePageProps) {
  setDashboardTitle('Client Details');
  const { id } = use(params);
  const { userProfile, loading: authLoading } = useAuth();
  const { getClientById, loading: clientsLoading, editClient, removeClient } = useClients();
  const { projects, loading: projectsLoading } = useProjects();
  const { invoices, loading: invoicesLoading } = useInvoices();

  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);

  const client = getClientById(id);
  const loading = authLoading || clientsLoading || projectsLoading || invoicesLoading;

  // ─── Derived ────────────────────────────────────────────────────────────────
  // Note: filtering is done client-side via useMemo inside ClientProfile component

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleEdit = async (data: ClientFormData) => {
    try {
      await editClient(id, data);
      toast.success('Client updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update client');
      throw err;
    }
  };

  const handleDelete = async () => {
    try {
      await removeClient(id);
      toast.success('Client deleted');
      router.push('/dashboard/clients');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-32" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6">
          <svg
            className="text-muted-foreground/30 mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Client not found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          This client may have been deleted or does not exist.
        </p>
        <Link
          href="/dashboard/clients"
          className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/clients"
          className="border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Clients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="truncate text-sm font-medium">{client.name}</span>
      </div>

      {/* Client Profile Component */}
      <ClientProfile
        client={client}
        projects={projects}
        invoices={invoices}
        onEdit={() => setFormOpen(true)}
        onDelete={handleDelete}
      />

      {/* Edit Form Dialog */}
      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleEdit}
        initialData={client}
      />
    </div>
  );
}
