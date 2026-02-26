import React, { useEffect, useMemo, useState, useRef } from 'react'
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
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null) // New: for instant UI
  const [reposted, setReposted] = useState<boolean>(false)
  const [likes, setLikes] = useState<number>(0)
  const [reposts, setReposts] = useState<number>(0)
  const [commentsCount, setCommentsCount] = useState<number>(0)

  const likeOperationRef = useRef(false)

  const isLiked = optimisticLiked ?? liked

  useEffect(() => {
    let ignore = false

    async function load() {
      if (!user) {
        setLiked(false)
        setOptimisticLiked(null)
        await refreshCounts()
        return
      }

      // Fixed: select '*' instead of 'id' to avoid column not exist error
      const { data: l, error: likeErr } = await supabase
        .from('post_likes')
        .select('*')
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
    const base = 'flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm'
    const color = isLiked ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'
    return `${base} ${color}`
  }, [isLiked])

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
    if (likeOperationRef.current) return

    likeOperationRef.current = true
    const prevLiked = isLiked
    const nextLiked = !prevLiked
    const prevLikes = likes
    const nextLikes = nextLiked ? prevLikes + 1 : Math.max(0, prevLikes - 1)

    // Optimistic update
    setOptimisticLiked(nextLiked)
    setLikes(nextLikes)

    try {
      if (nextLiked) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id }) // Changed to insert (no upsert needed if no duplicates)

        if (error) {
          if (error.code === '23505') {
            // Duplicate = already liked, treat as success
            console.log('Already liked')
          } else {
            throw error
          }
        }
        await notify('like')
      } else {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)

        if (error) throw error
      }

      // Small delay for DB consistency
      await new Promise(r => setTimeout(r, 400))
      await refreshCounts()

      // Optional: update post row likes count if your posts table has likes column
      // await supabase.from('posts').update({ likes: nextLikes }).eq('id', post.id)

      qc.invalidateQueries({ queryKey: ['posts'] })
    } catch (e) {
      console.error('Like failed:', e)
      // Revert
      setOptimisticLiked(prevLiked ? true : null) // null to fall back to real state
      setLikes(prevLikes)
    } finally {
      likeOperationRef.current = false
    }
  }

  // Repost handler (kept similar, but you can apply same optimistic pattern if needed)
  const handleRepost = async () => {
    if (!user) return

    const nextReposted = !reposted
    setReposted(nextReposted)
    setReposts(prev => nextReposted ? prev + 1 : Math.max(0, prev - 1))

    try {
      if (nextReposted) {
        await supabase.from('post_reposts').insert({ post_id: post.id, user_id: user.id })
        await notify('repost')
      } else {
        await supabase.from('post_reposts').delete().eq('post_id', post.id).eq('user_id', user.id)
      }

      await new Promise(r => setTimeout(r, 400))
      await refreshCounts()
      qc.invalidateQueries({ queryKey: ['posts'] })
    } catch (e) {
      console.error('Repost failed:', e)
      setReposted(!nextReposted) // Revert
      setReposts(prev => nextReposted ? Math.max(0, prev - 1) : prev + 1)
    }
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
      <div onClick={() => navigate(`/p/${post.id}`)} role="button" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
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
                  onClick={() => setMenuOpen(v => !v)}
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
                <Heart 
                  className={`h-4 w-4 ${isLiked ? 'text-red-500' : ''}`} 
                  fill={isLiked ? 'currentColor' : 'none'} 
                />
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

      {/* Share modal */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShareOpen(false)}
        >
          {/* ... share modal content unchanged ... */}
        </div>
      )}

      {/* Comment modal */}
      {commentOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setCommentOpen(false)}
        >
          {/* ... comment modal content unchanged ... */}
        </div>
      )}
    </>
  )
}

export default PostCard
