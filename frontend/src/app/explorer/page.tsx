'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, MenuItem, Select, FormControl,
  InputLabel, Button, Paper, SelectChangeEvent,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { getFilters, getExplorerData } from '@/lib/api'
import type { FilterOptions, ExplorerData } from '@/lib/types'

export default function ExplorerPage() {
  const [filters, setFilters] = useState<FilterOptions | null>(null)
  const [data, setData] = useState<ExplorerData | null>(null)
  const [state, setState] = useState('All')
  const [intl, setIntl] = useState('All')
  const [vm, setVm] = useState('All')
  const [churn, setChurn] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => { getFilters().then(setFilters).catch(() => {}) }, [])

  const fetchData = useCallback(() => {
    getExplorerData({
      state, international_plan: intl, voice_mail_plan: vm, churn, page: page.toString(), page_size: '50',
    }).then(setData).catch(() => {})
  }, [state, intl, vm, churn, page])

  useEffect(() => { fetchData() }, [fetchData])

  const downloadCSV = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const params = new URLSearchParams({ state, international_plan: intl, voice_mail_plan: vm, churn })
    window.open(`${API_URL}/api/explorer/download?${params}`, '_blank')
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>🔍 Data Explorer</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>Browse and filter the raw CRM dataset.</Typography>

      {/* Filters */}
      {filters && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>State</InputLabel>
              <Select value={state} label="State" onChange={e => { setState(e.target.value); setPage(1) }}>
                <MenuItem value="All">All States</MenuItem>
                {filters.states.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>International Plan</InputLabel>
              <Select value={intl} label="International Plan" onChange={e => { setIntl(e.target.value); setPage(1) }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Voice Mail</InputLabel>
              <Select value={vm} label="Voice Mail" onChange={e => { setVm(e.target.value); setPage(1) }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Yes">Yes</MenuItem>
                <MenuItem value="No">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Churn Status</InputLabel>
              <Select value={churn} label="Churn Status" onChange={e => { setChurn(e.target.value); setPage(1) }}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Churned">Churned</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {/* Stats */}
      {data && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800 }}>{data.filtered_rows.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.6rem' }}>Filtered Rows</Typography>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: '#EF4444' }}>{data.churned.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.6rem' }}>Churned</Typography>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '1.3rem', fontWeight: 800 }}>{data.churn_rate}%</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.6rem' }}>Churn Rate</Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Table */}
      {data && data.data.length > 0 && (
        <Paper sx={{ overflowX: 'auto', mb: 2, border: '1px solid rgba(30,41,59,0.5)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                {data.columns.map(c => (
                  <th key={c} style={{ padding: '10px 12px', borderBottom: '2px solid rgba(30,41,59,0.5)', color: '#64748B', textAlign: 'left', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(30,41,59,0.3)' }}>
                  {row.map((cell: any, ci: number) => (
                    <td key={ci} style={{ padding: '8px 12px', color: '#CBD5E1', whiteSpace: 'nowrap' }}>
                      {typeof cell === 'boolean' ? (cell ? '✓' : '✗') :
                       typeof cell === 'number' ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 }) :
                       String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      )}

      {/* Pagination + Download */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Typography sx={{ lineHeight: '32px', color: 'text.secondary', fontSize: '0.85rem' }}>Page {page}</Typography>
          <Button variant="outlined" size="small" disabled={!data || data.data.length < 50} onClick={() => setPage(p => p + 1)}>Next</Button>
        </Box>
        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={downloadCSV}
          sx={{ borderColor: 'rgba(16,185,129,0.3)', color: '#10B981', '&:hover': { borderColor: '#10B981' } }}
        >
          Download All
        </Button>
      </Box>
    </Box>
  )
}
