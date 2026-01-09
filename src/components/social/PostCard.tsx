import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, UserPlus } from 'lucide-react'
import { supabase, Post } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

type AuthorLite = {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  verified: boolean | null
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const s = Math.floor((Date.now() - t) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  if (w < 4) return `${w}w ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  const y = Math.floor(d / 365)
  return `${y}y ago`
}

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [author, setAuthor] = useState<AuthorLite | null>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState<number>(post.like_count || 0)
  const [reposted, setReposted] = useState(false)
  const [repostCount, setRepostCount] = useState<number>(post.repost_count || 0)
  const [commentCount, setCommentCount] = useState<number>(post.comment_count || 0)
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false)

  const mine = !!user?.id && user.id === post.user_id

  const createdAgo = useMemo(() => timeAgo(post.created_at), [post.created_at])

  useEffect(() => {
    ;(async () => {
      // author
      const { data: p } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, verified')
        .eq('id', post.user_id)
        .maybeSingle()
      if (p) setAuthor(p as any)

      if (!user?.id) return

      // like status
      const { data: l } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      setLiked(!!l)

      // repost status
      const { data: r } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .maybeSingle()
      setReposted(!!r)

      // comment count (server truth)
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id)
      if (typeof count === 'number') setCommentCount(count)

      // following status
      if (!mine) {
        const { data: f } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id)
          .maybeSingle()
        setIsFollowingAuthor(!!f)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, post.user_id, user?.id])

  const toggleLike = async () => {
    if (!user?.id) return alert('Please log in.')
    const next = !liked
    setLiked(next)
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)))
    const { error } = next
      ? await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      : await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    if (error) {
      // rollback
      setLiked(!next)
      setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)))
    }
  }

  const toggleRepost = async () => {
    if (!user?.id) return alert('Please log in.')
    const next = !reposted
    setReposted(next)
    setRepostCount((c) => Math.max(0, c + (next ? 1 : -1)))
    const { error } = next
      ? await supabase.from('reposts').insert({ post_id: post.id, user_id: user.id })
      : await supabase.from('reposts').delete().eq('post_id', post.id).eq('user_id', user.id)
    if (error) {
      setReposted(!next)
      setRepostCount((c) => Math.max(0, c + (next ? -1 : 1)))
    }
  }

  const followAuthor = async () => {
    if (!user?.id) return alert('Please log in.')
    if (mine) return
    setIsFollowingAuthor(true)
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: post.user_id })
    if (error) setIsFollowingAuthor(false)
  }

  const openAuthor = () => {
    navigate(`/profile/${post.user_id}`)
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-3">
        <button onClick={openAuthor} className="flex items-center gap-3 text-left min-w-0">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {author?.avatar_url ? (
              <img src={author.avatar_url} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-600 dark:text-gray-200 font-bold">
                {(author?.full_name || author?.username || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white truncate">
              <span className="truncate">{author?.full_name || author?.username || 'User'}</span>
              {author?.verified ? <VerifiedBadge /> : null}
            </div>
            <div className="text-sm text-gray-500 truncate">@{author?.username || 'user'} · {createdAgo}</div>
          </div>
        </button>

        {!mine && !isFollowingAuthor && user?.id ? (
          <button
            onClick={followAuthor}
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
            title="Follow"
          >
            <UserPlus className="w-4 h-4" /> Follow
          </button>
        ) : null}
      </div>

      <div className="mt-3 text-gray-900 dark:text-white whitespace-pre-wrap">{post.content}</div>
      {post.image_url ? (
        <img src={post.image_url} alt="Post" className="mt-3 w-full rounded-lg" />
      ) : null}

      <div className="flex items-center justify-around gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button
          onClick={toggleRepost}
          className={`flex items-center gap-2 ${reposted ? 'text-green-500' : 'text-gray-500'} hover:text-green-500`}
        >
          <Repeat2 className="w-5 h-5" />
          <span>{repostCount}</span>
        </button>
        <button
          onClick={() => navigate(`/post/${post.id}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{commentCount}</span>
        </button>
      </div>
    </div>
  )
}
