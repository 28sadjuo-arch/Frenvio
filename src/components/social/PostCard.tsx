import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  Flag,
  X,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Post, Profile, supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import FollowButton from './FollowButton'
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

  const { data: author } = useQuery({
    queryKey: ['profile-lite', post.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', post.user_id).maybeSingle()
      return data as Profile | null
    },
  })

  const authorUsername = author?.username || 'user'
  const profileHref = `/u/${authorUsername}`

  const [menuOpen, setMenuOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setCommentText] = useState('')

  const [liked, setLiked] = useState<boolean | null>(null)
  const [reposted, setReposted] = useState<boolean | null>(null)
  const [likes, setLikes] = useState<number>(post.likes || 0)
  const [reposts, setReposts] = useState<number>(post.reposts || 0)

  useEffect(() => setLikes(post.likes || 0), [post.likes])
  useEffect(() => setReposts(post.reposts || 0), [post.reposts])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!user) return
      const { data: l } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      const { data: r } = await supabase
        .from('post_reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (ignore) return
      setLiked(!!l)
      setReposted(!!r)
    }
    load()
    return () => {
      ignore = true
    }
  }, [user, post.id])

  const canDelete = user?.id === post.user_id

  const likeBtn = useMemo(() => {
    const base =
      'flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm'
    const color = liked ? 'text-pink-600' : 'text-slate-600 dark:text-slate-300'
    return `${base} ${color}`
  }, [liked])

  const actionBtn =
    'flex items-center gap-2 px-3 py-1.5 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm text-slate-600 dark:text-slate-300'

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['comments', post.id],
    enabled: commentOpen,
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, profiles:profiles(*)')
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
    if (!user || liked === null) return

    if (liked) {
      setLiked(false)
      setLikes((x) => Math.max(0, x - 1))
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      setLiked(true)
      setLikes((x) => x + 1)
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      await notify('like')
    }

    // best-effort: keep post counters consistent (if columns exist)
    await supabase.from('posts').update({ likes: liked ? Math.max(0, likes - 1) : likes + 1 }).eq('id', post.id)
    qc.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleRepost = async () => {
    if (!user || reposted === null) return

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
    try {
      const url = `${window.location.origin}${profileHref}`
      await navigator.clipboard.writeText(url)
      alert('Profile link copied!')
    } catch {
      alert('Could not copy link.')
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

  const handleSubmitComment = async () => {
    if (!user) return
    const text = commentText.trim()
    if (!text) return
    setCommentText('')
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: text })
    await notify('comment')
    await refetchComments()
    qc.invalidateQueries({ queryKey: ['posts'] })
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={profileHref} className="font-semibold truncate hover:underline">
                    {author?.display_name || authorUsername}
                  </Link>
                  {author?.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                  <Link to={profileHref} className="text-sm text-slate-500 dark:text-slate-400 hover:underline">
                    @{authorUsername}
                  </Link>
                  <span className="text-xs text-slate-400">{formatRelativeTime(post.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {user && user.id !== post.user_id && <FollowButton targetUserId={post.user_id} compact />}
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

            <p className="mt-2 whitespace-pre-wrap break-words">{post.content}</p>

            {post.image_url && (
              <div className="mt-3">
                <img
                  src={post.image_url}
                  alt="post media"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 object-cover max-h-[520px]"
                />
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <button className={likeBtn} onClick={handleLike}>
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                <span>{likes}</span>
              </button>

              <button className={actionBtn} onClick={handleRepost}>
                <Repeat2 className="h-4 w-4" />
                <span>{reposts}</span>
              </button>

              <button className={actionBtn} onClick={() => setCommentOpen(true)}>
                <MessageCircle className="h-4 w-4" />
                <span>Comment</span>
              </button>

              <button className={actionBtn} onClick={handleShare}>
                <Share className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <div className="font-bold">Comments</div>
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
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100"
                />
                <button
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  onClick={handleSubmitComment}
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
                          {p?.verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
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
