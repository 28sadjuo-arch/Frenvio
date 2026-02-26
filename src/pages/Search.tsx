import React, { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, Users, Hash } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Post, supabase } from '../lib/supabase'
import SearchResults from '../components/search/SearchResults'
import PostCard from '../components/social/PostCard'

// Debounce for smooth typing
function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

const Search: React.FC = () => {
  const [params] = useSearchParams()
  const urlQ = params.get('q') || ''
  const [query, setQuery] = useState(urlQ)
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users')

  const debouncedQuery = useDebounce(query.trim())

  useEffect(() => {
    setQuery(urlQ)
  }, [urlQ])

  const isHashTagIntent = debouncedQuery.startsWith('#')
  const searchTerm = debouncedQuery.replace(/^#+/, '').trim()

  useEffect(() => {
    if (isHashTagIntent && activeTab !== 'posts') {
      setActiveTab('posts')
    }
  }, [isHashTagIntent])

  // Users: prefix search (starts with)
  const { data: people = [], isFetching: peopleLoading } = useQuery({
    queryKey: ['search-people', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || isHashTagIntent) return []

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, verified, avatar_url')
        .or(`username.ilike.${searchTerm}%,display_name.ilike.${searchTerm}%`)
        .limit(20)

      if (error) console.error('User search error:', error)
      return data || []
    },
    enabled: debouncedQuery.length > 0 && !isHashTagIntent,
  })

  // Posts: search for the word (with or without #)
  const { data: posts = [], isFetching: postsLoading } = useQuery({
    queryKey: ['search-posts', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return []

      // Try both with # and without, case-insensitive
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, content, image_url, likes, reposts, created_at')
        .or(`content.ilike.%${searchTerm}%,content.ilike.%#${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) console.error('Post search error:', error)
      return (data || []) as Post[]
    },
    enabled: debouncedQuery.length > 0 && (activeTab === 'posts' || isHashTagIntent),
  })

  const isLoading = peopleLoading || postsLoading

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 pt-4 pb-10">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">Search</h1>

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 shadow-sm">
        <SearchIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        <input
          type="text"
          placeholder="Search people or #hashtags…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-base"
          autoFocus
        />
      </div>

      {debouncedQuery.length > 0 && (
        <div className="mt-5 flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-1.5" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'posts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <Hash className="h-4 w-4 inline mr-1.5" />
            Posts
          </button>
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">Searching...</div>
        ) : debouncedQuery.length === 0 ? (
          <div className="text-center py-16 text-slate-500">Type a name or #hashtag to search</div>
        ) : activeTab === 'users' ? (
          people.length > 0 ? (
            <SearchResults results={people} />
          ) : (
            <div className="text-center py-12 text-slate-500">
              No users found starting with "{debouncedQuery}"
            </div>
          )
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            No posts found for "{debouncedQuery}"
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
