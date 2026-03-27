import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

export default function ExplorerLoading() {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56 mt-1" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-3"><Skeleton className="h-12" /></Card>
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  )
}
