import React, { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Profile, supabase } from '../../lib/supabase'
import { uploadAvatar, uploadBanner } from '../../lib/profileMedia'
import { useAuth } from '../../contexts/AuthContext'

export default function EditProfileModal({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  profile: Profile
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [instagram, setInstagram] = useState(profile.instagram || '')
  const [twitter, setTwitter] = useState(profile.twitter || '')
  const [telegram, setTelegram] = useState(profile.telegram || '')

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => {
    return !!user && !saving && username.trim().length >= 3
  }, [user, saving, username])

  if (!open) return null

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      const cleanUsername = username.trim().replace(/^@+/, '').toLowerCase()

      let avatar_url = profile.avatar_url || null
      let banner_url = profile.banner_url || null

      if (avatarFile) {
        try {
          avatar_url = await uploadAvatar(user.id, avatarFile)
        } catch (e) {
          console.warn('Avatar upload failed. Create public bucket "avatars".', e)
        }
      }

      if (bannerFile) {
        try {
          banner_url = await uploadBanner(user.id, bannerFile)
        } catch (e) {
          console.warn('Banner upload failed. Create public bucket "banners".', e)
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: cleanUsername,
          display_name: displayName || null,
          bio: bio || null,
          website: website || null,
          instagram: instagram || null,
          twitter: twitter || null,
          telegram: telegram || null,
          avatar_url,
          banner_url,
        })
        .eq('id', user.id)

      if (error) throw error
      onSaved()
      onClose()
    } catch (e) {
      console.error(e)
      alert('Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="font-extrabold">Edit profile</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="username"
              />
              <div className="mt-1 text-xs text-slate-500">You can mention people like @username in posts, comments, and bio.</div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 min-h-[96px]"
              placeholder="Tell people about you…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Instagram</label>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="@handle"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">X (Twitter)</label>
              <input
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="@handle"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Telegram</label>
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="@handle"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Avatar</label>
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="mt-1 w-full text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold">Banner</label>
              <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="mt-1 w-full text-sm" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900">
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={save}
            className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
