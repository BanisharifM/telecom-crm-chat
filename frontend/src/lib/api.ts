import type { ChatRequest, ChatResponse, KPIData, ChartData, FilterOptions, ExplorerData } from './types'

// In production, use relative URLs (Caddy proxies /api/* to backend)
// In dev, use NEXT_PUBLIC_API_URL env var
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? ''  // relative URL in production — Caddy handles routing
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  return fetchAPI<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function getKPIs(): Promise<KPIData> {
  return fetchAPI<KPIData>('/api/dashboard/kpis')
}

export async function getInsights(): Promise<{ insights: string[] }> {
  return fetchAPI<{ insights: string[] }>('/api/dashboard/insights')
}

export async function getCharts(): Promise<{ charts: ChartData[] }> {
  return fetchAPI<{ charts: ChartData[] }>('/api/dashboard/charts')
}

export async function getFilters(): Promise<FilterOptions> {
  return fetchAPI<FilterOptions>('/api/explorer/filters')
}

export async function getExplorerData(params: Record<string, string>): Promise<ExplorerData> {
  const qs = new URLSearchParams(params).toString()
  return fetchAPI<ExplorerData>(`/api/explorer/data?${qs}`)
}
