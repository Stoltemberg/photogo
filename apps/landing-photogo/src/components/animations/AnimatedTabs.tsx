'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type Tab = {
  id: string
  label: string
  href?: string
  count?: number
  onClick?: () => void
  icon?: React.ElementType
}

type Props = {
  tabs: Tab[]
  active?: string
  variant?: 'underline' | 'pill'
  className?: string
}

/**
 * Animated tabs with sliding indicator.
 * - Underline variant: smooth slide between tabs
 * - Pill variant: background highlight with fade
 */
export function AnimatedTabs({ tabs, active, variant = 'underline', className = '' }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  const activeId = active || tabs.find((t) => t.href && pathname?.startsWith(t.href))?.id || tabs[0]?.id

  useEffect(() => {
    const tab = tabRefs.current[activeId]
    const container = containerRef.current
    if (!tab || !container) return

    const tabRect = tab.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    setIndicator({
      left: tabRect.left - containerRect.left + container.scrollLeft,
      width: tabRect.width,
    })
  }, [activeId, tabs.length, pathname])

  const baseTabClass = `relative flex items-center gap-2 px-1 pb-3 text-sm font-medium transition-colors duration-200`

  const variantClass = {
    underline: {
      container: 'flex gap-6 border-b border-ink-900/5 dark:border-paper-100/5',
      tab: (isActive: boolean) =>
        `${baseTabClass} ${isActive ? 'text-sunset-500' : 'text-ink-500 hover:text-ink-700 dark:hover:text-paper-200'}`,
    },
    pill: {
      container: 'inline-flex gap-1 rounded-full bg-ink-100 p-1 dark:bg-ink-800',
      tab: (isActive: boolean) =>
        `relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all duration-300 ${
          isActive ? 'bg-paper-50 text-ink-900 shadow-sm dark:bg-ink-900 dark:text-paper-50' : 'text-ink-500 hover:text-ink-700 dark:hover:text-paper-200'
        }`,
    },
  }

  return (
    <div ref={containerRef} className={`relative ${className} ${variantClass[variant].container}`}>
      {tabs.map((tab) => {
        const isActive = activeId === tab.id
        const className = variantClass[variant].tab(isActive)
        const inner = (
          <>
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                variant === 'pill'
                  ? (isActive ? 'bg-ink-100 dark:bg-ink-800' : 'bg-paper-50 dark:bg-ink-900')
                  : 'bg-ink-100 dark:bg-ink-800'
              }`}>
                {tab.count}
              </span>
            )}
          </>
        )

        const refSetter = (el: HTMLAnchorElement | HTMLButtonElement | null) => {
          tabRefs.current[tab.id] = el
        }

        if (tab.href) {
          return (
            <Link
              key={tab.id}
              href={tab.href}
              ref={refSetter}
              className={className}
              onClick={() => tab.onClick?.()}
            >
              {inner}
            </Link>
          )
        }

        return (
          <button
            key={tab.id}
            ref={refSetter}
            onClick={() => {
              tab.onClick?.()
              if (tab.id !== activeId) router.refresh?.()
            }}
            className={className}
          >
            {inner}
          </button>
        )
      })}

      {/* Animated indicator (only for underline variant) */}
      {variant === 'underline' && (
        <span
          className="absolute -bottom-px h-0.5 bg-sunset-500 transition-all duration-300 ease-out"
          style={{
            left: `${indicator.left}px`,
            width: `${indicator.width}px`,
          }}
        />
      )}
    </div>
  )
}
