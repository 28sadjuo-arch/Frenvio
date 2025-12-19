import React, { useState } from 'react'
import { Heart, Share2, MessageCircle } from 'lucide-react'
import { Post } from '../../lib/supabase'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface PostCardProps {
  post: Post
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth()
  const [likes, setLikes] = useState(post.likes || 0)

  const handleLike = async () => {
    if (!user) return
    const { error } = await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
    if (!error) setLikes(likes + 1)
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <p className="mb-2">{post.content}</p>
      <div className="flex space-x-4 text-sm text-gray-500">
        <button onClick={handleLike} className="flex items-center">
          <Heart className="h-4 w-4 mr-1" /> {likes}
        </button>
        <button className="flex items-center">
          <Share2 className="h-4 w-4 mr-1" /> Repost
        </button>
        <button className="flex items-center">
          <MessageCircle className="h-4 w-4 mr-1" /> Comment
        </button>
      </div>
    </div>
  )
}

export default PostCard