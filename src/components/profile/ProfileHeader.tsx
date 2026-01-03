import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Settings } from 'lucide-react'
import { Profile } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import FollowButton from '../social/FollowButton'
import EditProfileModal from './EditProfileModal'

const avatarFallback = (seed: string) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || '?')}`

export default function ProfileHeader({ profile, onUpdated }: { profile: Profile, onUpdated: () => void }) {
  const { user } = useAuth()
  const isMe = user?.id === profile.id
  const [editOpen, setEditOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-32 bg-slate-200 dark:bg-slate-800 relative">
        {profile.banner_url ? <img src={profile.banner_url} className="h-full w-full object-cover" alt="banner" /> : null}
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between gap-3">
          <img
            src={profile.avatar_url || avatarFallback(profile.username || 'user')}
            className="h-20 w-20 rounded-full border-4 border-white dark:border-slate-900 object-cover"
            alt="avatar"
          />

          <div className="flex items-center gap-2">
            {isMe ? (
              <>
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold"
                >
                  Edit profile
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
              <FollowButton targetUserId={profile.id} size="md" />
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold">
              {profile.display_name || profile.username || 'Unknown'}
            </h1>
            {!!profile.verified && <ShieldCheck className="h-5 w-5 text-blue-500" />}
          </div>
          <div className="text-slate-500 dark:text-slate-400">@{profile.username || 'unknown'}</div>

          {profile.bio && <p className="mt-2 whitespace-pre-wrap text-slate-800 dark:text-slate-200">{profile.bio}</p>}

          <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span><b className="text-slate-900 dark:text-white">{profile.following_count ?? 0}</b> Following</span>
            <span><b className="text-slate-900 dark:text-white">{profile.followers_count ?? 0}</b> Followers</span>
          </div>
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} profile={profile} onSaved={onUpdated} />
    </div>
  )
}
