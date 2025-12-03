import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import SearchResults from '../components/search/SearchResults'

const Search: React.FC = () => {
  const [query, setQuery] = useState('')

  const { data: results } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return []
      const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`)
      return data
    },
    enabled: !!query
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Search</h1>
      <input
        type="text"
        placeholder="Search users or posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <SearchResults results={results || []} />
    </div>
  )
}

export default Search