import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
  text: string
  className?: string
}

/**
 * Renders text with clickable @mentions and URLs.
 * Mentions: @username -> /username
 */
export default function RichText({ text, className }: Props) {
  const parts: React.ReactNode[] = []

  // Regex splits into: urls OR mentions OR normal text
  const regex = /(https?:\/\/[^\s]+)|(@[a-zA-Z0-9_]{1,30})/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const end = regex.lastIndex
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start))
    }

    const [token, url, mention] = match
    if (url) {
      parts.push(
        <a
          key={`${start}-${end}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
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
    } else {
      parts.push(token)
    }

    lastIndex = end
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <p className={className ?? 'whitespace-pre-wrap break-words'}>{parts}</p>
}
