'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Copy, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatNumber } from '@/lib/utils'
import { sendChat } from '@/lib/api'
import type { ChatResponse } from '@/lib/types'
import { ChatMarkdown } from '@/components/chat/ChatMarkdown'
import { PlotlyChart } from '@/components/chat/PlotlyChart'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  response?: ChatResponse
}

const SUGGESTED_QUERIES = [
  { label: 'Overall churn rate', query: 'What is the overall churn rate?' },
  { label: 'Churn by state', query: 'Show churn rate by state' },
  { label: 'Top spenders', query: 'Top 10 customers by total charges' },
  { label: 'International plan impact', query: 'Compare international plan holders vs non-holders' },
  { label: 'Service call distribution', query: 'Distribution of customer service calls' },
  { label: 'Churn pie chart', query: 'Show me a pie chart of churn' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (question?: string) => {
    const q = question || input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.response?.explanation || m.content),
      }))

      const res = await sendChat(q, history)
      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: res.explanation || res.error,
        response: res,
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Something went wrong: ${err.message}. Please try again.`,
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const downloadCSV = (res: ChatResponse) => {
    const header = res.columns.join(',')
    const rows = res.data.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'results.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 md:px-6 shrink-0">
        <h1 className="text-lg font-bold tracking-tight">Chat</h1>
        <p className="text-sm text-muted-foreground">Ask questions about your CRM data in plain English.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 space-y-4">
        {/* Empty state */}
        {messages.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto pt-8 animate-fade-in">
            <div className="text-center mb-8">
              {/* Dark mode: dark badge logo (white text on navy) */}
              <img src="/logo-dark-badge.png" alt="TelecomCo" className="w-72 h-auto mx-auto mb-4 rounded-lg hidden dark:block" />
              {/* Light mode: light logo (dark text on white bg) */}
              <img src="/logo-light.png" alt="TelecomCo" className="w-72 h-auto mx-auto mb-4 dark:hidden block" />
              <p className="text-muted-foreground mt-1">
                Ask questions about <strong>3,333 telecom customers</strong> - churn, billing, service calls, and more.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_QUERIES.map(sq => (
                <button
                  key={sq.query}
                  onClick={() => handleSend(sq.query)}
                  className="text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm"
                >
                  <span className="text-foreground font-medium">{sq.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => (
          <div key={msg.id} className={cn('max-w-3xl animate-fade-in', msg.role === 'user' ? 'ml-auto' : '')}>
            {/* Role label */}
            <div className={cn('text-[10px] uppercase tracking-wider font-bold mb-1', msg.role === 'user' ? 'text-right text-muted-foreground' : 'text-primary')}>
              {msg.role === 'user' ? 'You' : 'Assistant'}
            </div>

            {/* Bubble */}
            <div className={cn(
              'rounded-xl px-4 py-3 border',
              msg.role === 'user'
                ? 'bg-primary/5 border-primary/20 ml-8'
                : 'bg-card border-border mr-8'
            )}>
              {/* Text content */}
              <ChatMarkdown content={msg.content} />

              {/* SQL query (collapsible) */}
              {msg.response?.sql && msg.response.sql !== 'SELECT 1' && (
                <SQLViewer sql={msg.response.sql} />
              )}

              {/* Metric cards */}
              {msg.response?.success && msg.response.data.length === 1 && msg.response.chart_type !== 'none' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {msg.response.columns.map((col, ci) => {
                    const val = msg.response!.data[0][ci]
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

              {/* Chart */}
              {msg.response?.success && msg.response.data.length > 1 &&
               !['none', 'table', 'metric'].includes(msg.response.chart_type) && (
                <div className="mt-3 -mx-1">
                  <PlotlyChart
                    chartType={msg.response.chart_type}
                    columns={msg.response.columns}
                    data={msg.response.data}
                    config={msg.response.chart_config}
                  />
                </div>
              )}

              {/* Table */}
              {msg.response?.success && msg.response.data.length > 1 && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        {msg.response.columns.map(c => (
                          <th key={c} className="px-3 py-2 text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.response.data.slice(0, 20).map((row, ri) => (
                        <tr key={ri} className="border-t border-border hover:bg-muted/30 transition-colors">
                          {row.map((cell: any, ci: number) => (
                            <td key={ci} className="px-3 py-1.5 whitespace-nowrap">
                              {typeof cell === 'number' ? formatNumber(cell, msg.response!.columns[ci]) : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {msg.response.data.length > 20 && (
                    <div className="px-3 py-1.5 text-xs text-muted-foreground border-t">
                      Showing 20 of {msg.response.data.length} rows
                    </div>
                  )}
                </div>
              )}

              {/* Download */}
              {msg.response?.success && msg.response.data.length > 0 && msg.response.chart_type !== 'none' && (
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadCSV(msg.response!)}>
                    <Download className="h-3 w-3 mr-1" /> CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigator.clipboard.writeText(msg.response!.sql)}>
                    <Copy className="h-3 w-3 mr-1" /> SQL
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
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
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function SQLViewer({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Hide SQL' : 'Show SQL'}
      </button>
      {open && (
        <pre className="mt-1 p-3 rounded-lg bg-muted text-xs overflow-x-auto font-mono">
          {sql}
        </pre>
      )}
    </div>
  )
}
