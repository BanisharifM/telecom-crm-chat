import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-5"><Skeleton className="h-14" /></Card>
        ))}
      </div>
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 mb-2 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4"><Skeleton className="h-72" /></Card>
        ))}
      </div>
    </div>
  )
}
