'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const Plot = dynamic(() => {
  return import('react-plotly.js/factory').then(mod => {
    const createPlotlyComponent = mod.default
    const Plotly = require('plotly.js-geo-dist')
    return { default: createPlotlyComponent(Plotly) }
  })
}, {
  ssr: false,
  loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" />,
}) as any

interface StateData {
  state: string
  churn_rate: number
  total_customers: number
  churned: number
}

interface Props {
  data: StateData[]
  height?: number
}

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

export function ChoroplethMap({ data, height = 400 }: Props) {
  const isDark = useDarkMode()

  const textColor = isDark ? '#94A3B8' : '#64748B'

  const trace = {
    type: 'choropleth' as const,
    locationmode: 'USA-states' as const,
    locations: data.map(d => d.state),
    z: data.map(d => d.churn_rate),
    text: data.map(d =>
      `<b>${d.state}</b><br>Churn: ${d.churn_rate}%<br>Customers: ${d.total_customers}<br>Churned: ${d.churned}`
    ),
    hoverinfo: 'text' as const,
    colorscale: [
      [0, '#10B981'],
      [0.3, '#F59E0B'],
      [0.6, '#EF4444'],
      [1, '#991B1B'],
    ],
    colorbar: {
      title: { text: 'Churn %', font: { color: textColor, size: 11 } },
      tickfont: { color: textColor, size: 10 },
      thickness: 15,
      len: 0.6,
    },
    marker: {
      line: { color: isDark ? '#1E293B' : '#FFFFFF', width: 1 },
    },
  }

  const layout = {
    geo: {
      scope: 'usa',
      projection: { type: 'albers usa' },
      showlakes: false,
      bgcolor: 'rgba(0,0,0,0)',
      landcolor: isDark ? '#1E293B' : '#E2E8F0',
      subunitcolor: isDark ? '#334155' : '#CBD5E1',
    },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 10, b: 10, l: 10, r: 10 },
    height,
    font: { color: textColor },
  }

  return (
    <Plot
      data={[trace]}
      layout={layout}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: '100%' }}
      useResizeHandler
    />
  )
}
