'use client'

import { useRef, useCallback } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  placeholder?: string
}

/**
 * Auto-resizing chat input (ChatGPT/Claude pattern).
 * - Grows with content up to ~200px (8 lines), then scrolls
 * - Enter submits, Shift+Enter inserts newline
 * - IME composition safe (CJK input)
 */
export function ChatInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't submit during IME composition (CJK input)
    if (e.nativeEvent.isComposing) return

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit()
      }
    }
  }, [value, disabled, onSubmit])

  return (
    <div className="max-w-3xl mx-auto flex gap-2 items-end">
      <TextareaAutosize
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Ask about churn, billing, service calls...'}
        minRows={1}
        maxRows={8}
        disabled={disabled}
        className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50"
      />
      <Button
        onClick={onSubmit}
        disabled={!value.trim() || disabled}
        size="icon"
        className="h-10 w-10 shrink-0 mb-0.5"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
