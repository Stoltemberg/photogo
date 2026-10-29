'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * Page-level transition wrapper.
 * - Fades + slides content on route change
 * - Stagger animations for direct children
 */
export function PageTransition({ children, className = '' }: Props) {
  const pathname = usePathname()
  const [key, setKey] = useState(pathname || '/')

  useEffect(() => {
    setKey(pathname || '/')
  }, [pathname])

  return (
    <div
      key={key}
      className={`animate-page-enter ${className}`}
      style={{ animationDuration: '400ms' }}
    >
      {children}
    </div>
  )
}

/**
 * Staggered list entrance — wraps a list and animates each child with a delay.
 */
export function StaggeredList({
  children,
  className = '',
  delayStep = 60,
}: {
  children: ReactNode[]
  className?: string
  delayStep?: number
}) {
  return (
    <div className={className}>
      {children.map((child, idx) => (
        <div
          key={idx}
          className="animate-page-enter"
          style={{
            animationDuration: '350ms',
            animationDelay: `${idx * delayStep}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
