'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FolderKanban,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { formatIDR } from '@/lib/utils';
import { setDashboardTitle } from '@/app/dashboard/_context';

setDashboardTitle('Dashboard');

const PROJECT_STATUS_COLORS: Record<string, string> = {
  backlog: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  review: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  done: 'bg-green-500/10 text-green-400 border-green-500/20',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  sent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paid: 'bg-green-500/10 text-green-500 border-green-500/20',
  overdue: 'bg-red-500/10 text-red-500 border-red-500/20',
  cancelled: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Completed',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export default function DashboardPage() {
  setDashboardTitle('Dashboard');

  const { userProfile, loading: authLoading } = useAuth();
  const { projects, loading: projectsLoading, total: totalProjects } = useProjects();
  const { invoices, loading: invoicesLoading, total: totalInvoices } = useInvoices();
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
      const d = p.deadline.toDate();
      return d >= now && d <= in7days;
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
        <Skeleton className="h-10 w-80" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userProfile?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your business today
        </p>
      </div>

      {/* License Status Banner */}
      {userProfile?.licenseStatus !== 'active' && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-yellow-500" />
              <div>
                <p className="font-medium">Free Plan — Limited Features</p>
                <p className="text-muted-foreground text-sm">
                  Activate your license to unlock all features
                </p>
              </div>
            </div>
            <Link href="/activate">
              <Button size="sm">Activate License</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatIDR(stats.totalRevenue)}</div>
            <p className="text-muted-foreground text-xs">
              {stats.outstanding > 0 && (
                <span className="text-yellow-500">{formatIDR(stats.outstanding)} outstanding</span>
              )}
              {stats.outstanding === 0 &&
                `${totalInvoices} invoice${totalInvoices !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-muted-foreground text-xs">
              {totalProjects} total ·{' '}
              {stats.overdueProjects > 0 && (
                <span className="text-red-400">{stats.overdueProjects} overdue</span>
              )}
              {stats.overdueProjects === 0 &&
                `${stats.upcomingDeadlines} deadline${stats.upcomingDeadlines !== 1 ? 's' : ''} this week`}
            </p>
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Receipt className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-muted-foreground text-xs">
              {stats.overdueCount > 0 && (
                <span className="text-red-400">{stats.overdueCount} overdue</span>
              )}
              {stats.overdueCount === 0 &&
                `${totalInvoices} total invoice${totalInvoices !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-muted-foreground text-xs">
              {stats.activeProjects} active project{stats.activeProjects !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Latest project activity</CardDescription>
              </div>
              <Link href="/dashboard/projects">
                <Button variant="ghost" size="sm">
                  View all <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderKanban className="text-muted-foreground/30 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No projects yet</p>
                <Link href="/dashboard/projects" className="mt-2">
                  <Button size="sm" variant="ghost">
                    Create your first project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => {
                  const deadline = project.deadline?.toDate();
                  const isOverdue = deadline && deadline < new Date() && project.status !== 'done';

                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/projects/${project.id}`}
                      className="hover:bg-accent/50 flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{project.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {deadline && (
                            <span
                              className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}
                            >
                              <Calendar className="h-3 w-3" />
                              {format(deadline, 'dd MMM', { locale: id })}
                            </span>
                          )}
                          {project.progress > 0 && (
                            <span className="text-muted-foreground text-xs">
                              {project.progress}%
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={PROJECT_STATUS_COLORS[project.status] ?? ''}
                        variant="outline"
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest invoice activity</CardDescription>
              </div>
              <Link href="/dashboard/finance">
                <Button variant="ghost" size="sm">
                  View all <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="text-muted-foreground/30 mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">No invoices yet</p>
                <Link href="/dashboard/finance" className="mt-2">
                  <Button size="sm" variant="ghost">
                    Create your first invoice
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => {
                  const dueDate = invoice.dueDate.toDate();
                  const isOverdue =
                    dueDate < new Date() &&
                    invoice.status !== 'paid' &&
                    invoice.status !== 'cancelled';

                  return (
                    <Link
                      key={invoice.id}
                      href="/dashboard/finance"
                      className="hover:bg-accent/50 flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono truncate text-xs text-muted-foreground">
                          {invoice.invoiceNumber}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-medium">{formatIDR(invoice.amount)}</span>
                          <span
                            className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}
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
                        className={INVOICE_STATUS_COLORS[invoice.status] ?? ''}
                        variant="outline"
                      >
                        {INVOICE_STATUS_LABELS[invoice.status] ?? invoice.status}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
