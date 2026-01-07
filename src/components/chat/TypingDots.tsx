import React from 'react'

export default function TypingDots() {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-xs px-2">
      <span className="inline-flex gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  )
}
