'use client'

import { useEffect, useState } from 'react'

export function Skeleton({
  className = '',
  rounded = 'rounded-xl',
}: {
  className?: string
  rounded?: string
}) {
  return (
    <div
      className={`${rounded} ${className} relative overflow-hidden bg-ink-200 dark:bg-ink-800`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square" />
      ))}
    </div>
  )
}

export function PageLoader() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let timer: NodeJS.Timeout
    const inc = () => {
      setProgress((p) => {
        const next = p + Math.random() * 18
        if (next >= 100) {
          timer = setTimeout(() => setProgress(100), 200)
          return 100
        }
        timer = setTimeout(inc, 80 + Math.random() * 120)
        return next
      })
    }
    inc()
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-paper-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-ink-200 border-t-sunset-500" />
        <p className="font-mono text-xs text-ink-500">PhotoGo</p>
      </div>
    </div>
  )
}
