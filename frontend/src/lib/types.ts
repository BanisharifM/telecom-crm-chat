// TypeScript types matching backend Pydantic schemas

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  question: string
  conversation_history: ChatMessage[]
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
