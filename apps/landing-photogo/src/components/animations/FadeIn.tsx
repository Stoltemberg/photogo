'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  x?: number
  scale?: number
  className?: string
  once?: boolean
}

export function FadeIn({
  children,
  delay = 0,
  duration = 600,
  y = 12,
  x = 0,
  scale = 1,
  className = '',
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) obs.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [once])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? 'translate(0,0) scale(1)'
          : `translate(${x}px, ${y}px) scale(${scale})`,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export function FadeInStagger({
  children,
  className = '',
  staggerDelay = 60,
}: {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
}) {
  return (
    <div className={className}>
      {children.map((child, idx) => (
        <FadeIn key={idx} delay={idx * staggerDelay} y={20}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}
