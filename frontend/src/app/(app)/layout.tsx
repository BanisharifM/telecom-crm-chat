'use client'

import { useRouter } from 'next/navigation'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // TODO: Replace with real auth session and conversation list
  const mockUser = { name: 'Demo User', email: 'demo@telecomco.chat', image: null }
  const mockConversations = [
    { id: 'demo-1', title: 'Churn analysis', pinned: true, updatedAt: new Date().toISOString() },
    { id: 'demo-2', title: 'Revenue by state', pinned: false, updatedAt: new Date().toISOString() },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        user={mockUser}
        conversations={mockConversations}
        onNewChat={() => router.push('/chat')}
        onSignOut={() => {/* TODO: sign out */}}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
