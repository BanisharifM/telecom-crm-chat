import { Skeleton } from '@/components/ui/skeleton'

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-4 py-3 md:px-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <div className="flex-1 px-4 py-4 md:px-6 space-y-4">
        <div className="max-w-2xl mx-auto pt-8 space-y-4">
          <Skeleton className="h-12 w-56 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
          <div className="grid grid-cols-2 gap-2 mt-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
