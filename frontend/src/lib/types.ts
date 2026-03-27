// ========== Auth ==========
export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

// ========== Conversations ==========
export interface Conversation {
  id: string
  title: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

// ========== Messages ==========
export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sqlQuery?: string | null
  chartType?: string | null
  chartConfig?: Record<string, any> | null
  dataColumns?: string[] | null
  dataRows?: any[][] | null
  queryTimeMs?: number | null
  rowsReturned?: number | null
  createdAt: string
}

// ========== Chat API ==========
export interface ChatRequest {
  question: string
  conversationId: string
  conversationHistory: { role: string; content: string }[]
}

export interface ChatResponse {
  success: boolean
  question: string
  sql: string
  explanation: string
  columns: string[]
  data: any[][]
  chart_type: string
  chart_config: Record<string, any>
  error: string
  query_time_ms: number
  rows_returned: number
}

// ========== Dashboard ==========
export interface KPIData {
  total_customers: number
  total_churned: number
  churn_rate: number
  num_states: number
  avg_account_length: number
}

export interface ChartData {
  id: string
  title: string
  chart_type: string
  columns: string[]
  data: any[][]
  chart_config: Record<string, any>
}

// ========== Explorer ==========
export interface FilterOptions {
  states: string[]
  international_plans: string[]
  voice_mail_plans: string[]
  churn_statuses: string[]
}

export interface ExplorerData {
  columns: string[]
  data: any[][]
  total_rows: number
  filtered_rows: number
  churned: number
  churn_rate: number
}
