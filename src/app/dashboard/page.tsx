'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  FolderKanban,
  Plus,
  Receipt,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { formatIDR } from '@/lib/utils';
import {
  INVOICE_STATUS_CONFIG,
  INVOICE_STATUS_LABELS,
  PROJECT_STATUS_CONFIG,
  PROJECT_STATUS_LABELS,
} from '@/lib/tokens';
import { setDashboardTitle } from '@/app/dashboard/_context';
import { SummaryCard, SummaryCardGrid } from '@/components/dashboard/SummaryCard';

setDashboardTitle('Dashboard');

export default function DashboardPage() {
  setDashboardTitle('Dashboard');

  const { userProfile, loading: authLoading } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, total: totalClients } = useClients();

  const loading = authLoading || projectsLoading || invoicesLoading;

  const stats = useMemo(() => {
    const totalRevenue = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    const activeProjects = projects.filter(
      (p) => p.status === 'in_progress' || p.status === 'review' || p.status === 'backlog',
    ).length;

    const pendingInvoices = invoices.filter(
      (i) => i.status === 'sent' || i.status === 'pending' || i.status === 'overdue',
    ).length;

    const outstanding = invoices
      .filter((i) => i.status === 'sent' || i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0);

    const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = projects.filter((p) => {
      if (!p.deadline || p.status === 'done') return false;
      return p.deadline.toDate() >= now && p.deadline.toDate() <= in7days;
    }).length;

    const overdueProjects = projects.filter((p) => {
      if (!p.deadline || p.status === 'done') return false;
      return p.deadline.toDate() < now;
    }).length;

    return {
      totalRevenue,
      activeProjects,
      pendingInvoices,
      outstanding,
      overdueCount,
      upcomingDeadlines,
      overdueProjects,
    };
  }, [projects, invoices]);

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() ?? 0;
        const bTime = b.createdAt?.toMillis() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [projects]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis() ?? 0;
        const bTime = b.createdAt?.toMillis() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [invoices]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-80 rounded-lg bg-surface-raised" />
        <SummaryCardGrid>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border bg-surface-raised border-border-default" />
          ))}
        </SummaryCardGrid>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-1 font-heading text-h2 text-[var(--text-primary)]">
          Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-[var(--text-secondary)]">
          Here&apos;s what&apos;s happening with your business today
        </p>
      </div>

      {/* Stats Cards */}
      <SummaryCardGrid>
        <SummaryCard
          label="Total Revenue"
          value={formatIDR(stats.totalRevenue)}
          sub={stats.outstanding > 0 ? `${formatIDR(stats.outstanding)} outstanding` : 'All collected'}
          subColor={stats.outstanding > 0 ? 'yellow' : 'green'}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <SummaryCard
          label="Active Projects"
          value={stats.activeProjects}
          sub={
            stats.overdueProjects > 0
              ? `${stats.overdueProjects} overdue`
              : `${stats.upcomingDeadlines} deadline${stats.upcomingDeadlines !== 1 ? 's' : ''} this week`
          }
          subColor={stats.overdueProjects > 0 ? 'red' : 'default'}
          icon={<FolderKanban className="h-6 w-6" />}
        />
        <SummaryCard
          label="Pending Invoices"
          value={stats.pendingInvoices}
          sub={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : 'On track'}
          subColor={stats.overdueCount > 0 ? 'red' : 'default'}
          icon={<Receipt className="h-6 w-6" />}
        />
        <SummaryCard
          label="Clients"
          value={totalClients}
          sub={`${stats.activeProjects} active project${stats.activeProjects !== 1 ? 's' : ''}`}
          subColor="green"
          icon={<Users className="h-6 w-6" />}
        />
      </SummaryCardGrid>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-raised animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Projects</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Latest activity</p>
            </div>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm" className="text-[var(--primary)] hover:text-[var(--primary-hover)] h-auto p-0 gap-1">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="p-2">
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FolderKanban className="mb-3 h-8 w-8 text-[var(--text-disabled)]" />
                <p className="mb-3 text-sm text-[var(--text-tertiary)]">No projects yet</p>
                <Link href="/dashboard/projects">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create first project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentProjects.map((project) => {
                  const deadline = project.deadline?.toDate();
                  const isOverdue = deadline && deadline < new Date() && project.status !== 'done';

                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      data-animate
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {project.title}
                        </p>
                        <div className="mt-0.5 flex items-center gap-3">
                          {deadline && (
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: isOverdue ? 'var(--status-danger)' : 'var(--text-tertiary)' }}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(deadline, 'dd MMM', { locale: id })}
                            </span>
                          )}
                          {project.progress > 0 && (
                            <span className="text-xs text-[var(--text-disabled)]">
                              {project.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge
                        config={PROJECT_STATUS_CONFIG}
                        status={project.status}
                        label={PROJECT_STATUS_LABELS[project.status]}
                        size="sm"
                        className="shrink-0"
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-raised animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Invoices</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Latest activity</p>
            </div>
            <Link href="/dashboard/finance">
              <Button variant="ghost" size="sm" className="text-[var(--primary)] hover:text-[var(--primary-hover)] h-auto p-0 gap-1">
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="p-2">
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Receipt className="mb-3 h-8 w-8 text-[var(--text-disabled)]" />
                <p className="mb-3 text-sm text-[var(--text-tertiary)]">No invoices yet</p>
                <Link href="/dashboard/finance">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create first invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-0.5">
                {recentInvoices.map((invoice) => {
                  const dueDate = invoice.dueDate.toDate();
                  const isOverdue = dueDate < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled';

                  return (
                    <Link
                      key={invoice.id}
                      href="/dashboard/finance"
                      data-animate
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-[var(--text-tertiary)]">
                          {invoice.invoiceNumber}
                        </p>
                        <div className="mt-0.5 flex items-center gap-3">
                          <span className="text-sm font-medium text-[var(--text-primary)]">
                            {formatIDR(invoice.amount)}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: isOverdue ? 'var(--status-danger)' : 'var(--text-tertiary)' }}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {format(dueDate, 'dd MMM', { locale: id })}
                          </span>
                        </div>
                      </div>
                      <StatusBadge
                        config={INVOICE_STATUS_CONFIG}
                        status={invoice.status}
                        label={INVOICE_STATUS_LABELS[invoice.status]}
                        size="sm"
                        className="shrink-0"
                      />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}