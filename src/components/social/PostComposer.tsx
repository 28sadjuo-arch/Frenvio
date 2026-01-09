import React, { useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { Send } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const PostComposer: React.FC = () => {
  const [content, setContent] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!content.trim() || !user) return
    const { error } = await supabase.from('posts').insert({
      content,
      user_id: user.id
    })
    if (error) alert(error.message)
    else setContent('')
    setShowEmoji(false)
  }

  const onEmojiClick = (emojiObject: any) => {
    setContent((prev) => prev + emojiObject.emoji)
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening? @mention friends..."
        className="w-full p-2 bg-transparent resize-none outline-none dark:text-white"
        rows={3}
      />
      <div className="flex justify-between items-center mt-2">
        <button onClick={() => setShowEmoji(!showEmoji)} className="text-gray-500">😊</button>
        {showEmoji && <EmojiPicker onEmojiClick={onEmojiClick} />}
        <button onClick={handleSubmit} disabled={!content} className="bg-primary-500 text-white px-4 py-2 rounded disabled:opacity-50">
          <Send className="h-4 w-4 inline mr-1" /> Post
        </button>
      </div>
    </div>
  )
}

export default PostComposer