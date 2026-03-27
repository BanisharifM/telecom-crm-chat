'use client'

import { useState, useEffect, useCallback, RefObject } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  scrollRef: RefObject<HTMLDivElement>
}

export function ScrollToBottom({ scrollRef }: Props) {
  const [visible, setVisible] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setVisible(distFromBottom > 150)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    return () => el.removeEventListener('scroll', checkScroll)
  }, [scrollRef, checkScroll])

  const handleClick = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      onClick={handleClick}
      className={cn(
        'absolute bottom-20 right-6 z-10 w-9 h-9 rounded-full',
        'bg-card border border-border shadow-lg',
        'flex items-center justify-center',
        'hover:bg-accent transition-colors',
        'animate-fade-in'
      )}
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}
