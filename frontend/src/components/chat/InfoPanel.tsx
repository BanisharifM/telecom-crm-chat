'use client'

import { useState } from 'react'
import { X, BarChart3, FileDown, Code2, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MessageData {
  id: string
  content: string
  sqlQuery?: string | null
  chartType?: string | null
  chartConfig?: Record<string, any> | null
  dataColumns?: string[] | null
  dataRows?: any[][] | null
  createdAt?: string
}

interface Props {
  open: boolean
  onClose: () => void
  messages: MessageData[]
}

type Tab = 'charts' | 'files' | 'queries'

export function InfoPanel({ open, onClose, messages }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('charts')

  // Extract items from ALL messages (not just current render)
  const charts = messages.filter(m =>
    m.chartType && !['none', 'table', 'metric'].includes(m.chartType) &&
    m.dataRows && Array.isArray(m.dataRows) && m.dataRows.length > 1
  )

  const files = messages.filter(m =>
    m.dataRows && Array.isArray(m.dataRows) && m.dataRows.length > 0 &&
    m.dataColumns && Array.isArray(m.dataColumns) && m.dataColumns.length > 0 &&
    m.chartType !== 'none'
  )

  const queries = messages.filter(m =>
    m.sqlQuery && typeof m.sqlQuery === 'string' && m.sqlQuery !== 'SELECT 1' && m.sqlQuery.trim().length > 0
  )

  const tabs: { key: Tab; label: string; icon: any; count: number }[] = [
    { key: 'charts', label: 'Charts', icon: BarChart3, count: charts.length },
    { key: 'files', label: 'Files', icon: FileDown, count: files.length },
    { key: 'queries', label: 'Queries', icon: Code2, count: queries.length },
  ]

  const downloadCSV = (msg: MessageData) => {
    if (!msg.dataColumns || !msg.dataRows) return
    const header = msg.dataColumns.join(',')
    const rows = msg.dataRows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    // Meaningful filename from chart title or content
    const name = msg.chartConfig?.title
      || msg.content?.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')
      || 'data'
    a.href = url
    a.download = `${name}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <>
      {/* Mobile overlay */}
      <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} />

      {/* Panel */}
      <div className={cn(
        'fixed right-0 top-0 bottom-0 z-40 w-80 bg-card border-l border-border shadow-xl',
        'flex flex-col animate-slide-in-right',
        'md:relative md:z-0 md:shadow-none md:w-80 md:shrink-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold">Conversation Details</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'charts' && (
            <div className="space-y-3">
              {charts.length === 0 ? (
                <EmptyState icon={BarChart3} text="No charts in this conversation yet" />
              ) : (
                charts.map(msg => (
                  <div key={msg.id} className="rounded-lg border border-border bg-background p-3">
                    <div className="text-xs font-medium mb-1 truncate">
                      {msg.chartConfig?.title || `${msg.chartType} chart`}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {msg.chartType} - {msg.dataRows?.length} data points
                    </div>
                    {msg.createdAt && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    )}
                    <div className="mt-2">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] w-full" onClick={() => downloadCSV(msg)}>
                        <Download className="h-3 w-3 mr-1" /> Download Data
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              {files.length === 0 ? (
                <EmptyState icon={FileDown} text="No downloadable files yet" />
              ) : (
                files.map(msg => (
                  <div key={msg.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {msg.chartConfig?.title || msg.content?.substring(0, 40) || 'Query result'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {msg.dataColumns?.length} cols, {msg.dataRows?.length} rows
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-primary"
                      onClick={() => downloadCSV(msg)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'queries' && (
            <div className="space-y-2">
              {queries.length === 0 ? (
                <EmptyState icon={Code2} text="No SQL queries generated yet" />
              ) : (
                queries.map(msg => (
                  <QueryItem key={msg.id} sql={msg.sqlQuery!} createdAt={msg.createdAt} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function QueryItem({ sql, createdAt }: { sql: string; createdAt?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
        {sql}
      </pre>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">
          {createdAt && new Date(createdAt).toLocaleTimeString()}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px]"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30 mb-3" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  )
}
