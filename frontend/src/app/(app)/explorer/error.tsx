'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ExplorerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Explorer error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-bold mb-2">Data Explorer Error</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Could not load the data explorer. Please try again.
      </p>
      <Button onClick={reset} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  )
}
