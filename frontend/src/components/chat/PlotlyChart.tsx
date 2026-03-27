'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Brand colors from Fig1.png
const COLORS = ['#0AA4B0', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#F97316']

// Detect dark mode by observing the <html> class
function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

interface Props {
  chartType: string
  columns: string[]
  data: any[][]
  config: Record<string, any>
  height?: number
}

function PlotlyChartInner({ chartType, columns, data, config, height = 350 }: Props) {
  const createPlotlyComponent = require('react-plotly.js/factory').default
  const Plotly = require('plotly.js-basic-dist-min')
  const Plot = createPlotlyComponent(Plotly)
  const isDark = useDarkMode()

  const x = config.x || columns[0]
  const y = config.y || columns[1]
  const xIdx = Math.max(0, columns.indexOf(x))
  const yIdx = columns.indexOf(y) >= 0 ? columns.indexOf(y) : Math.min(1, columns.length - 1)
  const xData = data.map(r => r[xIdx])
  const yData = data.map(r => r[yIdx])

  // Theme-aware colors
  const textColor = isDark ? '#E2E8F0' : '#1E293B'
  const mutedColor = isDark ? '#94A3B8' : '#64748B'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const lineColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'

  // Calculate top margin based on whether we show text outside bars
  const showBarText = chartType === 'bar' && data.length <= 20
  const topMargin = config.title ? 50 : (showBarText ? 40 : 15)

  const layout: any = {
    title: config.title ? {
      text: config.title,
      font: { size: 14, color: textColor },
      x: 0,
      pad: { l: 0 },
    } : undefined,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: {
      family: 'Inter, system-ui, sans-serif',
      size: 12,
      color: mutedColor,
    },
    margin: { l: 55, r: 20, t: topMargin, b: 55 },
    height,
    colorway: COLORS,
    bargap: 0.25,
    hovermode: 'x unified' as const,
    showlegend: false,
    xaxis: {
      showgrid: false,
      automargin: true,
      linecolor: lineColor,
      tickfont: { color: mutedColor, size: 11 },
      title: { font: { color: mutedColor } },
    },
    yaxis: {
      showgrid: true,
      gridcolor: gridColor,
      gridwidth: 1,
      automargin: true,
      linecolor: lineColor,
      tickfont: { color: mutedColor, size: 11 },
      title: { font: { color: mutedColor } },
      zerolinecolor: lineColor,
    },
    hoverlabel: {
      bgcolor: isDark ? '#1E293B' : '#FFFFFF',
      bordercolor: isDark ? '#334155' : '#E2E8F0',
      font: { color: textColor },
    },
  }

  let plotData: any[]

  if (chartType === 'pie') {
    plotData = [{
      type: 'pie',
      labels: xData,
      values: yData,
      hole: 0.4,
      marker: { colors: COLORS, line: { color: isDark ? '#0F172A' : '#FFFFFF', width: 2 } },
      textinfo: 'percent+label',
      textfont: { color: textColor, size: 12 },
      outsidetextfont: { color: mutedColor },
      insidetextfont: { color: '#FFFFFF' },
    }]
  } else if (chartType === 'line') {
    plotData = [{
      type: 'scatter',
      mode: 'lines+markers',
      x: xData,
      y: yData,
      line: { width: 2.5, color: COLORS[0] },
      marker: { size: 6, color: COLORS[0] },
    }]
  } else if (chartType === 'scatter') {
    plotData = [{
      type: 'scatter',
      mode: 'markers',
      x: xData,
      y: yData,
      marker: { size: 8, color: COLORS[0] },
    }]
  } else {
    // Bar chart
    plotData = [{
      type: 'bar',
      x: xData,
      y: yData,
      marker: { color: COLORS[0] },
      textposition: showBarText ? 'outside' as const : 'none' as const,
      texttemplate: showBarText ? '%{y:.1f}' : undefined,
      textfont: { color: mutedColor, size: 11 },
      outsidetextfont: { color: mutedColor, size: 11 },
      cliponaxis: false,  // Prevents text clipping at top
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

export const PlotlyChart = dynamic(
  () => Promise.resolve(PlotlyChartInner),
  {
    ssr: false,
    loading: () => <div className="h-80 animate-pulse rounded-lg bg-muted" />,
  }
)
