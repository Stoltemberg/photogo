'use client'

import { type ReactNode } from 'react'

type Props = {
  active: string
  tabId: string
  children: ReactNode
  className?: string
}

/**
 * Wraps tab content with smooth fade+slide transition when active tab changes.
 * Uses the `active` prop as a key trigger to remount + animate.
 */
export function TabPanel({ active, tabId, children, className = '' }: Props) {
  if (active !== tabId) return null
  return (
    <div
      key={tabId}
      className={`animate-page-enter ${className}`}
      style={{ animationDuration: '320ms' }}
    >
      {children}
    </div>
  )
}
