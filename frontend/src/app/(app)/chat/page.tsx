'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (creating) return

    async function findOrCreate() {
      setCreating(true)
      try {
        // Check if there's already an empty "New Chat" we can reuse
        const res = await fetch('/api/conversations')
        const conversations = await res.json()
        const emptyChat = conversations.find((c: any) => c.title === 'New Chat')

        if (emptyChat) {
          // Reuse existing empty chat
          router.replace(`/chat/${emptyChat.id}`)
        } else {
          // Create a new one
          const createRes = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Chat' }),
          })
          const conv = await createRes.json()
          router.replace(`/chat/${conv.id}`)
        }
      } catch {
        // Silently fail
      }
    }
    findOrCreate()
  }, [router, creating])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-pulse text-muted-foreground text-sm">Creating new chat...</div>
    </div>
  )
}
