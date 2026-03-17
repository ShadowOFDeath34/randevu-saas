import { Skeleton } from '@/components/ui/skeleton'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-gray-600 text-sm">Yükleniyor...</p>
      </div>
    </div>
  )
}
