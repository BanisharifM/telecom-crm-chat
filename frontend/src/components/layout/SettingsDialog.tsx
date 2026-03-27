'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import {
  X, User, Palette, MessageSquare, Database, AlertTriangle,
  Sun, Moon, Monitor, LogOut, Trash2, Download, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

type Tab = 'account' | 'appearance' | 'chat' | 'data' | 'danger'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'account', label: 'Account', icon: User },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'chat', label: 'AI Chat', icon: MessageSquare },
  { key: 'data', label: 'Data', icon: Database },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
]

export function SettingsDialog({ open, onClose }: Props) {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [showSql, setShowSql] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [exportingChats, setExportingChats] = useState(false)
  const [clearSuccess, setClearSuccess] = useState(false)

  if (!open) return null

  const handleClearAllChats = async () => {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    try {
      const res = await fetch('/api/conversations')
      const convs = await res.json()
      for (const conv of convs) {
        await fetch(`/api/conversations/${conv.id}`, { method: 'DELETE' })
      }
      setClearSuccess(true)
      setDeleteConfirm('')
      setTimeout(() => {
        setClearSuccess(false)
        window.location.href = '/chat'
      }, 1500)
    } catch {
      // silently fail
    } finally {
      setDeleting(false)
    }
  }

  const handleExportChats = async () => {
    setExportingChats(true)
    try {
      const convRes = await fetch('/api/conversations')
      const convs = await convRes.json()

      const allData: any[] = []
      for (const conv of convs) {
        const msgRes = await fetch(`/api/conversations/${conv.id}/messages`)
        const msgs = await msgRes.json()
        allData.push({ ...conv, messages: msgs })
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `telecomco-chats-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setExportingChats(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[640px] sm:max-h-[520px] z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar tabs */}
          <div className="w-40 shrink-0 border-r border-border py-2 overflow-y-auto hidden sm:block">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
                  activeTab === tab.key
                    ? 'text-foreground bg-muted font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  tab.key === 'danger' && 'text-destructive hover:text-destructive'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile tabs */}
          <div className="sm:hidden border-b border-border flex overflow-x-auto shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors',
                  activeTab === tab.key
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground',
                  tab.key === 'danger' && 'text-destructive'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Account */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Profile</h3>
                  <div className="flex items-center gap-4">
                    {session?.user?.image ? (
                      <img src={session.user.image} alt="" className="h-14 w-14 rounded-full" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                        {(session?.user?.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{session?.user?.name || 'User'}</div>
                      <div className="text-sm text-muted-foreground">{session?.user?.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Signed in with Google</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })} className="gap-2">
                    <LogOut className="h-4 w-4" /> Log Out
                  </Button>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-1">Theme</h3>
                  <p className="text-xs text-muted-foreground mb-3">Choose how the app looks</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors',
                          theme === opt.value
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary/30'
                        )}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Chat */}
            {activeTab === 'chat' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-1">Show SQL Queries</h3>
                  <p className="text-xs text-muted-foreground mb-3">Display the generated SQL in chat responses</p>
                  <ToggleSwitch checked={showSql} onChange={setShowSql} />
                </div>
              </div>
            )}

            {/* Data */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-1">Export Chat History</h3>
                  <p className="text-xs text-muted-foreground mb-3">Download all your conversations as JSON</p>
                  <Button variant="outline" size="sm" onClick={handleExportChats} disabled={exportingChats} className="gap-2">
                    <Download className="h-4 w-4" />
                    {exportingChats ? 'Exporting...' : 'Export All Chats'}
                  </Button>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="rounded-lg border border-destructive/30 p-4">
                  <h3 className="text-sm font-medium text-destructive mb-1">Delete All Chats</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Permanently delete all your conversations and messages. This action cannot be undone.
                  </p>
                  {clearSuccess ? (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Check className="h-4 w-4" /> All chats deleted
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">
                          Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={e => setDeleteConfirm(e.target.value)}
                          placeholder="DELETE"
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearAllChats}
                        disabled={deleteConfirm !== 'DELETE' || deleting}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? 'Deleting...' : 'Delete All Chats'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted'
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
        checked ? 'translate-x-6' : 'translate-x-1'
      )} />
    </button>
  )
}
