'use client'

import { useState } from 'react'
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  content: string
  messageId: string
  role: 'user' | 'assistant'
}

export function MessageActions({ content, messageId, role }: Props) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = async (rating: 'up' | 'down') => {
    const newRating = feedback === rating ? null : rating
    setFeedback(newRating)
  }

  // Only show on assistant messages (Claude pattern)
  if (role !== 'assistant') return null

  return (
    <div className="flex items-center gap-1 mt-1.5 ml-1">
      <ActionButton
        onClick={handleCopy}
        active={copied}
        activeColor="text-primary"
        label="Copy message"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </ActionButton>

      <ActionButton
        onClick={() => handleFeedback('up')}
        active={feedback === 'up'}
        activeColor="text-primary"
        label="Good response"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </ActionButton>

      <ActionButton
        onClick={() => handleFeedback('down')}
        active={feedback === 'down'}
        activeColor="text-destructive"
        label="Bad response"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </ActionButton>
    </div>
  )
}

function ActionButton({ children, onClick, active, activeColor, label }: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  activeColor: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        active
          ? `${activeColor} bg-current/10`
          : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50'
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}
