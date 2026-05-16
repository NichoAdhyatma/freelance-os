'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { isConfigured } from '@/lib/firebase/config';

export function FirebaseStatus() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    setConfigured(isConfigured());
  }, []);

  if (configured === null) {
    return null;
  }

  if (!configured) {
    return (
      <div className="border-destructive/50 bg-destructive/10 fixed right-4 bottom-4 max-w-sm rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-destructive font-medium">Firebase Not Configured</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Please check your .env.local file and restart the dev server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 max-w-sm rounded-lg border border-green-500/50 bg-green-500/10 p-4">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
        <p className="font-medium text-green-500">Firebase Connected</p>
      </div>
    </div>
  );
}
