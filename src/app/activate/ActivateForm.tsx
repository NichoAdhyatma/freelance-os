'use client';

import { Check, Loader2, Shield, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { activateLicense } from '@/features/license/services/licenseService';

const PLAN_FEATURES = {
  free: {
    title: 'Free Plan',
    features: ['Up to 3 projects', 'Basic dashboard', 'Client management'],
    color: 'bg-muted',
  },
  pro: {
    title: 'Pro Plan',
    features: [
      'Unlimited projects',
      'Invoice management',
      'Revenue analytics',
      'Priority support',
      'Advanced dashboard',
    ],
    color: 'bg-blue-500',
  },
  agency: {
    title: 'Agency Plan',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Client portal',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
    color: 'bg-purple-500',
  },
};

export default function ActivateForm() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState('');

  // Redirect when profile is loaded and already active (useEffect instead of early return)
  useEffect(() => {
    if (!authLoading && userProfile?.licenseStatus === 'active') {
      router.push('/dashboard');
    }
  }, [authLoading, userProfile, router]);

  const handleActivate = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);

    try {
      const result = await activateLicense(user.uid, licenseKey);
      if (result.valid) {
        await refreshProfile();
        router.push('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to activate license');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="bg-primary flex h-12 w-12 items-center justify-center rounded-lg">
              <Sparkles className="text-primary-foreground h-6 w-6" />
            </div>
            <span className="text-2xl font-semibold">Freelancer OS</span>
          </div>
          <h1 className="text-3xl font-bold">Activate Your License</h1>
          <p className="text-muted-foreground">Enter your license key to unlock all features</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* License Activation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Enter License Key</CardTitle>
              <CardDescription>
                Your license key was sent to your email after purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="licenseKey">License Key</Label>
                <Input
                  id="licenseKey"
                  placeholder="FOS-PRO-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  className="font-mono text-lg tracking-wider"
                />
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-muted-foreground text-sm">
                  Format example:{' '}
                  <code className="bg-background rounded px-1 py-0.5">FOS-PRO-AB12-CD34</code>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button onClick={handleActivate} className="w-full" disabled={loading || !licenseKey}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activate License
              </Button>

              <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground w-full">
                Continue with Free Plan (Limited Features)
              </Button>
            </CardFooter>
          </Card>

          {/* Plan Features */}
          <div className="space-y-4">
            {Object.entries(PLAN_FEATURES).map(([plan, details]) => (
              <Card key={plan} className={plan === 'pro' ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{details.title}</CardTitle>
                    {plan === 'pro' && <Badge className={details.color}>Recommended</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {details.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Secure & Protected
              </div>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" />
                Instant Activation
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Link */}
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have a license key?{' '}
          <a
            href="https://lynk.id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Purchase from Lynk.id
          </a>
        </p>
      </div>
    </div>
  );
}
