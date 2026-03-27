'use client'

import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { FadeIn } from './fade-in'

interface StaggerFadeInProps {
  children: ReactNode
  staggerDelay?: number
  duration?: number
  className?: string
}

/**
 * Stagger animation for list items
 * Each child fades in with a delay
 */
export function StaggerFadeIn({
  children,
  staggerDelay = 50,
  duration = 300,
  className,
}: StaggerFadeInProps) {
  const childrenArray = Children.toArray(children)

  return (
    <>
      {childrenArray.map((child, index) => {
        if (!isValidElement(child)) return child

        return (
          <FadeIn
            key={(child as ReactElement).key || index}
            delay={index * staggerDelay}
            duration={duration}
            className={className}
          >
            {child}
          </FadeIn>
        )
      })}
    </>
  )
}
