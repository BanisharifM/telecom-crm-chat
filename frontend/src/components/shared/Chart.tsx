'use client'

import dynamic from 'next/dynamic'
import type { ChartData } from '@/lib/types'

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as any

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#06B6D4', '#F97316', '#EC4899']

interface Props {
  chart: ChartData
  height?: number
}

export default function Chart({ chart, height = 400 }: Props) {
  const { chart_type, columns, data, chart_config, title } = chart
  const x = chart_config.x || columns[0]
  const y = chart_config.y || columns[1]

  const xIdx = columns.indexOf(x)
  const yIdx = columns.indexOf(y)
  const xData = data.map(row => row[xIdx >= 0 ? xIdx : 0])
  const yData = data.map(row => row[yIdx >= 0 ? yIdx : Math.min(1, row.length - 1)])

  let plotData: any[]
  const layout: any = {
    title: { text: title, font: { size: 16, color: '#F1F5F9' }, x: 0 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, sans-serif', color: '#94A3B8' },
    margin: { l: 50, r: 20, t: 50, b: 50 },
    height,
    xaxis: { showgrid: false, linecolor: '#334155', tickfont: { color: '#94A3B8', size: 11 } },
    yaxis: { gridcolor: 'rgba(255,255,255,0.06)', showline: false, tickfont: { color: '#94A3B8', size: 11 } },
    colorway: COLORS,
    bargap: 0.25,
    hovermode: 'x unified' as const,
    hoverlabel: { bgcolor: '#1E293B', bordercolor: '#334155', font: { color: '#F1F5F9' } },
    showlegend: false,
  }

  if (chart_type === 'pie') {
    plotData = [{
      type: 'pie' as const,
      labels: xData,
      values: yData,
      hole: 0.4,
      marker: { colors: COLORS, line: { color: '#070B14', width: 2 } },
      textinfo: 'percent+label',
    }]
  } else if (chart_type === 'line') {
    plotData = [{
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      x: xData,
      y: yData,
      line: { width: 2.5, color: COLORS[0] },
      marker: { size: 7 },
    }]
  } else if (chart_type === 'scatter') {
    plotData = [{
      type: 'scatter' as const,
      mode: 'markers' as const,
      x: xData,
      y: yData,
      marker: { size: 8, color: COLORS[0] },
    }]
  } else {
    plotData = [{
      type: 'bar' as const,
      x: xData,
      y: yData,
      marker: { color: COLORS[0] },
      textposition: data.length <= 20 ? 'outside' as const : 'none' as const,
      texttemplate: data.length <= 20 ? '%{y:.1f}' : undefined,
    }]
  }

  return (
    <Plot
      data={plotData}
      layout={layout}
      config={{ responsive: true, displayModeBar: true, displaylogo: false }}
      style={{ width: '100%' }}
    />
  )
}
