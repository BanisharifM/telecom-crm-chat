'use client'

import { useState } from 'react'
import { Search, User, Phone, Globe, Shield, AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CustomerRecord {
  customer_id: number
  State: string
  'Account length': number
  'Area code': number
  'International plan': string
  'Voice mail plan': string
  'Number vmail messages': number
  'Total day minutes': number
  'Total day calls': number
  'Total day charge': number
  'Total eve minutes': number
  'Total eve calls': number
  'Total eve charge': number
  'Total night minutes': number
  'Total night calls': number
  'Total night charge': number
  'Total intl minutes': number
  'Total intl calls': number
  'Total intl charge': number
  'Customer service calls': number
  Churn: boolean
}

function calculateHealthScore(c: CustomerRecord): { score: number; label: string; color: string; factors: string[] } {
  let score = 100
  const factors: string[] = []

  if (c['Customer service calls'] >= 4) {
    score -= 30; factors.push(`${c['Customer service calls']} service calls (high risk - 3x churn rate)`)
  } else if (c['Customer service calls'] >= 2) {
    score -= 10; factors.push(`${c['Customer service calls']} service calls`)
  }

  if (c['International plan'] === 'Yes') {
    score -= 20; factors.push('International plan holder (42% churn rate vs 11%)')
  }

  const totalCharge = c['Total day charge'] + c['Total eve charge'] + c['Total night charge'] + c['Total intl charge']
  if (totalCharge > 70) {
    score -= 15; factors.push(`High total charges ($${totalCharge.toFixed(2)})`)
  }

  if (c['Account length'] < 30) {
    score -= 10; factors.push('New customer (< 30 days)')
  }

  if (c['Voice mail plan'] === 'No') {
    score -= 5; factors.push('No voicemail plan')
  }

  if (c.Churn) {
    score -= 30; factors.push('Customer has already churned')
  }

  score = Math.max(0, Math.min(100, score))

  let label: string, color: string
  if (score >= 70) { label = 'Healthy'; color = 'text-green-500' }
  else if (score >= 40) { label = 'At Risk'; color = 'text-yellow-500' }
  else { label = 'Critical'; color = 'text-red-500' }

  return { score, label, color, factors }
}

export default function CustomerPage() {
  const [searchId, setSearchId] = useState('')
  const [records, setRecords] = useState<CustomerRecord[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    const id = parseInt(searchId)
    if (isNaN(id) || id < 0) { setError('Enter a valid customer ID (0-2665)'); return }
    setLoading(true)
    setError('')
    setRecords([])
    setSelectedIdx(0)
    try {
      const res = await fetch(`/api/query/explorer/customer/${id}`)
      const data = await res.json()
      if (data.found && data.records.length > 0) {
        setRecords(data.records)
      } else {
        setError(`Customer ${id} not found`)
      }
    } catch {
      setError('Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }

  const customer = records[selectedIdx] || null
  const health = customer ? calculateHealthScore(customer) : null
  const totalCharge = customer
    ? customer['Total day charge'] + customer['Total eve charge'] + customer['Total night charge'] + customer['Total intl charge']
    : 0

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Customer 360</h1>
        <p className="text-sm text-muted-foreground">Complete view of a single customer's profile, usage, and risk.</p>
      </div>

      {/* Search */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Enter customer ID (0-2665)..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? 'Loading...' : 'Search'}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-24" /></Card>
          ))}
        </div>
      )}

      {/* Duplicate records selector */}
      {records.length > 1 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
          <Info className="h-4 w-4 text-yellow-500 shrink-0" />
          <p className="text-sm text-muted-foreground">
            This customer ID has <strong>{records.length} records</strong> (different states in dataset).
          </p>
          <div className="flex gap-1 ml-auto">
            {records.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  selectedIdx === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {r.State}
              </button>
            ))}
          </div>
        </div>
      )}

      {customer && health && (
        <>
          {/* Identity Header */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className={cn(
                'h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0',
                customer.Churn ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
              )}>
                <User className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">Customer #{customer.customer_id}</h2>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-medium',
                    customer.Churn ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  )}>
                    {customer.Churn ? 'Churned' : 'Active'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {customer.State} - Area Code {customer['Area code']} - Tenure: {customer['Account length']} days
                </p>
              </div>

              {/* Health Score */}
              <div className="text-center shrink-0">
                <div className={cn('text-3xl font-bold', health.color)}>{health.score}</div>
                <div className={cn('text-xs font-medium', health.color)}>{health.label}</div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Plans */}
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Plans
              </h3>
              <div className="space-y-2">
                <PlanRow label="International Plan" value={customer['International plan']} />
                <PlanRow label="Voice Mail Plan" value={customer['Voice mail plan']} />
                <div className="text-sm">
                  <span className="text-muted-foreground">Voicemail Messages:</span>
                  <span className="ml-2 font-medium">{customer['Number vmail messages']}</span>
                </div>
              </div>
            </Card>

            {/* Usage */}
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Usage
              </h3>
              <div className="space-y-1.5 text-sm">
                <UsageRow label="Day" minutes={customer['Total day minutes']} calls={customer['Total day calls']} charge={customer['Total day charge']} />
                <UsageRow label="Evening" minutes={customer['Total eve minutes']} calls={customer['Total eve calls']} charge={customer['Total eve charge']} />
                <UsageRow label="Night" minutes={customer['Total night minutes']} calls={customer['Total night calls']} charge={customer['Total night charge']} />
                <UsageRow label="Intl" minutes={customer['Total intl minutes']} calls={customer['Total intl calls']} charge={customer['Total intl charge']} />
              </div>
            </Card>

            {/* Financial */}
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Financial
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-2xl font-bold">${totalCharge.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Total Charges</div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Service Calls:</span>
                  <span className={cn('ml-2 font-bold', customer['Customer service calls'] >= 4 ? 'text-red-500' : '')}>
                    {customer['Customer service calls']}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Risk Factors */}
          {health.factors.length > 0 && (
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Risk Factors
              </h3>
              <div className="space-y-1.5">
                {health.factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                      health.score >= 70 ? 'bg-green-500' : health.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    )} />
                    {f}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {!customer && !loading && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Search for a customer by ID to see their full profile</p>
          <p className="text-xs mt-1">Customer IDs range from 0 to 2665</p>
        </div>
      )}
    </div>
  )
}

function PlanRow({ label, value }: { label: string; value: string }) {
  const isYes = value === 'Yes'
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1 font-medium', isYes ? 'text-primary' : 'text-muted-foreground')}>
        {isYes ? <CheckCircle className="h-3.5 w-3.5" /> : <span className="text-xs">No</span>}
        {value}
      </span>
    </div>
  )
}

function UsageRow({ label, minutes, calls, charge }: { label: string; minutes: number; calls: number; charge: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground w-16">{label}</span>
      <span>{minutes.toFixed(0)} min</span>
      <span className="text-muted-foreground">{calls} calls</span>
      <span className="font-medium">${charge.toFixed(2)}</span>
    </div>
  )
}
