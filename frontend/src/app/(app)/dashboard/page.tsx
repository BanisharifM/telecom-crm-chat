'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, Users, UserMinus, MapPin, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getKPIs, getInsights, getCharts } from '@/lib/api'
import type { KPIData, ChartData } from '@/lib/types'
import { PlotlyChart } from '@/components/chat/PlotlyChart'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [charts, setCharts] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getKPIs().then(setKpis),
      getInsights().then(d => setInsights(d.insights)),
      getCharts().then(d => setCharts(d.charts)),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">At-a-glance overview of your telecom customer data.</p>
      </div>

      {/* KPI Row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-12" /></Card>
          ))}
        </div>
      ) : kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPICard icon={Users} label="Total Customers" value={kpis.total_customers.toLocaleString()} />
          <KPICard icon={UserMinus} label="Churned" value={kpis.total_churned.toLocaleString()} color="text-danger" />
          <KPICard icon={TrendingDown} label="Churn Rate" value={`${kpis.churn_rate}%`} color="text-danger" />
          <KPICard icon={MapPin} label="States" value={kpis.num_states.toString()} />
          <KPICard icon={Clock} label="Avg Tenure" value={`${kpis.avg_account_length} days`} />
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Key Insights</h2>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 border-l-[3px] border-l-primary text-sm">
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-80" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charts.map(chart => (
            <Card key={chart.id}>
              <CardContent className="p-2">
                <PlotlyChart
                  chartType={chart.chart_type}
                  columns={chart.columns}
                  data={chart.data}
                  config={chart.chart_config}
                  height={320}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function KPICard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string; color?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className={`text-xl font-bold tracking-tight ${color || ''}`}>{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
        </div>
      </div>
    </Card>
  )
}
