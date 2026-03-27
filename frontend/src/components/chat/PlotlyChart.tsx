'use client'

import dynamic from 'next/dynamic'

const Plot = dynamic(() => import('react-plotly.js').then((mod) => {
  // Use factory pattern with basic dist for smaller bundle
  const createPlotlyComponent = require('react-plotly.js/factory').default
  const Plotly = require('plotly.js-basic-dist-min')
  return { default: createPlotlyComponent(Plotly) }
}), {
  ssr: false,
  loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted" />,
}) as any

const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#06B6D4', '#F97316', '#EC4899']

interface Props {
  chartType: string
  columns: string[]
  data: any[][]
  config: Record<string, any>
  height?: number
}

export function PlotlyChart({ chartType, columns, data, config, height = 350 }: Props) {
  const x = config.x || columns[0]
  const y = config.y || columns[1]
  const xIdx = Math.max(0, columns.indexOf(x))
  const yIdx = Math.max(0, columns.indexOf(y) === -1 ? Math.min(1, columns.length - 1) : columns.indexOf(y))
  const xData = data.map(r => r[xIdx])
  const yData = data.map(r => r[yIdx])

  const layout: any = {
    title: config.title ? { text: config.title, font: { size: 14 }, x: 0, pad: { l: 0 } } : undefined,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'Inter, system-ui, sans-serif', size: 12 },
    margin: { l: 50, r: 20, t: config.title ? 40 : 10, b: 50 },
    height,
    colorway: COLORS,
    bargap: 0.25,
    hovermode: 'x unified' as const,
    showlegend: false,
    xaxis: { showgrid: false, automargin: true },
    yaxis: { showgrid: true, gridwidth: 1, automargin: true },
  }

  let plotData: any[]

  if (chartType === 'pie') {
    plotData = [{
      type: 'pie', labels: xData, values: yData, hole: 0.4,
      marker: { colors: COLORS, line: { width: 2 } },
      textinfo: 'percent+label',
    }]
    layout.showlegend = false
  } else if (chartType === 'line') {
    plotData = [{
      type: 'scatter', mode: 'lines+markers', x: xData, y: yData,
      line: { width: 2.5, color: COLORS[0] }, marker: { size: 6 },
    }]
  } else if (chartType === 'scatter') {
    plotData = [{
      type: 'scatter', mode: 'markers', x: xData, y: yData,
      marker: { size: 8, color: COLORS[0] },
    }]
  } else {
    plotData = [{
      type: 'bar', x: xData, y: yData,
      marker: { color: COLORS[0] },
      textposition: data.length <= 20 ? 'outside' as const : 'none' as const,
      texttemplate: data.length <= 20 ? '%{y:.1f}' : undefined,
    }]
  }

  return (
    <Plot
      data={plotData}
      layout={layout}
      config={{ responsive: true, displayModeBar: false, displaylogo: false }}
      style={{ width: '100%' }}
      useResizeHandler
    />
  )
}
