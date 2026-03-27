'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import useSWR from 'swr'
import { AppSidebar } from '@/components/layout/AppSidebar'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const { data: conversations, mutate: mutateConversations } = useSWR(
    session?.user ? '/api/conversations' : null,
    fetcher,
    { refreshInterval: 10000 }
  )

  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email || '',
    image: session.user.image,
  } : null

  const handleNewChat = () => {
    // Navigate to /chat (lazy creation - no DB record until first message)
    router.push('/chat')
  }

  const handleDeleteChat = async (id: string) => {
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      mutateConversations()
      // If we're viewing the deleted chat, redirect to /chat
      if (pathname === `/chat/${id}`) {
        router.push('/chat')
      }
    } catch {}
  }

  const handleRenameChat = async (id: string, title: string) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      mutateConversations()
    } catch {}
  }

  const handlePinChat = async (id: string, pinned: boolean) => {
    try {
      await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      })
      mutateConversations()
    } catch {}
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        user={user}
        conversations={conversations || []}
        onNewChat={handleNewChat}
        onSignOut={() => signOut({ callbackUrl: '/' })}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onPinChat={handlePinChat}
      />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
