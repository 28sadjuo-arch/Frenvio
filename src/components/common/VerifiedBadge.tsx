import React from 'react'

export default function VerifiedBadge({ size = 16 }: { size?: number }) {
  const s = size
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-blue-500"
      style={{ width: s, height: s }}
      aria-label="Verified"
      title="Verified"
    >
      <svg viewBox="0 0 24 24" width={Math.max(10, s * 0.7)} height={Math.max(10, s * 0.7)} fill="none">
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
