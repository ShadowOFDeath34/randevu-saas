import { Skeleton } from '@/components/ui/skeleton'

export default function CalendarLoading() {
  return (
    <div className="p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-4 text-center">
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[100px] border-b border-r border-gray-100 p-2"
            >
              <Skeleton className="h-5 w-5 rounded-full mb-2" />
              <div className="space-y-1">
                {i % 3 === 0 && (
                  <>
                    <Skeleton className="h-6 w-full rounded" />
                    <Skeleton className="h-6 w-3/4 rounded" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
