'use client'

import { useEffect, useState } from 'react'

export function AnimatedNumber({
  value,
  duration = 1200,
  format = (n: number) => n.toString(),
  className = '',
}: {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const initial = 0
    let raf = 0

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setDisplay(initial + (value - initial) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className={className}>{format(display)}</span>
}
