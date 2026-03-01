import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase, Profile } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Globe, Instagram, Send, Settings, Share2, MessageCircle, Twitter, X } from 'lucide-react'
import VerifiedBadge from '../common/VerifiedBadge'
import { badgeVariantForProfile } from '../../utilis/badge'
import RichText from '../common/RichText'
import { useAuth } from '../../contexts/AuthContext'
import FollowButton from '../social/FollowButton'
import EditProfileModal from './EditProfileModal'
import Modal from '../common/Modal'

const avatarFallback = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || '?')}`

function normalizeHandle(v?: string | null) {
  if (!v) return null
  return v.trim().replace(/^@+/, '')
}

function ensureUrl(v?: string | null) {
  if (!v) return null
  const t = v.trim()
  if (!t) return null
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  return `https://${t}`
}

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  )
}

export default function ProfileHeader({ profile, onUpdated }: { profile: Profile; onUpdated: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMe = user?.id === profile.id
  const [editOpen, setEditOpen] = useState(false)
  const [listOpen, setListOpen] = useState<null | 'followers' | 'following'>(null)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const handles = useMemo(() => {
    const instagram = normalizeHandle(profile.instagram)
    const twitter = normalizeHandle(profile.twitter)
    const telegram = normalizeHandle(profile.telegram)
    const website = ensureUrl(profile.website)
    return { instagram, twitter, telegram, website }
  }, [profile.instagram, profile.twitter, profile.telegram, profile.website])

  // NOTE:
  // Some Supabase RLS policies allow reading follow rows only when the
  // authenticated user is involved in the relationship. That would make counts for
  // *other* profiles look like "1 follower" (only you) even if they have more.
  // We therefore prefer the denormalized counters stored on the profile record.
  // Fallback to counting follows only when counters are missing.
  const { data: followCounts } = useQuery({
    queryKey: ['followCounts', profile.id, profile.followers_count, profile.following_count],
    queryFn: async () => {
      const pFollowers = typeof profile.followers_count === 'number' ? profile.followers_count : null
      const pFollowing = typeof profile.following_count === 'number' ? profile.following_count : null
      if (pFollowers !== null && pFollowing !== null) {
        return { following: pFollowing, followers: pFollowers }
      }

      const { data: p } = await supabase
        .from('profiles')
        .select('followers_count, following_count')
        .eq('id', profile.id)
        .maybeSingle()

      const dbFollowers = typeof p?.followers_count === 'number' ? p.followers_count : null
      const dbFollowing = typeof p?.following_count === 'number' ? p.following_count : null
      if (dbFollowers !== null && dbFollowing !== null) {
        return { following: dbFollowing, followers: dbFollowers }
      }

      // Last-resort fallback (may be limited by RLS for other profiles)
      const [{ count: following }, { count: followers }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
      ])
      return { following: following || 0, followers: followers || 0 }
    },
  })

  const { data: listData } = useQuery({
    queryKey: ['followList', profile.id, listOpen],
    queryFn: async () => {
      if (!listOpen) return []
      if (listOpen === 'followers') {
        const { data } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', profile.id)
          .limit(200)
        const ids = (data || []).map((x: any) => x.follower_id)
        if (!ids.length) return []
        const { data: ps } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verified')
          .in('id', ids)
        return ps || []
      } else {
        const { data } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', profile.id)
          .limit(200)
        const ids = (data || []).map((x: any) => x.following_id)
        if (!ids.length) return []
        const { data: ps } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, verified')
          .in('id', ids)
        return ps || []
      }
    },
    enabled: !!listOpen,
  })

  const copyProfileLink = async () => {
    try {
      const slug = profile.username || profile.id
      const url = `${window.location.origin}/${slug}`
      await navigator.clipboard.writeText(url)
      alert('Profile link copied!')
    } catch {
      alert('Could not copy link.')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Banner */}
      <div className="h-36 relative">
        {profile.banner_url ? (
          <img src={profile.banner_url} className="h-full w-full object-cover" alt="banner" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-700 via-blue-600 to-slate-900 flex items-center">
            <div className="px-6">
              <div className="text-white text-3xl md:text-4xl font-black tracking-tight">FRENVIO</div>
              <div className="text-white/85 mt-1 text-sm md:text-base font-semibold">
                Share, chat & connect with your friends
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar + actions */}
        <div className="-mt-10 flex items-end justify-between gap-3">
          <img
            src={profile.avatar_url || avatarFallback(profile.username || profile.display_name || 'user')}
            alt="avatar"
            className="h-20 w-20 rounded-full border-4 border-white dark:border-slate-900 object-cover bg-white z-10 relative"
            loading="lazy"
            decoding="async"
            onClick={() => setAvatarOpen(true)}
            role="button"
          />

          <div className="-mt-10 flex items-end justify-between gap-3 relative z-10">
            {isMe ? (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold"
                >
                  Edit profile
                </button>             

                <button
                  onClick={copyProfileLink}
                  className="p-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Copy profile link"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <Link
                  to="/settings"
                  className="p-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              </>
            ) : (
              <>
                <FollowButton targetUserId={profile.id} size="md" />
                <Link
                  to={`/chat?to=${profile.id}`}
                  className="p-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Message"
                >
                  <MessageCircle className="h-5 w-5" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold">
              {profile.display_name || profile.username || 'Unknown'}
            </h1>
            {badgeVariantForProfile(profile) && <VerifiedBadge size={18} variant={badgeVariantForProfile(profile)!} />}
          </div>
          <div className="text-slate-500 dark:text-slate-400">@{profile.username || 'unknown'}</div>

          {/* Social icons (only if provided) */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {handles.instagram ? (
              <SocialIconLink href={`https://instagram.com/${handles.instagram}`} label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialIconLink>
            ) : null}

            {handles.twitter ? (
              <SocialIconLink href={`https://x.com/${handles.twitter}`} label="X (Twitter)">
                <Twitter className="h-4 w-4" />
              </SocialIconLink>
            ) : null}

            {handles.telegram ? (
              <SocialIconLink href={`https://t.me/${handles.telegram}`} label="Telegram">
                <Send className="h-4 w-4" />
              </SocialIconLink>
            ) : null}

            {handles.website ? (
              <SocialIconLink href={handles.website} label="Website">
                <Globe className="h-4 w-4" />
              </SocialIconLink>
            ) : null}
          </div>

          {/* Bio */}
          {profile.bio ? (
            <RichText
              text={profile.bio}
              className="mt-3 whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200"
            />
          ) : null}

          {/* Followers/Following (clickable) */}
          <div className="mt-4 flex items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
            <button
              className="hover:underline"
              onClick={() => setListOpen('following')}
            >
              <b className="text-slate-900 dark:text-white">{followCounts?.following ?? 0}</b> Following
            </button>

            <button
              className="hover:underline"
              onClick={() => setListOpen('followers')}
            >
              <b className="text-slate-900 dark:text-white">{followCounts?.followers ?? 0}</b> Followers
            </button>
          </div>
        </div>
      </div>

   {/* Avatar preview */}
      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)} className="max-w-3xl">
        <div className="relative flex flex-col items-center">
          <button
            className="absolute right-0 top-0 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
            onClick={() => setAvatarOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={profile.avatar_url || avatarFallback(profile.username || profile.display_name || 'user')}
            alt="avatar"
            className="max-h-[75vh] w-auto max-w-full rounded-2xl border border-slate-200 dark:border-slate-800 object-contain"
            decoding="async"
            loading="lazy"
          />

          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {profile.display_name || profile.username || 'Profile'}
          </div>
        </div>
      </Modal>

   {/* Followers/Following Modal */}
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
              <div className="font-extrabold">{listOpen === 'followers' ? 'Followers' : 'Following'}</div>
              <button className="text-sm text-slate-500 hover:underline" onClick={() => setListOpen(null)}>
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-2">
              {(listData || []).map((p: any) => {
                const title = p.display_name || p.username || 'User'
                const uname = p.username ? `@${p.username}` : ''
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900">
                    <button
                      className="flex items-center gap-3 min-w-0 text-left"
                      onClick={() => {
                        setListOpen(null)
                        navigate(`/${p.username || p.id}`)
                      }}
                    >
                      <img
                        src={p.avatar_url || avatarFallback(p.username || 'user')}
                        className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-semibold truncate">
                          <span className="truncate">{title}</span>
                          {badgeVariantForProfile(p) ? <VerifiedBadge size={16} variant={badgeVariantForProfile(p)!} /> : null}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{uname}</div>
                      </div>
                    </button>

                    {/* Follow button on list */}
                    {user?.id && user.id !== p.id ? <FollowButton targetUserId={p.id} size="sm" /> : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} onSaved={onUpdated} />
    </div>
  )
}
