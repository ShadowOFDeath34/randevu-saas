import { Skeleton } from '@/components/ui/skeleton'

export default function CustomersLoading() {
  return (
    <div className="p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-4" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-4" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
