'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box, TextField, IconButton, Typography, Paper, Card,
  CircularProgress, Chip, Grid,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import { sendChat } from '@/lib/api'
import type { ChatMessage, ChatResponse } from '@/lib/types'
import Chart from '@/components/shared/Chart'

interface Message {
  role: 'user' | 'assistant'
  content: string
  response?: ChatResponse
}

const EXAMPLES = [
  'What is the overall churn rate?',
  'Show churn rate by state',
  'Top 10 customers by total charges',
  'Compare intl plan holders vs non-holders',
  'Show me a pie chart of churn',
  'Average monthly bill in California',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async (question?: string) => {
    const q = question || input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history: ChatMessage[] = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.role === 'user' ? m.content : (m.response?.explanation || m.content),
      }))

      const res = await sendChat({ question: q, conversation_history: history })
      const botMsg: Message = {
        role: 'assistant',
        content: res.explanation || res.error,
        response: res,
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = (res: ChatResponse) => {
    const header = res.columns.join(',')
    const rows = res.data.map(r => r.join(',')).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'results.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ color: 'text.primary' }}>💬 Ask Your CRM Data</Typography>
        <Typography variant="body2">Type a question in plain English and get answers with charts and tables.</Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, pr: 1 }}>
        {messages.length === 0 && (
          <Paper sx={{ p: 3, bgcolor: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderLeft: '3px solid #6366F1' }}>
            <Typography sx={{ mb: 2 }}>
              Welcome! I can answer questions about <b>3,333 telecom customers</b> — churn rates, billing, service calls, and more.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {EXAMPLES.map(q => (
                <Chip key={q} label={q} onClick={() => handleSend(q)} variant="outlined"
                  sx={{ borderColor: 'rgba(99,102,241,0.3)', color: 'text.secondary', '&:hover': { borderColor: '#6366F1', color: 'text.primary' } }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {messages.map((msg, i) => (
          <Box key={i} sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <Paper sx={{
              p: 2, maxWidth: '85%',
              bgcolor: msg.role === 'user' ? 'rgba(59,130,246,0.08)' : 'rgba(99,102,241,0.05)',
              borderLeft: msg.role === 'user' ? '3px solid #3B82F6' : '3px solid #6366F1',
              border: '1px solid rgba(30,41,59,0.4)',
            }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.65rem' }}>
                {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
              </Typography>
              <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{msg.content}</Typography>

              {/* Metric cards */}
              {msg.response?.success && msg.response.chart_type !== 'none' && msg.response.data.length === 1 && (
                <Grid container spacing={1} sx={{ mt: 1 }}>
                  {msg.response.columns.map((col, ci) => {
                    const val = msg.response!.data[0][ci]
                    if (typeof val !== 'number') return null
                    let display = val.toLocaleString()
                    if (col.toLowerCase().includes('rate') || col.toLowerCase().includes('pct')) display = `${val.toFixed(1)}%`
                    if (col.toLowerCase().includes('charge') || col.toLowerCase().includes('bill')) display = `$${val.toFixed(2)}`
                    return (
                      <Grid item xs={6} sm={3} key={col}>
                        <Card sx={{ p: 1.5, textAlign: 'center' }}>
                          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700 }}>{display}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.6rem' }}>
                            {col.replace(/_/g, ' ')}
                          </Typography>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              )}

              {/* Chart */}
              {msg.response?.success && msg.response.chart_type !== 'none' && msg.response.chart_type !== 'table' && msg.response.chart_type !== 'metric' && msg.response.data.length > 1 && (
                <Box sx={{ mt: 2 }}>
                  <Chart chart={{
                    id: `chat-${i}`,
                    title: msg.response.chart_config?.title || '',
                    chart_type: msg.response.chart_type,
                    columns: msg.response.columns,
                    data: msg.response.data,
                    chart_config: msg.response.chart_config,
                  }} height={350} />
                </Box>
              )}

              {/* Table */}
              {msg.response?.success && msg.response.chart_type !== 'none' && msg.response.data.length > 1 && (
                <Box sx={{ mt: 2, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        {msg.response.columns.map(c => (
                          <th key={c} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(30,41,59,0.5)', color: '#94A3B8', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.response.data.slice(0, 20).map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell: any, ci: number) => (
                            <td key={ci} style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,41,59,0.3)', color: '#CBD5E1' }}>
                              {typeof cell === 'number' ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}

              {/* Download */}
              {msg.response?.success && msg.response.chart_type !== 'none' && msg.response.data.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Chip icon={<DownloadIcon />} label="Download CSV" onClick={() => downloadCSV(msg.response!)} size="small" variant="outlined"
                    sx={{ borderColor: 'rgba(16,185,129,0.3)', color: '#10B981', '&:hover': { borderColor: '#10B981' } }}
                  />
                </Box>
              )}
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2 }}>
            <CircularProgress size={20} sx={{ color: '#6366F1' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Thinking...</Typography>
          </Box>
        )}
        <div ref={endRef} />
      </Box>

      {/* Input */}
      <Paper sx={{ p: 1.5, display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#0C1120', border: '1px solid rgba(30,41,59,0.5)' }}>
        <TextField
          fullWidth size="small" placeholder="Ask a question about your CRM data..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              '& fieldset': { borderColor: 'rgba(51,65,85,0.5)' },
              '&:hover fieldset': { borderColor: '#6366F1' },
              '&.Mui-focused fieldset': { borderColor: '#6366F1' },
            },
          }}
        />
        <IconButton onClick={() => handleSend()} disabled={!input.trim() || loading}
          sx={{ bgcolor: '#6366F1', color: '#fff', '&:hover': { bgcolor: '#4F46E5' }, '&.Mui-disabled': { bgcolor: 'rgba(99,102,241,0.3)' } }}
        >
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  )
}
