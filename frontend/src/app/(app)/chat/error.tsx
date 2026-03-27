'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Chat error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <MessageSquare className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-bold mb-2">Chat Error</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.message || 'Something went wrong with this conversation.'}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        <Link href="/chat">
          <Button variant="default">
            New Chat
          </Button>
        </Link>
      </div>
    </div>
  )
}
