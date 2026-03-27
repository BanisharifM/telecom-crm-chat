'use client'

function formatDateLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function shouldShowDateSeparator(currentDate: string, previousDate?: string): boolean {
  if (!previousDate) return true
  return new Date(currentDate).toDateString() !== new Date(previousDate).toDateString()
}

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
        {formatDateLabel(new Date(date))}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
