'use client';

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header row skeleton */}
      <div className="flex items-center justify-end">
        <div className="h-10 w-32 rounded-md bg-muted" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="h-10 w-64 rounded-md bg-muted" />

      {/* Table skeleton */}
      <div className="space-y-2">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-border px-4 py-3">
          <div className="h-4 w-8 rounded bg-muted" />
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-4 w-24 rounded bg-muted" />
        </div>
        {/* Table rows */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-4 w-8 rounded bg-muted" />
            <div className="h-4 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}