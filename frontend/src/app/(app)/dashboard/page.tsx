'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, Users, UserMinus, MapPin, Clock, Lightbulb } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getKPIs, getInsights, getCharts } from '@/lib/api'
import type { KPIData, ChartData } from '@/lib/types'
import { PlotlyChart } from '@/components/chat/PlotlyChart'
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

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
            <Card key={i} className="p-5"><Skeleton className="h-16" /></Card>
          ))}
        </div>
      ) : kpis && (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <KPICard icon={Users} label="Total Customers" format="number" value={kpis.total_customers} />
          </motion.div>
          <motion.div variants={item}>
            <KPICard icon={UserMinus} label="Churned" format="number" value={kpis.total_churned} color="text-danger" />
          </motion.div>
          <motion.div variants={item}>
            <KPICard icon={TrendingDown} label="Churn Rate" format="percent" value={kpis.churn_rate} color="text-danger" />
          </motion.div>
          <motion.div variants={item}>
            <KPICard icon={MapPin} label="States" format="number" value={kpis.num_states} />
          </motion.div>
          <motion.div variants={item}>
            <KPICard icon={Clock} label="Avg Tenure" format="decimal" value={kpis.avg_account_length} suffix=" days" />
          </motion.div>
        </motion.div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Key Insights</h2>
          </div>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-3 border-l-[3px] border-l-primary text-sm text-card-foreground">
                {ins}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-80" /></Card>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {charts.map(chart => (
            <motion.div key={chart.id} variants={item}>
              <Card className="overflow-hidden">
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}

function KPICard({ icon: Icon, label, value, format, color, suffix }: {
  icon: any; label: string; value: number; format: 'number' | 'percent' | 'decimal' | 'currency';
  color?: string; suffix?: string
}) {
  return (
    <Card className="p-4 sm:p-5 group hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/15 transition-colors shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className={`text-xl sm:text-2xl font-bold tracking-tight ${color || ''}`}>
            <AnimatedCounter value={value} format={format} />
            {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </div>
          <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-medium mt-0.5">
            {label}
          </div>
        </div>
      </div>
    </Card>
  )
}
