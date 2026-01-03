import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

interface SearchResult {
  id: string
  username?: string | null
  display_name?: string | null
  verified?: boolean | null
  avatar_url?: string | null
}

const avatarFallback = (seed: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || '?')}`

const SearchResults: React.FC<{ results: SearchResult[] }> = ({ results }) => {
  if (!results.length) return <div className="text-sm text-slate-500">Try searching for someone by username.</div>

  return (
    <div className="space-y-2">
      {results.map((u) => (
        <Link
          key={u.id}
          to={`/profile/${u.id}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={u.avatar_url || avatarFallback(u.username || u.display_name || 'user')}
              className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
              alt="avatar"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold truncate">{u.display_name || u.username || 'Unknown'}</div>
                {!!u.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
              </div>
              <div className="text-sm text-slate-500 truncate">@{u.username || 'unknown'}</div>
            </div>
          </div>
          <span className="text-sm font-semibold text-blue-600">View</span>
        </Link>
      ))}
    </div>
  )
}

export default SearchResults
