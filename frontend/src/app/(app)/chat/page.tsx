'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-create a new conversation and redirect to it
    async function createAndRedirect() {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Chat' }),
        })
        const conv = await res.json()
        router.replace(`/chat/${conv.id}`)
      } catch {
        // If creation fails, stay on page
      }
    }
    createAndRedirect()
  }, [router])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-muted-foreground text-sm">Creating new chat...</div>
    </div>
  )
}
