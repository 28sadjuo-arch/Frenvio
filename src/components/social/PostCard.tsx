import React, { useState } from 'react'
import { Heart, Share2, MessageCircle, Repeat2 } from 'lucide-react'
import { Post } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface PostCardProps {
  post: Post
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth()
  const [likes, setLikes] = useState(post.likes || 0)
  const [liked, setLiked] = useState(false)

  const handleLike = async () => {
    if (!user) return
    setLiked(!liked)
    if (!liked) {
      const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      if (!error) setLikes(likes + 1)
    } else {
      setLikes(likes - 1)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
      <div className="flex items-start gap-3 mb-3">
        <img
          src="https://via.placeholder.com/48"
          alt="User"
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{post.username || 'Anonymous'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{post.username?.toLowerCase() || 'user'}</p>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{formatTime(post.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="text-gray-900 dark:text-gray-100 mb-4">{post.content}</p>

      <div className="flex justify-between text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button className="flex items-center gap-2 hover:text-blue-500 transition group">
          <MessageCircle className="h-4 w-4 group-hover:bg-blue-100 group-hover:bg-opacity-20 rounded-full p-2 w-8 h-8 transition" />
          <span className="text-sm">{post.comments_count || 0}</span>
        </button>
        <button className="flex items-center gap-2 hover:text-green-500 transition group">
          <Repeat2 className="h-4 w-4 group-hover:bg-green-100 group-hover:bg-opacity-20 rounded-full p-2 w-8 h-8 transition" />
          <span className="text-sm">{post.reposts_count || 0}</span>
        </button>
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition group ${liked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <Heart
            className={`h-4 w-4 group-hover:bg-red-100 group-hover:bg-opacity-20 rounded-full p-2 w-8 h-8 transition ${liked ? 'fill-current' : ''}`}
          />
          <span className="text-sm">{likes}</span>
        </button>
      </div>
    </div>
  )
}

export default PostCard