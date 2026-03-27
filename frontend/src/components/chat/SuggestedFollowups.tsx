'use client'

import { cn } from '@/lib/utils'

interface Props {
  suggestions: string[]
  onSelect: (question: string) => void
}

/**
 * Follow-up question chips shown below assistant responses.
 * ChatGPT/ThoughtSpot pattern: 2-3 contextual suggestions based on the current answer.
 */
export function SuggestedFollowups({ suggestions, onSelect }: Props) {
  if (!suggestions.length) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map(q => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className={cn(
            'text-xs px-3 py-1.5 rounded-full border transition-colors',
            'border-border text-muted-foreground',
            'hover:border-primary/40 hover:text-foreground hover:bg-primary/5'
          )}
        >
          {q}
        </button>
      ))}
    </div>
  )
}

/**
 * Generate contextual follow-up suggestions based on the assistant's response.
 * Uses simple heuristics based on chart type and content keywords.
 */
export function generateFollowups(
  chartType: string,
  explanation: string,
  sql: string,
): string[] {
  const suggestions: string[] = []
  const lowerExpl = explanation.toLowerCase()
  const lowerSql = sql.toLowerCase()

  // Chart type based suggestions
  if (chartType === 'bar' || chartType === 'table') {
    if (!lowerSql.includes('pie')) suggestions.push('Show as pie chart')
  }
  if (chartType === 'pie') {
    suggestions.push('Show as bar chart')
  }

  // Content based suggestions
  if (lowerExpl.includes('churn') && !lowerExpl.includes('service call')) {
    suggestions.push('How do service calls affect churn?')
  }
  if (lowerExpl.includes('state') && !lowerExpl.includes('international plan')) {
    suggestions.push('Compare by international plan')
  }
  if (lowerExpl.includes('international plan') && !lowerExpl.includes('state')) {
    suggestions.push('Break down by state')
  }
  if (lowerExpl.includes('churn') && !lowerExpl.includes('revenue') && !lowerExpl.includes('charge')) {
    suggestions.push('What is the revenue impact?')
  }
  if (lowerSql.includes('limit') && !lowerSql.includes('limit 5')) {
    suggestions.push('Show top 5 only')
  }
  if (lowerExpl.includes('customer') && !lowerExpl.includes('who')) {
    suggestions.push('Who are the at-risk customers?')
  }

  // Limit to 3 suggestions max
  return suggestions.slice(0, 3)
}
