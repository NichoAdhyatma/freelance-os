import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import ActivateForm from './ActivateForm';

function ActivateLoadingFallback() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<ActivateLoadingFallback />}>
      <ActivateForm />
    </Suspense>
  );
}
