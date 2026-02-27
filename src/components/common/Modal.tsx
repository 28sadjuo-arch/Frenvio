import React, { useEffect } from 'react'
import ReactDOM from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Lightweight accessible modal.
 * - Locks body scroll while open
 * - Closes on ESC / backdrop click
 */
export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-3 md:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div
        className={`w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden ${
          className || ''
        }`}
      >
        {title ? (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          </div>
        ) : null}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
