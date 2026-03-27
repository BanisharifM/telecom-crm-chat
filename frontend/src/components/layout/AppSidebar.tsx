'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Table2, Menu, X, SquarePen,
  LogOut, Pin, Search, Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Data Explorer', icon: Table2, href: '/explorer' },
]

interface Props {
  user?: { name?: string | null; email?: string; image?: string | null } | null
  conversations?: { id: string; title: string; pinned: boolean; updatedAt: string }[]
  onNewChat?: () => void
  onSignOut?: () => void
}

export function AppSidebar({ user, conversations = [], onNewChat, onSignOut }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedConvos = filteredConversations.filter(c => c.pinned)
  const recentConvos = filteredConversations.filter(c => !c.pinned)

  const handleNewChat = () => {
    onNewChat?.()
    setMobileOpen(false)
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="px-3 pt-3 pb-1 flex justify-center">
        <Link href="/">
          <img
            src="/logo-dark.png"
            alt="TelecomCo"
            className="w-full max-w-[200px] h-auto object-contain rounded-lg"
          />
        </Link>
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-3 pb-1">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-sidebar-accent/15 text-sidebar-accent border border-sidebar-accent/30 hover:bg-sidebar-accent/25 hover:text-white transition-all"
          variant="outline"
          size="sm"
        >
          <SquarePen className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator className="bg-white/10 my-2 mx-3" />

      {/* Navigation */}
      <nav className="px-3 space-y-0.5">
        <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-sidebar-foreground/40 px-3 mb-1">
          Navigation
        </div>
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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

      <Separator className="bg-white/10 my-2 mx-3" />

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-sidebar-foreground/40 px-3">
            Chats
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/30" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:outline-none focus:border-sidebar-accent/40"
          />
        </div>

        {/* Pinned */}
        {pinnedConvos.length > 0 && (
          <div className="mb-2">
            <div className="text-[9px] uppercase tracking-wider text-sidebar-foreground/30 px-3 mb-1">Pinned</div>
            {pinnedConvos.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={pathname === `/chat/${conv.id}`}
                onClick={() => { router.push(`/chat/${conv.id}`); setMobileOpen(false) }}
              />
            ))}
          </div>
        )}

        {/* Recent */}
        {recentConvos.length > 0 && (
          <div>
            <div className="text-[9px] uppercase tracking-wider text-sidebar-foreground/30 px-3 mb-1">Recent</div>
            {recentConvos.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={pathname === `/chat/${conv.id}`}
                onClick={() => { router.push(`/chat/${conv.id}`); setMobileOpen(false) }}
              />
            ))}
          </div>
        )}

        {filteredConversations.length === 0 && (
          <div className="text-center py-6 text-xs text-sidebar-foreground/30">
            {searchQuery ? 'No chats found' : 'No conversations yet'}
          </div>
        )}
      </div>

      <Separator className="bg-white/10 mx-3" />

      {/* User + Settings */}
      <div className="p-3 space-y-2">
        {user ? (
          <div className="flex items-center gap-2.5 px-2">
            {user.image ? (
              <img src={user.image} alt="" className="h-8 w-8 rounded-full shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(user.name || user.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user.name || 'User'}</div>
              <div className="text-[10px] text-sidebar-foreground/40 truncate">{user.email}</div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-sidebar-accent border border-sidebar-accent/30 rounded-lg hover:bg-sidebar-accent/10 transition-colors"
          >
            Log In
          </Link>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-sidebar-foreground/40 hover:text-white">
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-sidebar-foreground/40 hover:text-white"
                onClick={onSignOut}
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <span className="text-[9px] text-sidebar-foreground/20">
            by Mahdi B.
          </span>
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

function ConversationItem({ conv, active, onClick }: {
  conv: { id: string; title: string; pinned: boolean }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors truncate',
        active
          ? 'bg-white/10 text-white'
          : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
      )}
    >
      {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-sidebar-accent" />}
      <span className="truncate">{conv.title}</span>
    </button>
  )
}
