'use client';

import { ArrowRight, FolderKanban, Receipt, Sparkles, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Organize your work with Kanban boards and timeline views',
  },
  {
    icon: Users,
    title: 'Client CRM',
    description: 'Manage contacts, track history, and monitor revenue per client',
  },
  {
    icon: Receipt,
    title: 'Invoice & Finance',
    description: 'Create invoices, track payments, and analyze revenue',
  },
  {
    icon: TrendingUp,
    title: 'Productivity Insights',
    description: 'Get clarity on your business with real-time analytics',
  },
];

export default function HomePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Navigation */}
      <header className="border-border border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-9 w-9 items-center justify-center rounded-lg">
              <Sparkles className="text-primary-foreground h-4 w-4" />
            </div>
            <span className="text-lg font-semibold">Freelancer OS</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-24">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            The Operating System
            <br />
            for <span className="text-primary">Freelancers</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-xl">
            The modern operating system for freelancers. Manage projects, clients, invoices, and
            revenue in one beautiful workspace.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/30 px-4 py-16">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Everything You Need</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card">
                <CardHeader>
                  <div className="bg-primary/10 mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
                    <feature.icon className="text-primary h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Organized?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of freelancers who run their business with Freelancer OS
          </p>
          <Link href="/register">
            <Button size="lg">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-border border-t px-4 py-8">
        <div className="text-muted-foreground container mx-auto text-center text-sm">
          <p>Built with care for freelancers worldwide</p>
        </div>
      </footer>
    </div>
  );
}
