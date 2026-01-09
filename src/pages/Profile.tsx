import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Globe, Instagram, MoreHorizontal, User } from 'lucide-react'

type ProfileRow = {
  id: string
  username: string | null
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  verified: boolean | null
  instagram: string | null
  twitter: string | null
  website: string | null
}

type FollowRow = { follower_id: string; following_id: string }

const VerifiedBadge = ({ className = '' }: { className?: string }) => (
  <span
    className={
      'inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] leading-none ' +
      className
    }
    aria-label="Verified"
    title="Verified"
  >
    ✓
  </span>
)

const DefaultBanner = () => (
  <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
    <div className="px-6 py-10 sm:py-14">
      <div className="text-white/95 text-2xl sm:text-3xl font-black tracking-tight">FRENVIO</div>
      <div className="mt-2 text-white/80 text-sm sm:text-base font-semibold">Share, chat &amp; connect with your friends</div>
    </div>
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,.6),transparent_50%),radial-gradient(circle_at_75%_70%,rgba(99,102,241,.6),transparent_55%)]" />
  </div>
)

function normalizeHandle(v: string) {
  return v.trim().replace(/^@+/, '')
}

function safeUrl(url: string) {
  const u = url.trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

export default function Profile() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followMenuOpen, setFollowMenuOpen] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [listOpen, setListOpen] = useState<null | 'followers' | 'following'>(null)
  const [listUsers, setListUsers] = useState<ProfileRow[]>([])
  const [listLoading, setListLoading] = useState(false)

  const isMe = useMemo(() => !!user?.id && !!profile?.id && user.id === profile.id, [user?.id, profile?.id])

  // Load profile
  useEffect(() => {
    let mounted = true
    const run = async () => {
      setLoading(true)
      setProfile(null)
      if (!id) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url, verified, instagram, twitter, website')
        .eq('id', id)
        .maybeSingle()

      if (!mounted) return
      if (error) {
        console.error(error)
        setProfile(null)
        setLoading(false)
        return
      }
      setProfile((data as any) || null)
      setLoading(false)
    }
    run()
    return () => {
      mounted = false
    }
  }, [id])

  // Follow status + counts
  useEffect(() => {
    if (!user?.id || !profile?.id) return

    const load = async () => {
      // is following?
      const { data: f } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .eq('follower_id', user.id)
        .eq('following_id', profile.id)
        .maybeSingle()
      setIsFollowing(!!f)

      // counts
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
      ])
      setFollowersCount(followers || 0)
      setFollowingCount(following || 0)
    }

    load()
  }, [user?.id, profile?.id])

  const toggleFollow = async () => {
    if (!user?.id || !profile?.id || isMe) return
    if (!isFollowing) {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id } as FollowRow)
      if (!error) {
        setIsFollowing(true)
        setFollowersCount((c) => c + 1)
      }
      return
    }
    // if following, open menu (unfollow)
    setFollowMenuOpen(true)
  }

  const unfollow = async () => {
    if (!user?.id || !profile?.id) return
    const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id)
    if (!error) {
      setIsFollowing(false)
      setFollowersCount((c) => Math.max(0, c - 1))
    }
    setFollowMenuOpen(false)
  }

  const openList = async (mode: 'followers' | 'following') => {
    if (!profile?.id) return
    setListOpen(mode)
    setListLoading(true)
    setListUsers([])

    const { data: links } = await supabase
      .from('follows')
      .select('follower_id, following_id')
      .eq(mode === 'followers' ? 'following_id' : 'follower_id', profile.id)
      .limit(200)

    const ids = (links || []).map((r: any) => (mode === 'followers' ? r.follower_id : r.following_id)).filter(Boolean)
    if (!ids.length) {
      setListUsers([])
      setListLoading(false)
      return
    }

    const { data: ps } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, verified, bio, instagram, twitter, website')
      .in('id', ids)

    setListUsers((ps as any) || [])
    setListLoading(false)
  }

  if (loading) {
    return <div className="text-slate-500">Loading profile…</div>
  }

  if (!profile) {
    return <div className="text-slate-500">Profile not found.</div>
  }

  const displayName = profile.full_name || profile.username || 'User'
  const uname = profile.username ? `@${profile.username}` : ''

  const instagramUrl = profile.instagram ? `https://instagram.com/${normalizeHandle(profile.instagram)}` : ''
  const twitterUrl = profile.twitter ? `https://x.com/${normalizeHandle(profile.twitter)}` : ''
  const websiteUrl = profile.website ? safeUrl(profile.website) : ''

  return (
    <div className="space-y-4">
      {/* Banner */}
      <DefaultBanner />

      {/* Main card */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 backdrop-blur p-4 sm:p-6">
        {/* Avatar overlapping banner */}
        <div className="-mt-10 sm:-mt-12 flex items-start justify-between gap-3">
          <div className="flex items-end gap-3">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMe ? (
              <div className="relative">
                <button
                  onClick={toggleFollow}
                  className={
                    'px-4 py-2 rounded-2xl font-semibold transition ' +
                    (isFollowing
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                      : 'bg-blue-600 text-white hover:bg-blue-700')
                  }
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                {followMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg overflow-hidden z-20">
                    <button
                      onClick={unfollow}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Unfollow
                    </button>
                    <button
                      onClick={() => setFollowMenuOpen(false)}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              className="p-2 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
              aria-label="More"
              title="More"
              onClick={() => navigate('/admin')}
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <div className="text-xl font-black">{displayName}</div>
            {profile.verified ? <VerifiedBadge /> : null}
          </div>
          <div className="text-slate-500">{uname}</div>

          {profile.bio ? <div className="mt-3 whitespace-pre-wrap text-slate-800 dark:text-slate-100">{profile.bio}</div> : null}

          {/* Social icons */}
          <div className="mt-4 flex items-center gap-3">
            {instagramUrl ? (
              <a
                className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                title="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            ) : null}
            {twitterUrl ? (
              <a
                className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                title="X"
              >
                <span className="font-black">X</span>
              </a>
            ) : null}
            {websiteUrl ? (
              <a
                className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                title="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            ) : null}
          </div>

          {/* Followers */}
          <div className="mt-4 flex items-center gap-4">
            <button onClick={() => openList('following')} className="text-sm hover:underline">
              <span className="font-bold">{followingCount}</span> <span className="text-slate-500">Following</span>
            </button>
            <button onClick={() => openList('followers')} className="text-sm hover:underline">
              <span className="font-bold">{followersCount}</span> <span className="text-slate-500">Followers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Followers/Following modal */}
      {listOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setListOpen(null)}
        >
          <div
            className="w-full md:max-w-lg bg-white dark:bg-slate-950 rounded-t-2xl md:rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="font-extrabold capitalize">{listOpen}</div>
              <button className="text-sm text-slate-500 hover:underline" onClick={() => setListOpen(null)}>
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-2">
              {listLoading ? <div className="p-4 text-sm text-slate-500">Loading…</div> : null}
              {!listLoading && !listUsers.length ? <div className="p-4 text-sm text-slate-500">No users.</div> : null}

              {listUsers.map((p) => {
                const title = p.full_name || p.username || 'User'
                const u = p.username ? `@${p.username}` : ''
                const isSelf = user?.id === p.id
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
                    <button
                      className="flex items-center gap-3 min-w-0 text-left"
                      onClick={() => {
                        setListOpen(null)
                        navigate(`/profile/${p.id}`)
                      }}
                    >
                      <img
                        src={p.avatar_url || '/default-avatar.svg'}
                        className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 font-semibold truncate">
                          <span className="truncate">{title}</span>
                          {p.verified ? <VerifiedBadge /> : null}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{u}</div>
                      </div>
                    </button>
                    {!isSelf ? (
                      <MiniFollowButton targetId={p.id} />
                    ) : (
                      <span className="text-xs text-slate-500">You</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MiniFollowButton({ targetId }: { targetId: string }) {
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle()
      if (mounted) setFollowing(!!data)
    }
    run()
    return () => {
      mounted = false
    }
  }, [user?.id, targetId])

  const onToggle = async () => {
    if (!user?.id) return
    if (!following) {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId })
      if (!error) setFollowing(true)
    } else {
      const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId)
      if (!error) setFollowing(false)
    }
  }

  return (
    <button
      onClick={onToggle}
      className={
        'text-xs px-3 py-1.5 rounded-2xl font-semibold border transition ' +
        (following
          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white'
          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900')
      }
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
