'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare, LayoutDashboard, Table2, Menu, X,
  Plus, LogOut, Pin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Explorer', icon: Table2, href: '/explorer' },
]

interface Props {
  user?: { name?: string | null; email?: string; image?: string | null } | null
  conversations?: { id: string; title: string; pinned: boolean; updatedAt: string }[]
  onNewChat?: () => void
  onSignOut?: () => void
}

export function AppSidebar({ user, conversations = [], onNewChat, onSignOut }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand - dark badge logo works on dark sidebar in both themes */}
      <div className="px-3 py-3 flex justify-center">
        <img
          src="/logo-dark.png"
          alt="TelecomCo"
          className="w-full max-w-[240px] h-auto object-contain rounded-lg"
        />
      </div>

      <Separator className="bg-white/10" />

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent/15 text-white border border-sidebar-accent/30'
                  : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-white/10" />

      {/* Chat History (visible on chat page) */}
      {pathname.startsWith('/chat') && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-sidebar-foreground/50">
              Conversations
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/50 hover:text-white" onClick={onNewChat}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors truncate',
                  pathname === `/chat/${conv.id}`
                    ? 'bg-white/10 text-white'
                    : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
                )}
              >
                {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-sidebar-accent" />}
                <span className="truncate">{conv.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!pathname.startsWith('/chat') && <div className="flex-1" />}

      <Separator className="bg-white/10" />

      {/* Footer */}
      <div className="p-3 space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-2">
            {user.image ? (
              <img src={user.image} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-xs font-bold text-white">
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user.name || 'User'}</div>
              <div className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/50 hover:text-white" onClick={onSignOut}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] text-sidebar-foreground/30">
            Built by Mahdi BanisharifDehkordi
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-sidebar text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-200 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebar}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-72 md:shrink-0">
        {sidebar}
      </aside>
    </>
  )
}
