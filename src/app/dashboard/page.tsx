'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FolderKanban,
  Plus,
  Receipt,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { formatIDR } from '@/lib/utils';
import { setDashboardTitle } from '@/app/dashboard/_context';
import { SummaryCard, SummaryCardGrid } from '@/components/dashboard/SummaryCard';

setDashboardTitle('Dashboard');

const PROJECT_STATUS_COLORS: Record<string, string> = {
  backlog: 'oklch(0.55 0.1 250)',
  in_progress: 'oklch(0.65 0.12 220)',
  review: 'oklch(0.75 0.12 80)',
  done: 'oklch(0.65 0.12 140)',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'oklch(0.55 0 0)',
  sent: 'oklch(0.65 0.12 220)',
  paid: 'oklch(0.65 0.12 140)',
  overdue: 'oklch(0.65 0.2 25)',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
};

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
        <div className="h-10 w-80" style={{ background: 'rgb(255 255 255 / 5%)', borderRadius: '8px' }} />
        <SummaryCardGrid>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border" style={{ background: 'oklch(0.16 0.015 265)', borderColor: 'rgb(255 255 255 / 6%)' }} />
          ))}
        </SummaryCardGrid>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="mb-1 text-2xl font-bold tracking-tight"
          style={{ color: 'oklch(0.97 0 0)' }}
        >
          Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}
        </h1>
        <p style={{ color: 'rgb(255 255 255 / 35%)' }}>
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
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'oklch(0.16 0.015 265)', borderColor: 'rgb(255 255 255 / 6%)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgb(255 255 255 / 5%)' }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.97 0 0)' }}>Recent Projects</h2>
              <p className="text-xs" style={{ color: 'rgb(255 255 255 / 30%)' }}>Latest activity</p>
            </div>
            <Link href="/dashboard/projects">
              <button
                className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                style={{ color: 'oklch(0.82 0.12 75)' }}
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <div className="p-2">
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FolderKanban className="mb-3 h-8 w-8" style={{ color: 'rgb(255 255 255 / 12%)' }} />
                <p className="mb-3 text-sm" style={{ color: 'rgb(255 255 255 / 25%)' }}>No projects yet</p>
                <Link href="/dashboard/projects">
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]"
                    style={{ background: 'oklch(0.82 0.12 75 / 10%)', color: 'oklch(0.82 0.12 75)', border: '1px solid oklch(0.82 0.12 75 / 20%)' }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create first project
                  </button>
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
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" style={{ color: 'oklch(0.97 0 0)' }}>
                          {project.title}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {deadline && (
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: isOverdue ? 'oklch(0.65 0.2 25)' : 'rgb(255 255 255 / 25%)' }}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(deadline, 'dd MMM', { locale: id })}
                            </span>
                          )}
                          {project.progress > 0 && (
                            <span className="text-xs" style={{ color: 'rgb(255 255 255 / 20%)' }}>
                              {project.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium shrink-0"
                        style={{
                          background: PROJECT_STATUS_COLORS[project.status] + '18',
                          color: PROJECT_STATUS_COLORS[project.status],
                          borderColor: PROJECT_STATUS_COLORS[project.status] + '30',
                        }}
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'oklch(0.16 0.015 265)', borderColor: 'rgb(255 255 255 / 6%)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgb(255 255 255 / 5%)' }}
          >
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'oklch(0.97 0 0)' }}>Recent Invoices</h2>
              <p className="text-xs" style={{ color: 'rgb(255 255 255 / 30%)' }}>Latest activity</p>
            </div>
            <Link href="/dashboard/finance">
              <button
                className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                style={{ color: 'oklch(0.82 0.12 75)' }}
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <div className="p-2">
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Receipt className="mb-3 h-8 w-8" style={{ color: 'rgb(255 255 255 / 12%)' }} />
                <p className="mb-3 text-sm" style={{ color: 'rgb(255 255 255 / 25%)' }}>No invoices yet</p>
                <Link href="/dashboard/finance">
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]"
                    style={{ background: 'oklch(0.82 0.12 75 / 10%)', color: 'oklch(0.82 0.12 75)', border: '1px solid oklch(0.82 0.12 75 / 20%)' }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create first invoice
                  </button>
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
                      className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-mono text-xs"
                          style={{ color: 'rgb(255 255 255 / 30%)' }}
                        >
                          {invoice.invoiceNumber}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm font-medium" style={{ color: 'oklch(0.97 0 0)' }}>
                            {formatIDR(invoice.amount)}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs"
                            style={{ color: isOverdue ? 'oklch(0.65 0.2 25)' : 'rgb(255 255 255 / 25%)' }}
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
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium shrink-0"
                        style={{
                          background: INVOICE_STATUS_COLORS[invoice.status] + '18',
                          color: INVOICE_STATUS_COLORS[invoice.status],
                          borderColor: INVOICE_STATUS_COLORS[invoice.status] + '30',
                        }}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </Badge>
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