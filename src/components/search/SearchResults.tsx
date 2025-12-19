import React from 'react'
import { Link } from 'react-router-dom'

interface SearchResult {
  id: string
  username: string
}

interface SearchResultsProps {
  results: SearchResult[]
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => (
  <div className="space-y-2">
    {results.map((result) => (
      <Link key={result.id} to={`/profile/${result.id}`} className="block p-2 bg-gray-100 rounded">
        {result.username}
      </Link>
    ))}
  </div>
)

export default SearchResults