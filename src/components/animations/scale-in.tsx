'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScaleInProps {
  children: ReactNode
  delay?: number
  duration?: number
  initialScale?: number
  className?: string
}

/**
 * Scale-in animation for modals and dialogs
 * Spring-like physics for natural feel
 */
export function ScaleIn({
  children,
  delay = 0,
  duration = 300,
  initialScale = 0.95,
  className,
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn('transition-all', className)}
      style={{
        transform: isVisible ? 'scale(1)' : `scale(${initialScale})`,
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {children}
    </div>
  )
}
