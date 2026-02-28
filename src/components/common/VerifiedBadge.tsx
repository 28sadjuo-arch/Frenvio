import React from 'react'

type Size = number | 'xs' | 'sm' | 'md' | 'lg'
type Variant = 'blue' | 'gold'

export default function VerifiedBadge({
  size = 'sm',
  variant = 'blue',
  className = '',
}: {
  size?: Size
  variant?: Variant
  className?: string
}) {
  const map: Record<Exclude<Size, number>, number> = { xs: 12, sm: 14, md: 16, lg: 18 }
  const s = typeof size === 'number' ? size : map[size]
  const bg = variant === 'gold' ? 'bg-yellow-500' : 'bg-blue-500'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${bg} ${className}`}
      style={{ width: s, height: s }}
      aria-label="Verified"
      title={variant === 'gold' ? 'Team badge' : 'Verified'}
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
