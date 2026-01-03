import React, { useMemo, useState } from 'react'
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, ShieldCheck, Trash2, Flag, X } from 'lucide-react'
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
  const queryClient = useQueryClient()

  const { data: author } = useQuery({
    queryKey: ['profile-lite', post.user_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', post.user_id).maybeSingle()
      return data as Profile | null
    },
  })

  const [menuOpen, setMenuOpen] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)
  const [likes, setLikes] = useState<number>(post.likes ?? 0)
  const [reposts, setReposts] = useState<number>(post.reposts ?? 0)

  const canDelete = user?.id === post.user_id

  // load like state once
  React.useEffect(() => {
    let ignore = false
    async function load() {
      if (!user) return
      const { data } = await supabase.from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).maybeSingle()
      if (!ignore) setLiked(!!data)
    }
    load()
    return () => { ignore = true }
  }, [user, post.id])

  const handleLike = async () => {
    if (!user) return
    if (liked === null) return
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLiked(false)
      setLikes((v) => Math.max(0, v - 1))
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      setLiked(true)
      setLikes((v) => v + 1)
    }
    // Best-effort: update counter in posts table if it exists
    try { await supabase.from('posts').update({ likes: likes + (liked ? -1 : 1) }).eq('id', post.id) } catch {}
  }

  const handleRepost = async () => {
    if (!user) return
    // Optional: store reposts in a table if you have it
    try {
      await supabase.from('post_reposts').insert({ post_id: post.id, user_id: user.id })
    } catch {}
    setReposts((v) => v + 1)
    try { await supabase.from('posts').update({ reposts: reposts + 1 }).eq('id', post.id) } catch {}
  }

  const handleShare = async () => {
    const url = `${window.location.origin}${profileHref}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Frenvio', text: post.content, url }) } catch {}
      return
    }
    await navigator.clipboard.writeText(url)
    alert('Link copied!')
  }

  const handleDelete = async () => {
    if (!canDelete) return
    const ok = confirm('Delete this post?')
    if (!ok) return
    await supabase.from('posts').delete().eq('id', post.id)
    setMenuOpen(false)
    await queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  const handleReport = async () => {
    // Optional table: reports(post_id, reporter_id, reason)
    try { await supabase.from('reports').insert({ post_id: post.id, reporter_id: user?.id, reason: 'Reported from UI' }) } catch {}
    alert('Thanks — we received your report.')
    setMenuOpen(false)
  }

  const authorName = author?.display_name || author?.username || 'Unknown'
  const authorUsername = author?.username || 'unknown'
  const verified = !!author?.verified
  const profileHref = author?.username ? `/u/${author.username}` : `/profile/${post.user_id}`

  const likeBtn = useMemo(() => {
    const base = 'flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm'
    const color = liked ? 'text-pink-600' : 'text-slate-600 dark:text-slate-300'
    return `${base} ${color}`
  }, [liked])

  const actionBtn = 'flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm text-slate-600 dark:text-slate-300'

  return (
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
          <div className="flex items-start justify-between gap-3">
            <Link to={profileHref} className="min-w-0 block hover:underline">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold truncate">{authorName}</span>
                {verified && <ShieldCheck className="h-4 w-4 text-blue-500" />}
                <span className="text-sm text-slate-500 dark:text-slate-400">@{authorUsername}</span>
                <span className="text-sm text-slate-400">·</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{formatRelativeTime(post.created_at)}</span>
              </div>
            </Link>
            </div>

            <div className="flex items-center gap-2">
              <FollowButton targetUserId={post.user_id} />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden">
                    {canDelete ? (
                      <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    ) : (
                      <button onClick={handleReport} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2">
                        <Flag className="h-4 w-4" /> Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="mt-2 whitespace-pre-wrap">{post.content}</p>

          {post.image_url && (
            <div className="mt-3">
              <img src={post.image_url} alt="post media" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 object-cover max-h-[520px]" />
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

            <button className={actionBtn} onClick={() => alert('Comments coming soon!')}>
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
    
      {commentOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCommentOpen(false)}>
          <div className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="font-bold">Comments</div>
              <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => setCommentOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[55vh] overflow-auto">
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment…"
                  className="flex-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button onClick={submitComment} className="rounded-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  Post
                </button>
              </div>

              <div className="space-y-3">
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
                        <div className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">{c.content}</div>
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

</div>
  )
}

export default PostCard
