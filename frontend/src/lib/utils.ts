import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function relativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatNumber(value: number, column?: string): string {
  const col = (column || '').toLowerCase()
  if (col.includes('charge') || col.includes('cost') || col.includes('bill')) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (col.includes('rate') || col.includes('pct') || col.includes('percent')) {
    return `${value.toFixed(1)}%`
  }
  if (Number.isInteger(value) && value > 999) {
    return value.toLocaleString()
  }
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return String(value)
}
