import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import SearchResults from '../components/search/SearchResults'

const Search: React.FC = () => {
  const [query, setQuery] = useState('')

  const { data: results, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, verified, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)

      if (error) return []
      return data || []
    },
    enabled: query.trim().length > 0,
  })

  return (
    <div>
      <h1 className="text-xl font-extrabold tracking-tight mb-3">Search</h1>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
        <SearchIcon className="h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search people…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      {isFetching && <div className="mt-3 text-sm text-slate-500">Searching…</div>}

      <div className="mt-4">
        <SearchResults results={results || []} />
      </div>
    </div>
  )
}

export default Search
