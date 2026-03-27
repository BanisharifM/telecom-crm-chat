'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getFilters, getExplorerData } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import type { FilterOptions, ExplorerData } from '@/lib/types'

export default function ExplorerPage() {
  const [filters, setFilters] = useState<FilterOptions | null>(null)
  const [data, setData] = useState<ExplorerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState('All')
  const [intl, setIntl] = useState('All')
  const [vm, setVm] = useState('All')
  const [churn, setChurn] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => { getFilters().then(setFilters) }, [])

  const fetchData = useCallback(() => {
    setLoading(true)
    getExplorerData({
      state, international_plan: intl, voice_mail_plan: vm, churn,
      page: page.toString(), page_size: '50',
    }).then(setData).finally(() => setLoading(false))
  }, [state, intl, vm, churn, page])

  useEffect(() => { fetchData() }, [fetchData])

  const downloadCSV = () => {
    const params = new URLSearchParams({ state, international_plan: intl, voice_mail_plan: vm, churn })
    window.open(`/api/query/explorer/download?${params}`, '_blank')
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Data Explorer</h1>
          <p className="text-sm text-muted-foreground">Browse and filter the raw CRM dataset.</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Download
        </Button>
      </div>

      {/* Filters */}
      {filters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterSelect label="State" value={state} onChange={v => { setState(v); setPage(1) }}
            options={[{ value: 'All', label: 'All States' }, ...filters.states.map(s => ({ value: s, label: s }))]} />
          <FilterSelect label="International Plan" value={intl} onChange={v => { setIntl(v); setPage(1) }}
            options={[{ value: 'All', label: 'All' }, { value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} />
          <FilterSelect label="Voice Mail" value={vm} onChange={v => { setVm(v); setPage(1) }}
            options={[{ value: 'All', label: 'All' }, { value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} />
          <FilterSelect label="Churn Status" value={churn} onChange={v => { setChurn(v); setPage(1) }}
            options={[{ value: 'All', label: 'All' }, { value: 'Churned', label: 'Churned' }, { value: 'Active', label: 'Active' }]} />
        </div>
      )}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <div className="text-lg font-bold">{data.filtered_rows.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Filtered</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold text-danger">{data.churned.toLocaleString()}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Churned</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-lg font-bold">{data.churn_rate}%</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Churn Rate</div>
          </Card>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Card className="p-4"><Skeleton className="h-96" /></Card>
      ) : data && data.data.length > 0 && (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                {data.columns.map(c => (
                  <th key={c} className="px-3 py-2.5 text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, ri) => (
                <tr key={ri} className="border-t border-border hover:bg-muted/30 transition-colors">
                  {row.map((cell: any, ci: number) => (
                    <td key={ci} className="px-3 py-2 whitespace-nowrap">
                      {typeof cell === 'boolean' ? (cell ? 'Yes' : 'No') :
                       typeof cell === 'number' ? formatNumber(cell, data.columns[ci]) :
                       String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" disabled={!data || data.data.length < 50} onClick={() => setPage(p => p + 1)}>
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
        {data && <span className="text-xs text-muted-foreground">{data.filtered_rows} total rows</span>}
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
