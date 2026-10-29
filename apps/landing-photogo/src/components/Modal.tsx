'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    // Lock body scroll
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Close on ESC
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // Focus first focusable
    setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('input, button, select, textarea, a')
      first?.focus()
    }, 100)

    return () => {
      document.body.style.overflow = original
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size]

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-page-enter"
        aria-hidden
      />

      {/* Modal */}
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative w-full ${sizeClass} overflow-hidden rounded-2xl border border-ink-900/5 bg-paper-50 shadow-2xl dark:border-paper-100/10 dark:bg-ink-900 animate-page-enter my-8`}
        style={{ animationDuration: '300ms' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-900/5 bg-paper-50 px-6 py-4 dark:border-paper-100/5 dark:bg-ink-900">
          <h2 id="modal-title" className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-paper-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
