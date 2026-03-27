'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

interface Props {
  value: number
  format?: 'number' | 'currency' | 'percent' | 'decimal'
  duration?: number
}

export function AnimatedCounter({ value, format = 'number', duration = 1.5 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { duration: duration * 1000 })
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) motionValue.set(value)
  }, [isInView, value, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (!ref.current) return
      if (format === 'currency') {
        ref.current.textContent = `$${latest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      } else if (format === 'percent') {
        ref.current.textContent = `${latest.toFixed(1)}%`
      } else if (format === 'decimal') {
        ref.current.textContent = latest.toFixed(1)
      } else {
        ref.current.textContent = Math.round(latest).toLocaleString('en-US')
      }
    })
    return unsubscribe
  }, [springValue, format])

  return <span ref={ref}>0</span>
}
