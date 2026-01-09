import React from 'react'

type Size = number | 'xs' | 'sm' | 'md' | 'lg'

export default function VerifiedBadge({ size = 'sm' }: { size?: Size }) {
  const map: Record<Exclude<Size, number>, number> = { xs: 12, sm: 14, md: 16, lg: 18 }
  const s = typeof size === 'number' ? size : map[size]
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-blue-500 shrink-0"
      style={{ width: s, height: s }}
      aria-label="Verified"
      title="Verified"
    >
      <svg viewBox="0 0 24 24" width={Math.max(9, s * 0.72)} height={Math.max(9, s * 0.72)} fill="none">
        <path
          d="M20.3 6.7 9.5 17.5 3.7 11.7"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
