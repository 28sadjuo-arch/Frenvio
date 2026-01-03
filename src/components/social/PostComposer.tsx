import React, { useMemo, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { Image as ImageIcon, Send, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { uploadPostImage } from '../../lib/storage'
import { useQueryClient } from '@tanstack/react-query'

const PostComposer: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [content, setContent] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const previewUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile])

  const onEmojiClick = (emojiData: any) => setContent((prev) => prev + emojiData.emoji)

  const handleSubmit = async () => {
    if (!user) return
    if (!content.trim() && !imageFile) return

    setSubmitting(true)
    try {
      let image_url: string | null = null

      if (imageFile) {
        try {
          image_url = await uploadPostImage(imageFile, user.id)
        } catch (e) {
          console.warn('Image upload failed. Make sure you created a public bucket named "post-images".', e)
        }
      }

      // Try inserting with image_url; if your DB doesn't have the column yet, fall back to text-only.
      const base = { content: content.trim(), user_id: user.id }
      const withImage = image_url ? { ...base, image_url } : base

      let res = await supabase.from('posts').insert(withImage)
      if (res.error && image_url) {
        console.warn('Insert with image_url failed (missing column?). Falling back to text-only.')
        res = await supabase.from('posts').insert(base)
      }
      if (res.error) throw res.error

      setContent('')
      setImageFile(null)
      setShowEmoji(false)
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
    } catch (e) {
      console.error(e)
      alert('Could not post. Check console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening?"
        className="w-full resize-none bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
        rows={3}
      />

      {previewUrl && (
        <div className="mt-3 relative">
          <img src={previewUrl} alt="Preview" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 object-cover max-h-96" />
          <button
            onClick={() => setImageFile(null)}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/70"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            😊
          </button>

          <label className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {showEmoji && (
            <div className="absolute mt-2 z-50">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && !imageFile)}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 transition disabled:opacity-60"
        >
          <Send className="h-4 w-4 inline -mt-0.5 mr-2" />
          Post
        </button>
      </div>
    </div>
  )
}

export default PostComposer
