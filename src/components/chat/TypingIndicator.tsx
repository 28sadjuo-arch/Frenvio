import React from 'react'

export default function TypingIndicator({ show }: { show: boolean }) {
  if (!show) return null

  return (
    <div className="flex items-center gap-1 px-3 py-1">
      <span className="sr-only">Typing</span>
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.1s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
    </div>
  )
}