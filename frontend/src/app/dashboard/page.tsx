'use client'

import { useState, useEffect } from 'react'
import { Box, Typography, Grid, Card, CardContent, Paper } from '@mui/material'
import { getKPIs, getInsights, getCharts } from '@/lib/api'
import type { KPIData, ChartData } from '@/lib/types'
import Chart from '@/components/shared/Chart'

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [charts, setCharts] = useState<ChartData[]>([])

  useEffect(() => {
    getKPIs().then(setKpis).catch(() => {})
    getInsights().then(d => setInsights(d.insights)).catch(() => {})
    getCharts().then(d => setCharts(d.charts)).catch(() => {})
  }, [])

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>📊 CRM Dashboard</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>At-a-glance overview of your telecom customer data.</Typography>

      {/* KPI Row */}
      {kpis && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <KPICard label="Total Customers" value={kpis.total_customers.toLocaleString()} />
          <KPICard label="Churned" value={kpis.total_churned.toLocaleString()} color="#EF4444" />
          <KPICard label="Churn Rate" value={`${kpis.churn_rate}%`} color="#EF4444" />
          <KPICard label="States Covered" value={kpis.num_states.toString()} />
          <KPICard label="Avg Tenure" value={`${kpis.avg_account_length} days`} />
        </Grid>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1.5 }}>💡 Key Insights</Typography>
          {insights.map((ins, i) => (
            <Paper key={i} sx={{
              p: 2, mb: 1,
              bgcolor: 'rgba(17,24,39,0.8)',
              border: '1px solid rgba(30,41,59,0.5)',
              borderLeft: '3px solid #6366F1',
            }}>
              <Typography variant="body2" sx={{ color: '#CBD5E1' }}>{ins}</Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Charts Grid */}
      <Grid container spacing={2}>
        {charts.map(chart => (
          <Grid item xs={12} md={6} key={chart.id}>
            <Card>
              <CardContent sx={{ p: 1 }}>
                <Chart chart={chart} height={350} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

function KPICard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Grid item xs={6} sm={4} md={2.4}>
      <Card sx={{ textAlign: 'center', p: 2 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: color || 'text.primary', letterSpacing: '-0.03em' }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontSize: '0.65rem' }}>
          {label}
        </Typography>
      </Card>
    </Grid>
  )
}
