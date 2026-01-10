import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Copy,
  Send,
  MoreHorizontal,
  Trash2,
  Flag,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Post, Profile, supabase } from '../../lib/supabase'
import RichText from '../common/RichText'
import { useAuth } from '../../contexts/AuthContext'
import FollowButton from './FollowButton'
import VerifiedBadge from '../common/VerifiedBadge'
import { formatRelativeTime } from '../../utilis/time'

interface PostCardProps {
  post: Post
}

const avatarFallback = (username?: string | null) => {
  const letter = (username || '?').slice(0, 1).toUpperCase()
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(letter)}`
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: author } = useQuery({
    queryKey: ['profile-lite', post.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', post.user_id).maybeSingle()
      return data as Profile | null
    },
  })

  const authorUsername = author?.username || 'user'
  const profileHref = `/${authorUsername}`

  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setText] = useState('')

  const [liked, setLiked] = useState<boolean>(false)
  const [reposted, setReposted] = useState<boolean>(false)
  const [likes, setLikes] = useState<number>(0)
  const [reposts, setReposts] = useState<number>(0)
  const [commentsCount, setCommentsCount] = useState<number>(0)

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!user) {
        setLiked(false)
        setReposted(false)
        await refreshCounts()
        return
      }
      const { data: l, error: likeErr } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      const { data: r, error: repostErr } = await supabase
        .from('post_reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (ignore) return
      // If RLS blocks SELECT, don't overwrite local state.
      if (!likeErr) setLiked(!!l)
      if (!repostErr) setReposted(!!r)
      await refreshCounts()
    }
    load()
    return () => {
      ignore = true
    }
  }, [user, post.id])

  const canDelete = user?.id === post.user_id

  const refreshCounts = async () => {
    try {
      const [{ count: likeCount }, { count: repostCount }, { count: commentCount }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_reposts').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      ])
      setLikes(likeCount || 0)
      setReposts(repostCount || 0)
      setCommentsCount(commentCount || 0)
    } catch {
      // ignore
    }
  }

  const likeBtn = useMemo(() => {
    const base =
      'flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm'
    const color = liked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'
    return `${base} ${color}`
  }, [liked])

  const actionBtnBase = 'flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm'

  const actionBtn = `${actionBtnBase} text-slate-600 dark:text-slate-300`

  const repostBtn = useMemo(() => {
    return `${actionBtnBase} ${reposted ? 'text-green-600' : 'text-slate-600 dark:text-slate-300'}`
  }, [reposted])

  const { data: comments, refetch: refetchs } = useQuery({
    queryKey: ['comments', post.id],
    enabled: commentOpen,
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, profiles:user_id (id, username, display_name, avatar_url, verified)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: false })
      return data || []
    },
  })

  const notify = async (type: 'like' | 'repost' | 'comment') => {
    // do not notify yourself
    if (!user || user.id === post.user_id) return
    await supabase.from('notifications').insert({
      user_id: post.user_id,
      actor_id: user.id,
      type,
      post_id: post.id,
    })
  }

  const handleLike = async () => {
    if (!user) return

    const prevLiked = liked
    const nextLiked = !prevLiked

    // Optimistic UI
    setLiked(nextLiked)
    setLikes((x) => (nextLiked ? x + 1 : Math.max(0, x - 1)))

    try {
      if (nextLiked) {
        // Upsert avoids duplicate-like errors
        const { error } = await supabase
          .from('post_likes')
          .upsert({ post_id: post.id, user_id: user.id }, { onConflict: 'post_id,user_id' })
        if (error) throw error
        await notify('like')
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        if (error) throw error
      }

      // Best-effort: keep post counters consistent (if columns exist)
      // Use the optimistic value we set, not stale closure values.
      await supabase
        .from('posts')
        .update({ likes: nextLiked ? likes + 1 : Math.max(0, likes - 1) })
        .eq('id', post.id)

      qc.invalidateQueries({ queryKey: ['posts'] })
    } catch (e) {
      console.error(e)
      // Revert optimistic UI on failure
      setLiked(prevLiked)
      setLikes((x) => (nextLiked ? Math.max(0, x - 1) : x + 1))
    }
  }

  const handleRepost = async () => {
    if (!user) return

    if (reposted) {
      setReposted(false)
      setReposts((x) => Math.max(0, x - 1))
      await supabase.from('post_reposts').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      setReposted(true)
      setReposts((x) => x + 1)
      await supabase.from('post_reposts').insert({ post_id: post.id, user_id: user.id })
      await notify('repost')
    }

    await supabase.from('posts').update({ reposts: reposted ? Math.max(0, reposts - 1) : reposts + 1 }).eq('id', post.id)
    qc.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleShare = async () => {
    setShareOpen(true)
  }


const handleCopyPostLink = async () => {
  const url = `${window.location.origin}/p/${post.id}`
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url)
    } else {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    alert('Post link copied')
  } catch {
    alert('Could not copy link')
  }
}

  const handleReport = async () => {
    alert('Thanks — report received.')
    setMenuOpen(false)
  }

  const handleDelete = async () => {
    if (!canDelete) return
    await supabase.from('posts').delete().eq('id', post.id)
    setMenuOpen(false)
    qc.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleSubmit = async () => {
    if (!user) return
    const text = commentText.trim()
    if (!text) return
    setText('')
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: text })
    await notify('comment')
    await refetchs()
    qc.invalidateQueries({ queryKey: ['posts'] })
  }

  return (
    <>
      <div onClick={() => navigate(`/p/${post.id}`)} role="button" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex gap-3">
          <Link to={profileHref} className="shrink-0">
            <img
              src={author?.avatar_url || avatarFallback(authorUsername)}
              className="h-11 w-11 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
              alt="avatar"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link to={profileHref} className="font-semibold truncate hover:underline inline-flex items-center gap-2">
                  <span>{author?.display_name || authorUsername}</span>
                  {author?.verified && <VerifiedBadge size={14} />}
                </Link>
                <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                  <Link to={profileHref} className="hover:underline">
                    @{authorUsername}
                  </Link>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{formatRelativeTime(post.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && user.id !== post.user_id && <FollowButton targetUserId={post.user_id} compact hideWhenFollowing />}
                <button
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="More"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div className="relative">
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden z-10">
                      {canDelete ? (
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      ) : (
                        <button
                          onClick={handleReport}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2"
                        >
                          <Flag className="h-4 w-4" /> Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <RichText className="mt-2" text={post.content} />

            {post.image_url && (
              <div className="mt-3">
                <img
                  src={post.image_url}
                  alt="post media"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 object-cover max-h-[520px]"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-start gap-2">
              <button className={likeBtn} onClick={(e) => { e.stopPropagation(); handleLike() }}>
                <Heart className={`h-4 w-4 ${liked ? 'text-red-500' : ''}`} fill={liked ? 'currentColor' : 'none'} />
                <span>{likes}</span>
              </button>

              <button className={repostBtn} onClick={(e) => { e.stopPropagation(); handleRepost() }}>
                <Repeat2 className="h-4 w-4" />
                <span>{reposts}</span>
              </button>

              <button className={actionBtn} onClick={(e) => { e.stopPropagation(); navigate(`/p/${post.id}`) }}>
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount}</span>
              </button>

              <button className={actionBtn} onClick={(e) => { e.stopPropagation(); handleShare() }}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {shareOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="w-full md:max-w-sm bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="font-extrabold">Share</div>
              <button
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => setShareOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3">
              <button
                onClick={async () => {
                  await handleCopyPostLink()
                  setShareOpen(false)
                }}
                className="w-full text-left px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-3"
              >
                <Copy className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Copy link</div>
                  <div className="text-xs text-slate-500">Copy a link to this post</div>
                </div>
              </button>

              <button
                onClick={() => {
                  const url = `${window.location.origin}/p/${post.id}`
                  navigate(`/chat?share=${encodeURIComponent(url)}`)
                  setShareOpen(false)
                }}
                className="mt-2 w-full text-left px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-3"
              >
                <Send className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Share to inbox</div>
                  <div className="text-xs text-slate-500">Send this post in a message</div>
                </div>
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/p/${post.id}`
                  navigate(`/chat?shareGroup=${encodeURIComponent(url)}`)
                  setShareOpen(false)
                }}
                className="mt-2 w-full text-left px-4 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-3"
              >
                <Send className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Share to group</div>
                  <div className="text-xs text-slate-500">Send this post to a group</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {commentOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setCommentOpen(false)}
        >
          <div
            className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="font-bold">s</div>
              <button
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => setCommentOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[55vh] overflow-auto">
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
                />
                <button
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={!commentText.trim()}
                >
                  Post
                </button>
              </div>

              <div className="space-y-4">
                {(comments || []).map((c: any) => {
                  const p = (c as any).profiles
                  const name = p?.display_name || p?.username || 'User'
                  const uname = p?.username || 'user'
                  return (
                    <div key={c.id} className="flex gap-3">
                      <img
                        src={p?.avatar_url || avatarFallback(uname)}
                        className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                        alt="avatar"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{name}</span>
                          {p?.verified && <VerifiedBadge size={14} />}
                          <span className="text-sm text-slate-500 dark:text-slate-400">@{uname}</span>
                          <span className="text-xs text-slate-400">{formatRelativeTime(c.created_at)}</span>
                        </div>
                        <div className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
                          {c.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {(comments || []).length === 0 && <div className="text-sm text-slate-500">No comments yet.</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PostCard