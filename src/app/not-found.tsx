'use client';

import Link from 'next/link';
import { CircleSlash, Home, FolderKanban, Users } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <CircleSlash className="text-muted-foreground mx-auto mb-6 h-20 w-20" />
        <h1 className="text-foreground text-6xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground mb-8 mt-2 text-lg">Page not found</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="text-muted-foreground flex items-center gap-2 text-sm transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/projects"
            className="text-muted-foreground flex items-center gap-2 text-sm transition-colors hover:text-foreground"
          >
            <FolderKanban className="h-4 w-4" />
            Projects
          </Link>
          <Link
            href="/dashboard/clients"
            className="text-muted-foreground flex items-center gap-2 text-sm transition-colors hover:text-foreground"
          >
            <Users className="h-4 w-4" />
            Clients
          </Link>
        </div>
      </div>
    </div>
  );
}