import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import RichText from '../common/RichText'
import { Trash2 } from 'lucide-react'
import { formatRelativeTime } from '../../utilis/time'
import VerifiedBadge from '../common/VerifiedBadge'
import { Link } from 'react-router-dom'

const avatarFallback = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || '?')}`

type CommentRow = {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles?: {
    username?: string | null
    display_name?: string | null
    avatar_url?: string | null
    verified?: boolean | null
  } | null
}

export default function CommentsThread({
  postId,
  postOwnerId,
}: {
  postId: string
  postOwnerId?: string | null
}) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null)

  const { data: comments = [], refetch, isFetching } = useQuery({
    queryKey: ['comments', postId, 'thread'],
    queryFn: async () => {
      // Fetch comments without relying on foreign-key relationship joins (more robust)
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, post_id, content, created_at, user_id, parent_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      const rows = (commentsData ?? []) as any[]

      const userIds = Array.from(new Set(rows.map((c) => c.user_id).filter(Boolean)))
      let authorsMap: Record<string, any> = {}
      if (userIds.length) {
        const { data: authors } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verified')
          .in('id', userIds)
        if (authors) authorsMap = Object.fromEntries(authors.map((a: any) => [a.id, a]))
      }

      return rows.map((c) => ({ ...c, profiles: authorsMap[c.user_id] ?? null })) as CommentRow[]
    },
    enabled: !!postId,
  })

  const { parents, repliesByParent } = useMemo(() => {
    const parents: CommentRow[] = []
    const repliesByParent: Record<string, CommentRow[]> = {}
    for (const c of comments) {
      if (!c.parent_id) parents.push(c)
      else {
        repliesByParent[c.parent_id] ||= []
        repliesByParent[c.parent_id].push(c)
      }
    }
    return { parents, repliesByParent }
  }, [comments])

  const canDelete = (c: CommentRow) => {
    if (!user) return false
    return user.id === c.user_id || (!!postOwnerId && user.id === postOwnerId)
  }

  const submit = async () => {
    if (!user) return
    const content = text.trim()
    if (!content) return

    const payload: any = { post_id: postId, user_id: user.id, content }
    if (replyTo) payload.parent_id = replyTo.id

    const { error } = await supabase.from('comments').insert(payload)
    if (error) {
      alert(error.message)
      return
    }
    setText('')
    setReplyTo(null)
    await refetch()
  }

  const remove = async (id: string) => {
    if (!user) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      alert(error.message)
      return
    }
    await refetch()
  }

  const renderRow = (c: CommentRow, isReply = false) => {
    const p = c.profiles
    const name = p?.display_name || p?.username || 'User'
    const uname = p?.username || 'user'
    const avatar = p?.avatar_url || avatarFallback(uname)

    return (
      <div key={c.id} className={isReply ? 'pl-10' : ''}>
        <div className="flex items-start gap-3 py-3">
          <Link to={`/${uname}`} onClick={(e) => e.stopPropagation()}>
            <img src={avatar} className="w-9 h-9 rounded-full object-cover" />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <Link
                  to={`/${uname}`}
                  className="font-semibold hover:underline inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate">{name}</span>
                  {p?.verified ? <VerifiedBadge size="sm" /> : null}
                </Link>
                <div className="text-xs text-slate-500 truncate">@{uname} • {formatRelativeTime(c.created_at)}</div>
              </div>

              {canDelete(c) ? (
                <button
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(c.id)
                  }}
                  aria-label="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            <div className="mt-1 text-sm text-slate-900 dark:text-slate-100 break-words">
              <RichText text={c.content} />
            </div>

            {!isReply ? (
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <button
                  className="hover:text-slate-900 dark:hover:text-slate-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setReplyTo(c)
                  }}
                >
                  Reply
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {(repliesByParent[c.id] || []).length ? (
          <div className="border-l border-slate-200 dark:border-slate-800 ml-4 pl-2">
            {(repliesByParent[c.id] || []).map((r) => renderRow(r, true))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold">Comments</div>

      <div className="p-4 flex flex-col gap-2">
        {replyTo ? (
          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>
              Replying to <span className="font-semibold">@{replyTo.profiles?.username || 'user'}</span>
            </span>
            <button
              className="hover:text-slate-900 dark:hover:text-slate-100"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          />
          <button
            disabled={!text.trim() || !user}
            onClick={submit}
            className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800 px-4">
        {isFetching ? (
          <div className="py-4 text-sm text-slate-500">Loading…</div>
        ) : parents.length === 0 ? (
          <div className="py-4 text-sm text-slate-500">No comments yet.</div>
        ) : (
          parents.map((c) => renderRow(c, false))
        )}
      </div>
    </div>
  )
}
