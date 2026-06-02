'use client';

import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/features/auth/services/authService';

// ─── Geometry: Abstract left panel art ───────────────────────────

function GeometricArt() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden p-12">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute -right-8 top-16 h-64 w-64 rounded-full bg-amber-400/5 blur-3xl" />

      {/* Floating geometric shapes */}
      <div className="absolute right-8 top-12 flex items-center justify-center">
        <div className="relative">
          <div className="h-32 w-32 rotate-45 border border-amber-500/20" />
          <div className="absolute inset-4 -rotate-12 border border-white/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border border-amber-500/30" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-16 left-4">
        <div className="h-20 w-px bg-linear-to-b from-amber-500/40 to-transparent" />
        <div className="ml-4 mt-2 h-px w-10 bg-linear-to-r from-amber-500/20 to-transparent" />
      </div>

      {/* Bottom badge */}
      <div className="z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-xs font-medium tracking-widest text-amber-400/80 uppercase">
            v2.0 — Now Available
          </span>
        </div>
      </div>

      {/* Brand + quote — top */}
      <div className="z-10 space-y-6">
        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-white">Freelancer OS</div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">Business Operating System</div>
          </div>
        </div>

        <div className="max-w-xs space-y-3">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Your business,
            <br />
            <span className="text-amber-400">fully organized.</span>
          </h2>
          <p className="text-sm leading-relaxed text-white/50">
            The modern workspace for freelancers who take their business seriously.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Login Form ────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0b]">
      {/* Left panel — brand identity */}
      <div className="hidden w-1/2 lg:flex">
        <div className="flex w-full flex-col border-r border-white/5 bg-[#0d0d10]">
          <GeometricArt />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2">
        <div className="mx-auto w-full max-w-100 space-y-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <span className="font-semibold tracking-tight text-white">Freelancer OS</span>
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-white/40">Sign in to access your workspace</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-white/60 data-focus:text-white transition-colors"
              >
                Email address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                  className="h-11 bg-white/5 text-white placeholder:text-white/20 border-white/10 focus:border-amber-500/60 focus:bg-white/5 focus:ring-amber-500/20 data-focus:border-amber-500/60 data-focus:bg-white/5 data-focus:ring-amber-500/20 data-invalid:border-red-500/40 data-invalid:ring-red-500/20"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-amber-400 to-transparent opacity-0 transition-opacity data-[focus=true]:opacity-60"
                  style={{ left: '8px', right: '8px' }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-white/60 data-focus:text-white transition-colors"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={loading}
                  className="h-11 pr-10 bg-white/5 text-white placeholder:text-white/20 border-white/10 focus:border-amber-500/60 focus:bg-white/5 focus:ring-amber-500/20 data-focus:border-amber-500/60 data-focus:bg-white/5 data-focus:ring-amber-500/20 data-invalid:border-red-500/40 data-invalid:ring-red-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-amber-400 to-transparent opacity-0 transition-opacity data-[focus=true]:opacity-60"
                  style={{ left: '8px', right: '8px' }}
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full bg-amber-400 text-black font-semibold hover:bg-amber-300 active:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0a0a0b] px-3 text-xs text-white/20 uppercase tracking-widest">
                or
              </span>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-white/40">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
