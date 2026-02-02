import { Suspense, type ReactNode } from 'react'

interface SuspenseBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  name?: string
}

/**
 * Optimized Suspense wrapper with error boundary support
 * Use for streaming server components with proper loading states
 */
export function SuspenseBoundary({ children, fallback, name }: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}
