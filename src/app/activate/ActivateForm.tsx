'use client';

import { Check, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { activateLicense, validateLicenseKey } from '@/features/license/services/licenseService';

export default function ActivateForm() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();

  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'valid' | 'invalid' | 'error'
  >('idle');
  const [detectedPlan, setDetectedPlan] = useState<string | null>(null);

  // Redirect when profile is loaded and already active
  useEffect(() => {
    if (!authLoading && userProfile?.licenseStatus === 'active') {
      router.push('/dashboard');
    }
  }, [authLoading, userProfile, router]);

  // Auto-format license key + real-time validation
  const handleLicenseChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setLicenseKey(normalized);
    setValidationStatus('idle');
    setDetectedPlan(null);
    setError(null);
  };

  useEffect(() => {
    if (licenseKey.length >= 10) {
      setValidating(true);
      validateLicenseKey(licenseKey)
        .then((result) => {
          if (result.valid) {
            setValidationStatus('valid');
            // Extract plan from key format FOS-PRO-XXXX / FOS-AGENCY-XXXX
            const match = licenseKey.match(/^FOS-(PRO|AGENCY|FREE)-/i);
            if (match) setDetectedPlan(match[1].toLowerCase());
          } else {
            setValidationStatus('invalid');
          }
        })
        .catch(() => {
          setValidationStatus('error');
        })
        .finally(() => {
          setValidating(false);
        });
    } else {
      setValidationStatus('idle');
    }
  }, [licenseKey]);

  const handleActivate = async () => {
    if (!user || !licenseKey) return;
    setError(null);
    setLoading(true);

    try {
      const result = await activateLicense(user.uid, licenseKey);
      if (result.valid) {
        setSuccess(true);
        await refreshProfile();
        setTimeout(() => router.push('/dashboard'), 2200);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to activate license');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0b]">
      {/* ── Left panel: Branding ──────────────────────────── */}
      <div className="hidden w-1/2 lg:flex">
        <div className="relative flex w-full flex-col border-r border-white/5 bg-[#0d0d10]">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          {/* Ambient orbs */}
          <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -right-8 top-16 h-64 w-64 rounded-full bg-amber-400/5 blur-3xl" />

          {/* Decorative geometry */}
          <div className="absolute right-8 top-12">
            <div className="relative">
              <div className="h-32 w-32 rotate-45 border border-amber-500/20" />
              <div className="absolute inset-4 -rotate-12 border border-white/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border border-amber-500/30" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-16 left-4">
            <div className="h-20 w-px bg-gradient-to-b from-amber-500/40 to-transparent" />
            <div className="ml-4 mt-2 h-px w-10 bg-gradient-to-r from-amber-500/20 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <div className="font-semibold tracking-tight text-white">Freelancer OS</div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/30">
                  Business Operating System
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight text-white">
                One key.
                <br />
                <span className="text-amber-400">Full access.</span>
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-white/50">
                Enter your license key to unlock your workspace. The key determines your plan automatically.
              </p>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-white/40">Secure activation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-white/40">Instant access</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-xs text-white/40">Auto plan detection</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel: Activation form ─────────────────── */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2">
        <div className="mx-auto w-full max-w-[440px] space-y-10">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
              <Sparkles className="h-4 w-4 text-amber-400" />
            </div>
            <span className="font-semibold tracking-tight text-white">Freelancer OS</span>
          </div>

          {/* ── Success state ──────────────────────────────── */}
          {success ? (
            <div className="space-y-8 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30">
                    <Check className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="absolute inset-0 rounded-full border border-green-500/10 animate-ping" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {detectedPlan
                    ? `Welcome to ${detectedPlan.charAt(0).toUpperCase() + detectedPlan.slice(1)}!`
                    : 'Activated!'}
                </h1>
                <p className="text-sm text-white/40">
                  Your license is active. Preparing your workspace...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Activation form ─────────────────────────── */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Activate your license
                  </h1>
                  <p className="text-sm text-white/40">
                    Paste your license key below. Your plan is detected automatically.
                  </p>
                </div>

                {/* License key input */}
                <div className="space-y-3">
                  <Label
                    htmlFor="licenseKey"
                    className="text-white/60"
                  >
                    License key
                  </Label>
                  <div className="relative">
                    <Input
                      id="licenseKey"
                      placeholder="FOS-PRO-AB12-CD34"
                      value={licenseKey}
                      onChange={(e) => handleLicenseChange(e.target.value)}
                      disabled={loading || validating}
                      className="h-12 pr-12 font-mono text-base tracking-wider bg-white/5 text-white placeholder:text-white/20 border-white/10 focus:border-amber-500/60 focus:bg-white/5 focus:ring-amber-500/20 data-[focus]:border-amber-500/60 data-[focus]:bg-white/5 data-[focus]:ring-amber-500/20"
                    />

                    {/* Validation indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {validating && <Loader2 className="h-4 w-4 animate-spin text-white/30" />}
                      {validationStatus === 'valid' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                          <Check className="h-3 w-3 text-green-400" />
                        </div>
                      )}
                      {validationStatus === 'invalid' && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                          <div className="h-1 w-1.5 rounded-full bg-red-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Validation feedback */}
                  {validationStatus === 'valid' && detectedPlan && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      <p className="text-xs text-green-400">
                        Valid key — activating{' '}
                        <span className="font-semibold capitalize">{detectedPlan}</span> plan
                      </p>
                    </div>
                  )}
                  {validationStatus === 'invalid' && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <p className="text-xs text-red-400">This key is invalid, revoked, or already used</p>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Activate button */}
                <Button
                  onClick={handleActivate}
                  disabled={
                    loading ||
                    !licenseKey ||
                    validationStatus === 'invalid' ||
                    validating
                  }
                  className="h-11 w-full bg-amber-400 text-black font-semibold hover:bg-amber-300 active:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    'Activate License'
                  )}
                </Button>

                {/* Help text */}
                <div className="space-y-1 text-center">
                  <p className="text-xs text-white/20">
                    Don&apos;t have a license key?{' '}
                    <a
                      href="https://lynk.id"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400/60 hover:text-amber-400 transition-colors"
                    >
                      Purchase from Lynk.id
                    </a>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}