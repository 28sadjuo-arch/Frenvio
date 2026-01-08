import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import RichText from '../common/RichText'

const avatarFallback = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || '?')}`

export default function CommentsThread({ postId }: { postId: string }) {
  const { user } = useAuth()
  const [text, setText] = useState('')

  const { data: comments = [], refetch, isFetching } = useQuery({
    queryKey: ['comments', postId, 'thread'],
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, profiles:user_id (username, display_name, avatar_url, verified)')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
      return (data as any[]) || []
    },
    enabled: !!postId,
  })

  const submit = async () => {
    if (!user) return
    const content = text.trim()
    if (!content) return
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: user.id, content })
    if (error) {
      alert(error.message)
      return
    }
    setText('')
    await refetch()
  }

  return (
    <div id="comments" className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold">Comments</div>

      <div className="p-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Write a comment…" : "Sign in to comment…"}
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
          disabled={!user}
        />
        <button
          onClick={submit}
          disabled={!user || !text.trim()}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          Post
        </button>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {isFetching ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No comments yet.</div>
        ) : (
          comments.map((c: any) => {
            const p = c.profiles
            const name = p?.display_name || p?.username || 'User'
            const uname = p?.username || 'user'
            return (
              <div key={c.id} className="p-4 flex gap-3">
                <img
                  src={p?.avatar_url || avatarFallback(uname)}
                  className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                  alt="avatar"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{name}</div>
                  <div className="text-xs text-slate-500">@{uname}</div>
                  <RichText className="mt-1" text={c.content} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
