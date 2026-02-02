'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SlideInProps {
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  distance?: number
  className?: string
}

/**
 * Slide-in animation using CSS transforms
 */
export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 400,
  distance = 20,
  className,
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const getTransform = () => {
    if (isVisible) return 'translate(0, 0)'

    switch (direction) {
      case 'up':
        return `translate(0, ${distance}px)`
      case 'down':
        return `translate(0, -${distance}px)`
      case 'left':
        return `translate(${distance}px, 0)`
      case 'right':
        return `translate(-${distance}px, 0)`
      default:
        return 'translate(0, 0)'
    }
  }

  return (
    <div
      className={cn('transition-all', className)}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Spring-like easing
      }}
    >
      {children}
    </div>
  )
}
