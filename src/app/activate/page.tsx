import { Suspense } from 'react';

import ActivateForm from './ActivateForm';

function ActivateLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] px-8">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="space-y-2">
          <div className="h-9 w-48 rounded-lg bg-white/5" />
          <div className="h-4 w-72 rounded bg-white/5" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-white/5" />
          <div className="h-12 rounded-xl border border-white/10 bg-white/5" />
        </div>
        <div className="h-11 rounded-xl bg-amber-400/10" />
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 border-t border-white/5" />
          <div className="h-3 w-8 rounded bg-white/5" />
          <div className="h-px flex-1 border-t border-white/5" />
        </div>
        <div className="h-14 rounded-xl border border-white/10 bg-white/3" />
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