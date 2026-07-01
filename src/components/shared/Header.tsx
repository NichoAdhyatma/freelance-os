'use client';

import { LogOut, Menu, Moon, Sun, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toggleTheme } from '@/components/theme-provider';
import { useDashboardTitle } from '@/app/dashboard/_context';

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, sidebarOpen }: HeaderProps) {
  const { user, userProfile, signOut } = useAuth();
  const title = useDashboardTitle();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleToggleTheme = () => {
    toggleTheme();
    setIsDark(!isDark);
  };

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const PLAN_COLORS: Record<string, string> = {
    agency: 'var(--status-info)',
    pro: 'var(--status-info)',
  };

  return (
    <header
      className="flex h-14 items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--surface-base)]"
    >
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:bg-[var(--surface-hover)] press-scale focus-visible:outline-none focus-visible:ring-2"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <Menu className="h-4 w-4" />
          </button>
        )}
        {title && (
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">{title}</h1>
            <p className="text-xs text-[var(--text-tertiary)]">Freelancer OS</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleTheme}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all hover:bg-[var(--surface-hover)] active:scale-95"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-[var(--text-secondary)]" />
          ) : (
            <Moon className="h-4 w-4 text-[var(--text-secondary)]" />
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            style={{ border: '2px solid var(--border-default)' }}
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={userProfile?.avatar} alt={userProfile?.name} />
              <AvatarFallback
                className="text-xs font-semibold"
                style={{ background: 'var(--accent-muted)', color: 'var(--primary)' }}
              >
                {userProfile?.name ? getInitials(userProfile.name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 border border-[var(--border-default)]"
            style={{ background: 'var(--surface-raised)', color: 'var(--text-primary)' }}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile?.avatar} alt={userProfile?.name} />
                    <AvatarFallback
                      className="text-xs font-semibold"
                      style={{ background: 'var(--accent-muted)', color: 'var(--primary)' }}
                    >
                      {userProfile?.name ? getInitials(userProfile.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none">{userProfile?.name || 'User'}</p>
                    <p className="text-xs leading-none text-[var(--text-tertiary)]">{user?.email}</p>
                    {userProfile?.plan && userProfile.plan !== 'free' && (
                      <span
                        className="mt-1 inline-block w-fit rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide border"
                        style={{
                          background: PLAN_COLORS[userProfile.plan] + '20',
                          color: PLAN_COLORS[userProfile.plan],
                          borderColor: PLAN_COLORS[userProfile.plan] + '30',
                        }}
                      >
                        {userProfile.plan.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="cursor-pointer transition-colors hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
              >
                <User className="mr-2 h-4 w-4" />
                Profile & Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: 'var(--status-danger)' }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}