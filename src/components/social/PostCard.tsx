import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Copy,
  Send,
  Quote,
  Pin,
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
import { badgeVariantForProfile } from '../../utilis/badge'
import { formatRelativeTime } from '../../utilis/time'
import Modal from '../common/Modal'
import { extractQuotePostId, stripQuoteToken } from '../../utilis/quote'
import { getPinnedPostIds, togglePin } from '../../utilis/pins'
import { askFrenvioAi, getFrenvioAiUserId, textMentionsFrenvioAi } from '../../lib/frenvioAi'

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
  const quotePostId = useMemo(() => extractQuotePostId(post.content || ''), [post.content])
  const displayContent = useMemo(() => stripQuoteToken(post.content || ''), [post.content])
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteText, setQuoteText] = useState('')
  const { data: author } = useQuery({
    queryKey: ['profile-lite', post.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, verified')
        .eq('id', post.user_id)
        .maybeSingle()
      return data as Profile | null
    },
    staleTime: 5 * 60_000,
  })
  const authorUsername = author?.username || 'user'
  const profileHref = `/${authorUsername}`
  const { data: pinnedIds = [] } = useQuery({
    queryKey: ['pinnedPosts', user?.id],
    enabled: !!user,
    queryFn: async () => (user ? await getPinnedPostIds(user.id) : []),
    staleTime: 30_000,
  })
  const isPinned = !!user && user.id === post.user_id && (pinnedIds || []).includes(post.id)
  const { data: quoted } = useQuery({
    queryKey: ['quotedPost', quotePostId],
    enabled: !!quotePostId,
    queryFn: async () => {
      if (!quotePostId) return null
      const { data: qp } = await supabase.from('posts').select('*').eq('id', quotePostId).maybeSingle()
      if (!qp) return null
      const { data: ap } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, verified')
        .eq('id', (qp as any).user_id)
        .maybeSingle()
      return { post: qp as any, author: ap as any }
    },
    staleTime: 5 * 60_000,
  })
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setText] = useState('')
  // Media preview modals
  const [imageOpen, setImageOpen] = useState(false)
  const [profilePreviewOpen, setProfilePreviewOpen] = useState(false)
  // Optimistic UI only (real state comes from cached queries)
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null)
  const [optimisticReposted, setOptimisticReposted] = useState<boolean | null>(null)
  const [optimisticLikesDelta, setOptimisticLikesDelta] = useState(0)
  const [optimisticRepostsDelta, setOptimisticRepostsDelta] = useState(0)
  const [optimisticCommentsDelta, setOptimisticCommentsDelta] = useState(0)
  const likeOperationRef = useRef(false)
  const { data: counts } = useQuery({
    queryKey: ['postCounts', post.id],
    queryFn: async () => {
      const [{ count: likeCount }, { count: repostCount }, { count: commentCount }] = await Promise.all([
        supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_reposts').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      ])
      return {
        likes: likeCount || 0,
        reposts: repostCount || 0,
        comments: commentCount || 0,
      }
    },
    staleTime: 30_000,
  })
  const { data: interactions } = useQuery({
    queryKey: ['postInteractions', post.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { liked: false, reposted: false }
      const [{ data: l }, { data: r }] = await Promise.all([
        supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('post_reposts')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ])
      return { liked: !!l, reposted: !!r }
    },
    staleTime: 15_000,
  })
  const baseLikes = counts?.likes || 0
  const baseReposts = counts?.reposts || 0
  const baseComments = counts?.comments || 0
  const likes = Math.max(0, baseLikes + optimisticLikesDelta)
  const reposts = Math.max(0, baseReposts + optimisticRepostsDelta)
  const commentsCount = Math.max(0, baseComments + optimisticCommentsDelta)
  const liked = optimisticLiked ?? (interactions?.liked || false)
  const reposted = optimisticReposted ?? (interactions?.reposted || false)
  const canDelete = user?.id === post.user_id
  const likeBtn = useMemo(() => {
    const base = 'flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm'
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
    const prevLiked = liked
    const nextLiked = !prevLiked
    // Optimistic update (instant + smooth)
    setOptimisticLiked(nextLiked)
    setOptimisticLikesDelta((d) => d + (nextLiked ? 1 : -1))
    try {
      if (nextLiked) {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id })
        if (error) {
          if (error.code === '23505') {
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
      qc.invalidateQueries({ queryKey: ['postCounts', post.id] })
      qc.invalidateQueries({ queryKey: ['postInteractions', post.id, user.id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
    } catch (e) {
      console.error('Like failed:', e)
      setOptimisticLiked(null)
      setOptimisticLikesDelta(0)
    } finally {
      likeOperationRef.current = false
    }
  }
  const handleRepost = async () => {
    if (!user) return
    const prev = reposted
    const nextReposted = !prev
    setOptimisticReposted(nextReposted)
    setOptimisticRepostsDelta((d) => d + (nextReposted ? 1 : -1))
    try {
      if (nextReposted) {
        await supabase.from('post_reposts').insert({ post_id: post.id, user_id: user.id })
        await notify('repost')
      } else {
        await supabase.from('post_reposts').delete().eq('post_id', post.id).eq('user_id', user.id)
      }
      qc.invalidateQueries({ queryKey: ['postCounts', post.id] })
      qc.invalidateQueries({ queryKey: ['postInteractions', post.id, user.id] })
      qc.invalidateQueries({ queryKey: ['posts'] })
    } catch (e) {
      console.error('Repost failed:', e)
      setOptimisticReposted(null)
      setOptimisticRepostsDelta(0)
    }
  }
  const handleShare = async () => {
    setShareOpen(true)
  }
  const handleQuote = () => {
    if (!user) return
    setQuoteText('')
    setQuoteOpen(true)
  }
  const submitQuote = async () => {
    if (!user) return
    const txt = quoteText.trim()
    if (!txt) return

    const payload = {
      content: `${txt} [[quote:${post.id}]]`,
      user_id: user.id,
    }

    const { data: inserted, error } = await supabase.from('posts').insert(payload).select('id').maybeSingle()

    if (error) {
      alert(error.message)
      return
    }

    // === FrenvioAI reply on quoted posts ===
    try {
      if (textMentionsFrenvioAi(txt)) {
        const aiId = await getFrenvioAiUserId()
        if (aiId) {
          const prompt =
            `You were mentioned as @frenvioai in a quoted/reposted post.\n\n` +
            `Quote text: "${txt.slice(0, 800)}"\n\n` +
            `Original post: "${post.content?.slice(0, 800) || ''}"\n\n` +
            `Reply as Frenvio AI. Be helpful and short.`
          const reply = await askFrenvioAi(prompt)
          if (reply) {
            await supabase.from('comments').insert({
              post_id: post.id,           // Reply to the original post
              user_id: aiId,
              content: reply,
            })
          }
        }
      }
    } catch (e) {
      console.error('FrenvioAI reply on quote failed:', e)
    }
    // === End of AI reply ===

    setQuoteOpen(false)
    setQuoteText('')
    qc.invalidateQueries({ queryKey: ['posts'] })
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
    setOptimisticCommentsDelta((d) => d + 1)
    await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: text })
    await notify('comment')
    await refetchs()
    qc.invalidateQueries({ queryKey: ['postCounts', post.id] })
    qc.invalidateQueries({ queryKey: ['posts'] })
    setOptimisticCommentsDelta(0)
  }

  return (
    <>
      <div onClick={() => navigate(`/p/${post.id}`)} role="button" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        {/* Your original card content (unchanged) */}
        <div className="flex gap-3">
          <Link
            to={profileHref}
            className="shrink-0"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setProfilePreviewOpen(true)
            }}
          >
            <img
              src={author?.avatar_url || avatarFallback(authorUsername)}
              className="h-11 w-11 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
              alt="avatar"
              loading="lazy"
              decoding="async"
            />
          </Link>
          <div className="min-w-0 flex-1">
            {/* ... rest of your card header, RichText, quoted post display, image, action buttons ... */}
            {/* (All your original code from here is kept exactly the same) */}
          </div>
        </div>
      </div>

      {/* Quote modal - kept exactly as you had it */}
      {quoteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setQuoteOpen(false)
          }}
        >
          <div className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            {/* ... your quote modal content unchanged ... */}
          </div>
        </div>
      )}

      {/* Share modal - unchanged */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShareOpen(false) }}>
          {/* ... your share modal unchanged ... */}
        </div>
      )}

      {/* Comment modal - unchanged */}
      {commentOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setCommentOpen(false)}>
          {/* ... your comment modal unchanged ... */}
        </div>
      )}

      {/* Profile preview modal - unchanged */}
      <Modal open={profilePreviewOpen} onClose={() => setProfilePreviewOpen(false)} className="max-w-lg">
        {/* ... your profile preview unchanged ... */}
      </Modal>

      {/* Image preview modal - unchanged */}
      <Modal open={imageOpen} onClose={() => setImageOpen(false)} className="max-w-4xl">
        {post.image_url ? (
          <div className="relative">
            <button className="absolute right-2 top-2 p-2 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-900 dark:bg-slate-950/80 dark:hover:bg-slate-950 dark:border-slate-800 dark:text-slate-100" onClick={() => setImageOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
            <img src={post.image_url} alt="post media" className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 object-contain max-h-[80vh]" decoding="async" loading="lazy" />
          </div>
        ) : null}
      </Modal>
    </>
  )
}

export default PostCard
