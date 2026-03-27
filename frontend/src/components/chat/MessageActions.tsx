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
    // TODO: persist feedback to API when feedback table is added
  }

  return (
    <div className="flex items-center gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Copy message"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
      </button>

      {/* Feedback - only on assistant messages */}
      {role === 'assistant' && (
        <>
          <button
            onClick={() => handleFeedback('up')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              feedback === 'up'
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-label="Good response"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleFeedback('down')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              feedback === 'down'
                ? 'text-destructive bg-destructive/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            aria-label="Bad response"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  )
}
