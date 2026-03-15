/**
 * Community Detail Page — Suspense Skeleton
 *
 * Shown while the server component fetches community data.
 */

export default function CommunityDetailLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <div className="w-full animate-pulse bg-gray-100" style={{ height: '50vh', minHeight: 400 }} />

      {/* Content skeleton */}
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-12">
        {/* Title area */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-8 w-64 rounded bg-gray-200 animate-pulse" />
          <div className="h-5 w-96 rounded bg-gray-200 animate-pulse" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-6 space-y-2">
              <div className="h-3 w-20 mx-auto rounded bg-gray-200 animate-pulse" />
              <div className="h-7 w-24 mx-auto rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-6 space-y-3">
              <div className="h-40 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
