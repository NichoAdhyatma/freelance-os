'use client';

import { Bell, CreditCard, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { useDashboardTitle } from '@/app/dashboard/_context';

export function Header() {
  const { user, userProfile, signOut } = useAuth();
  const title = useDashboardTitle();
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'agency':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'pro':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-muted';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="border-border bg-card flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        {title && (
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-muted-foreground text-xs">Dashboard / {title}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground relative flex h-9 w-9 items-center justify-center rounded-lg"
        >
          <Bell className="h-4 w-4" />
          <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium">
            3
          </span>
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userProfile?.avatar} alt={userProfile?.name} />
              <AvatarFallback>
                {userProfile?.name ? getInitials(userProfile.name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm leading-none font-medium">{userProfile?.name || 'User'}</p>
                  <p className="text-muted-foreground text-xs leading-none">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plan Badge */}
        {userProfile?.plan && userProfile.plan !== 'free' && (
          <Badge
            variant="secondary"
            className={`${getPlanBadgeColor(userProfile.plan)} border-0 text-white`}
          >
            {userProfile.plan.toUpperCase()}
          </Badge>
        )}
      </div>
    </header>
  );
}
