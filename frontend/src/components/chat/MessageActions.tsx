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

  return (
    <div className={cn(
      'flex items-center gap-0.5 h-0 overflow-visible',
      'opacity-0 group-hover:opacity-100 transition-opacity',
    )}>
      <div className="flex items-center gap-0.5 -mt-1 bg-card/80 backdrop-blur-sm rounded-md border border-border/50 px-0.5 py-0.5">
        <button
          onClick={handleCopy}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Copy message"
        >
          {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
        </button>

        {role === 'assistant' && (
          <>
            <button
              onClick={() => handleFeedback('up')}
              className={cn(
                'p-1 rounded transition-colors',
                feedback === 'up'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label="Good response"
            >
              <ThumbsUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={cn(
                'p-1 rounded transition-colors',
                feedback === 'down'
                  ? 'text-destructive bg-destructive/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              aria-label="Bad response"
            >
              <ThumbsDown className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
