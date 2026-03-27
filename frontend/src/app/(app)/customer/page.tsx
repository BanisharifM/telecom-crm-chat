'use client'

import { useState } from 'react'
import { Search, User, Phone, Globe, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
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

interface HealthScore {
  score: number
  label: string
  color: string
  factors: string[]
}

export default function CustomerPage() {
  const [searchId, setSearchId] = useState('')
  const [customer, setCustomer] = useState<CustomerRecord | null>(null)
  const [health, setHealth] = useState<HealthScore | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    const id = parseInt(searchId)
    if (isNaN(id) || id < 0) { setError('Enter a valid customer ID (0-3332)'); return }
    setLoading(true)
    setError('')
    setCustomer(null)
    setHealth(null)
    try {
      const res = await fetch(`/api/query/explorer/customer/${id}`)
      const data = await res.json()
      if (data.found) {
        setCustomer(data.record)
        setHealth(data.health)
      } else {
        setError(`Customer ${id} not found`)
      }
    } catch {
      setError('Failed to load customer data')
    } finally {
      setLoading(false)
    }
  }

  const totalCharge = customer
    ? customer['Total day charge'] + customer['Total eve charge'] + customer['Total night charge'] + customer['Total intl charge']
    : 0

  const healthColor = health?.color === 'green' ? 'text-green-500'
    : health?.color === 'yellow' ? 'text-yellow-500'
    : health?.color === 'red' ? 'text-red-500' : ''

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
            placeholder="Enter customer ID (0-3332)..."
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

              {/* Health Score (from backend) */}
              <div className="text-center shrink-0">
                <div className={cn('text-3xl font-bold', healthColor)}>{health.score}</div>
                <div className={cn('text-xs font-medium', healthColor)}>{health.label}</div>
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

          {/* Risk Factors (from backend) */}
          {health.factors.length > 0 && (
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Risk Factors
              </h3>
              <div className="space-y-1.5">
                {health.factors.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                      health.color === 'green' ? 'bg-green-500' : health.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
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
          <p className="text-xs mt-1">Customer IDs range from 0 to 3332</p>
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
