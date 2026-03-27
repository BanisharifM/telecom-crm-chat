'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // TODO: Replace with real conversation list from API
  const conversations: { id: string; title: string; pinned: boolean; updatedAt: string }[] = []

  const user = session?.user ? {
    name: session.user.name,
    email: session.user.email || '',
    image: session.user.image,
  } : null

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        user={user}
        conversations={conversations}
        onNewChat={() => router.push('/chat')}
        onSignOut={() => signOut({ callbackUrl: '/' })}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
