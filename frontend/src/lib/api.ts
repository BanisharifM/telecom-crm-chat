import type { ChatResponse, KPIData, ChartData, FilterOptions, ExplorerData } from './types'

// In production (Docker), Caddy routes /api/query/* to FastAPI
// In dev, Next.js rewrites /api/query/* to localhost:8000
const QUERY_API = '/api/query'

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${QUERY_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

// Chat
export async function sendChat(question: string, history: { role: string; content: string }[]): Promise<ChatResponse> {
  return fetchAPI<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ question, conversation_history: history }),
  })
}

// Dashboard
export async function getKPIs(): Promise<KPIData> {
  return fetchAPI<KPIData>('/dashboard/kpis')
}

export async function getInsights(): Promise<{ insights: string[] }> {
  return fetchAPI<{ insights: string[] }>('/dashboard/insights')
}

export async function getCharts(): Promise<{ charts: ChartData[] }> {
  return fetchAPI<{ charts: ChartData[] }>('/dashboard/charts')
}

// Explorer
export async function getFilters(): Promise<FilterOptions> {
  return fetchAPI<FilterOptions>('/explorer/filters')
}

export async function getExplorerData(params: Record<string, string>): Promise<ExplorerData> {
  const qs = new URLSearchParams(params).toString()
  return fetchAPI<ExplorerData>(`/explorer/data?${qs}`)
}
