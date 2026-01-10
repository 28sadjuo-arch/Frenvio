import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
  text: string
  className?: string
}

/**
 * Renders text with clickable URLs, @mentions, and #hashtags.
 * - Mentions: @username -> /username
 * - Hashtags: #tag -> /search?q=%23tag
 */
export default function RichText({ text, className }: Props) {
  const parts: React.ReactNode[] = []

  // Regex matches: URL | @mention | #hashtag
  const pattern =
    /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(@[a-zA-Z0-9_]{2,30})|(#[a-zA-Z0-9_]{2,50})/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const [full, url, www, mention, hashtag] = match
    const start = match.index
    const end = start + full.length

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start))
    }

    if (url || www) {
      const href = url ? url : `https://${www}`
      parts.push(
        <a
          key={`${start}-${end}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {full}
        </a>
      )
    } else if (mention) {
      const username = mention.slice(1)
      parts.push(
        <Link
          key={`${start}-${end}`}
          to={`/${username}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {mention}
        </Link>
      )
    } else if (hashtag) {
      parts.push(
        <Link
          key={`${start}-${end}`}
          to={`/search?q=${encodeURIComponent(hashtag)}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {hashtag}
        </Link>
      )
    }

    lastIndex = end
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <span className={className}>{parts}</span>
}
