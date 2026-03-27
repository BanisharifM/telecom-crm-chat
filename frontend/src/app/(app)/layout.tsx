'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { AppSidebar } from '@/components/layout/AppSidebar'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()

  const { data: conversations, mutate: mutateConversations } = useSWR(
    session?.user ? '/api/conversations' : null,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10s
  )

  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email || '',
    image: session.user.image,
  } : null

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      })
      const conv = await res.json()
      mutateConversations()
      router.push(`/chat/${conv.id}`)
    } catch {
      router.push('/chat')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        user={user}
        conversations={conversations || []}
        onNewChat={handleNewChat}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
