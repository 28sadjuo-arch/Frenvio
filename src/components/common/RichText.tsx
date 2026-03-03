import React from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { stripQuoteToken } from '../../utilis/quote'

type Props = {
  text: string
  className?: string
}

/**
 * Renders text with:
 * - Markdown (bold, links, etc.)
 * - Clickable URLs
 * - @mentions -> /username
 * - #hashtags -> /search?q=%23tag
 */
export default function RichText({ text, className }: Props) {
  const clean = stripQuoteToken(text || '')

  // Preprocess mentions + hashtags into markdown links so markdown rendering still works.
  // Keep it conservative to avoid weird replacements.
  const withLinks = clean
    // @mentions
    .replace(/(^|[^\w])@([a-zA-Z0-9_]{2,30})\b/g, (_m, p1, u) => `${p1}[@${u}](/${u})`)
    // #hashtags
    .replace(/(^|[^\w])#([a-zA-Z0-9_]{2,50})\b/g, (_m, p1, t) => `${p1}[#${t}](/search?q=${encodeURIComponent(`#${t}`)})`)

  return (
    <span className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const h = href || ''
            const isInternal = h.startsWith('/')
            if (isInternal) {
              return (
                <Link
                  to={h}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {children}
                </Link>
              )
            }
            return (
              <a
                href={h}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                onClick={(e) => e.stopPropagation()}
                {...props}
              >
                {children}
              </a>
            )
          },
          // Avoid extra <p> margins inside inline contexts
          p: ({ children }) => <span>{children}</span>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        }}
      >
        {withLinks}
      </ReactMarkdown>
    </span>
  )
}
