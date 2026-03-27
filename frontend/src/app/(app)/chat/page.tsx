'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2, Copy, Download, ChevronDown, ChevronUp, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatNumber } from '@/lib/utils'
import { sendChat } from '@/lib/api'
import type { ChatResponse } from '@/lib/types'
import { ChatMarkdown } from '@/components/chat/ChatMarkdown'
import { PlotlyChart } from '@/components/chat/PlotlyChart'
import { DateSeparator, shouldShowDateSeparator } from '@/components/chat/DateSeparator'
import { ScrollToBottom } from '@/components/chat/ScrollToBottom'
import { MessageActions } from '@/components/chat/MessageActions'
import { InfoPanel } from '@/components/chat/InfoPanel'

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sqlQuery?: string | null
  chartType?: string | null
  chartConfig?: Record<string, any> | null
  dataColumns?: string[] | null
  dataRows?: any[][] | null
  queryTimeMs?: number | null
  rowsReturned?: number | null
  createdAt?: string
}

const SUGGESTED = [
  { label: 'Overall churn rate', query: 'What is the overall churn rate?' },
  { label: 'Churn by state', query: 'Show churn rate by state' },
  { label: 'Top spenders', query: 'Top 10 customers by total charges' },
  { label: 'International plan impact', query: 'Compare international plan holders vs non-holders' },
  { label: 'Service calls', query: 'Distribution of customer service calls' },
  { label: 'Churn breakdown', query: 'Show me a pie chart of churn' },
]

/**
 * New Chat page - NO conversation created until first message is sent.
 * This follows the ChatGPT/Claude/Gemini pattern (lazy creation).
 */
export default function NewChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [infoPanelOpen, setInfoPanelOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, scrollToBottom])

  const handleSend = async (question?: string) => {
    const q = question || input.trim()
    if (!q || loading) return
    setInput('')

    // Add user message locally
    const userMsg: DisplayMessage = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content: q,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    scrollToBottom()

    try {
      // Build history
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }))

      // Query AI
      const res = await sendChat(q, history)

      // Add assistant response locally
      const assistantMsg: DisplayMessage = {
        id: `local-assistant-${Date.now()}`,
        role: 'assistant',
        content: res.explanation || res.error,
        sqlQuery: res.sql,
        chartType: res.chart_type,
        chartConfig: res.chart_config,
        dataColumns: res.columns,
        dataRows: res.data,
        queryTimeMs: res.query_time_ms,
        rowsReturned: res.rows_returned,
        createdAt: new Date().toISOString(),
      }
      setMessages(prev => [...prev, assistantMsg])

      // Create conversation in DB and save both messages
      // Both success and failure are real conversation exchanges
      const convRes = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: q.length > 50 ? q.substring(0, 50) + '...' : q }),
      })
      const conv = await convRes.json()

      const saveMsg = async (msg: any) => {
        await fetch(`/api/conversations/${conv.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        })
      }

      await saveMsg({ role: 'user', content: q })
      await saveMsg({
        role: 'assistant',
        content: res.explanation || res.error,
        sqlQuery: res.sql || null,
        chartType: res.chart_type,
        chartConfig: res.chart_config,
        dataColumns: res.columns?.length ? res.columns : null,
        dataRows: res.data?.length ? res.data : null,
        queryTimeMs: res.query_time_ms,
        rowsReturned: res.rows_returned,
      })

      // Navigate to the conversation page (full navigation, not just URL change)
      // This ensures subsequent messages use the [id]/page.tsx component
      // which appends to the existing conversation instead of creating new ones
      router.push(`/chat/${conv.id}`)

    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `local-error-${Date.now()}`,
        role: 'assistant',
        content: `Something went wrong: ${err.message}. Please try again.`,
        createdAt: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
      scrollToBottom()
    }
  }

  const downloadCSV = (msg: DisplayMessage) => {
    if (!msg.dataColumns || !msg.dataRows) return
    const header = msg.dataColumns.join(',')
    const rows = msg.dataRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const name = msg.chartConfig?.title
      || msg.content?.substring(0, 30).replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_')
      || 'query_results'
    a.href = url; a.download = `${name}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const assistantMessages = messages.filter(m => m.role === 'assistant')

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3 md:px-6 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Chat</h1>
            <p className="text-sm text-muted-foreground">Ask questions about your CRM data in plain English.</p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground border-border hover:text-foreground hover:border-primary/40 transition-colors"
              onClick={() => setInfoPanelOpen(!infoPanelOpen)}
            >
              {infoPanelOpen ? 'Hide Details' : 'Details'}
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto px-4 py-4 md:px-6 space-y-4">
          <ScrollToBottom scrollRef={scrollContainerRef} />

          {messages.length === 0 && !loading && (
            <div className="max-w-2xl mx-auto pt-8 animate-fade-in">
              <div className="text-center mb-8">
                <img src="/logo-dark.png" alt="TelecomCo" className="w-56 h-auto mx-auto mb-4 rounded-lg hidden dark:block" />
                <img src="/logo-light.png" alt="TelecomCo" className="w-56 h-auto mx-auto mb-4 dark:hidden block" />
                <p className="text-muted-foreground">Ask questions about <strong>3,333 telecom customers</strong></p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED.map(sq => (
                  <button
                    key={sq.query}
                    onClick={() => handleSend(sq.query)}
                    className="text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm"
                  >
                    {sq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id}>
              {msg.createdAt && shouldShowDateSeparator(msg.createdAt, messages[i - 1]?.createdAt) && (
                <DateSeparator date={msg.createdAt} />
              )}
              <MessageBubble msg={msg} onDownloadCSV={() => downloadCSV(msg)} />
            </div>
          ))}

          {loading && (
            <div className="max-w-3xl animate-fade-in">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1 text-primary">Assistant</div>
              <div className="rounded-xl px-4 py-3 border bg-card mr-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3 md:px-6 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask about churn, billing, service calls..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || loading} size="icon" className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <InfoPanel
        open={infoPanelOpen}
        onClose={() => setInfoPanelOpen(false)}
        messages={assistantMessages}
      />
    </div>
  )
}

function downloadChartImage(msgId: string, title: string) {
  const container = document.getElementById(`chart-${msgId}`)
  if (!container) return
  const plotDiv = container.querySelector('.js-plotly-plot') as any
  if (!plotDiv) return
  try {
    const Plotly = require('plotly.js-basic-dist-min')
    Plotly.downloadImage(plotDiv, {
      format: 'png',
      width: 1200,
      height: 600,
      filename: title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') || 'chart',
    })
  } catch {
    // Fallback: use toImage and create download link
    const canvas = container.querySelector('canvas')
    if (canvas) {
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${title}.png`
      a.click()
    }
  }
}

function MessageBubble({ msg, onDownloadCSV }: { msg: DisplayMessage; onDownloadCSV: () => void }) {
  return (
    <div className={cn('max-w-3xl animate-fade-in', msg.role === 'user' ? 'ml-auto' : '')}>
      <div className={cn('text-[10px] uppercase tracking-wider font-bold mb-1', msg.role === 'user' ? 'text-right text-muted-foreground' : 'text-primary')}>
        {msg.role === 'user' ? 'You' : 'Assistant'}
      </div>
      <div className={cn(
        'rounded-xl px-4 py-3 border',
        msg.role === 'user' ? 'bg-primary/5 border-primary/20 ml-8' : 'bg-card border-border mr-8'
      )}>
        <ChatMarkdown content={msg.content} />

        {msg.sqlQuery && !msg.sqlQuery.startsWith('SELECT 1') && <SQLViewer sql={msg.sqlQuery} />}

        {msg.dataRows && msg.dataRows.length === 1 && msg.chartType !== 'none' && msg.dataColumns && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {msg.dataColumns.map((col, ci) => {
              const val = msg.dataRows![0][ci]
              if (typeof val !== 'number') return null
              return (
                <Card key={col} className="p-3 text-center">
                  <div className="text-lg font-bold">{formatNumber(val, col)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{col.replace(/_/g, ' ')}</div>
                </Card>
              )
            })}
          </div>
        )}

        {msg.dataRows && msg.dataRows.length > 1 && msg.chartType && !['none', 'table', 'metric'].includes(msg.chartType) && msg.dataColumns && (
          <div className="mt-3 -mx-1" id={`chart-${msg.id}`}>
            <PlotlyChart chartType={msg.chartType} columns={msg.dataColumns} data={msg.dataRows} config={msg.chartConfig || {}} />
          </div>
        )}

        {msg.dataRows && msg.dataRows.length > 1 && msg.dataColumns && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  {msg.dataColumns.map(c => (
                    <th key={c} className="px-3 py-2 text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {msg.dataRows.slice(0, 20).map((row, ri) => (
                  <tr key={ri} className="border-t border-border hover:bg-muted/30 transition-colors">
                    {row.map((cell: any, ci: number) => (
                      <td key={ci} className="px-3 py-1.5 whitespace-nowrap">
                        {typeof cell === 'number' ? formatNumber(cell, msg.dataColumns![ci]) : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {msg.dataRows.length > 20 && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground border-t">Showing 20 of {msg.dataRows.length} rows</div>
            )}
          </div>
        )}

        {msg.dataRows && msg.dataRows.length > 0 && msg.chartType !== 'none' && (
          <div className="mt-2 flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={onDownloadCSV}>
              <Download className="h-3 w-3 mr-1" /> CSV
            </Button>
            {msg.chartType && !['none', 'table', 'metric'].includes(msg.chartType) && (
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadChartImage(msg.id, msg.chartConfig?.title || 'chart')}>
                <Image className="h-3 w-3 mr-1" /> PNG
              </Button>
            )}
            {msg.sqlQuery && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigator.clipboard.writeText(msg.sqlQuery!)}>
                <Copy className="h-3 w-3 mr-1" /> SQL
              </Button>
            )}
          </div>
        )}

      </div>
      {/* Action buttons below the bubble (Claude pattern) */}
      <MessageActions content={msg.content} messageId={msg.id} role={msg.role} />
    </div>
  )
}

function SQLViewer({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Hide SQL' : 'Show SQL'}
      </button>
      {open && <pre className="mt-1 p-3 rounded-lg bg-muted text-xs overflow-x-auto font-mono">{sql}</pre>}
    </div>
  )
}
