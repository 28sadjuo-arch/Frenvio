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
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)


  React.useEffect(() => {
    if (!open) return
    setDisplayName(profile.display_name || '')
    setBio(profile.bio || '')
    setAvatarFile(null)
    setBannerFile(null)
  }, [open, profile.id])

  const avatarPreview = useMemo(() => (avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url), [avatarFile, profile.avatar_url])
  const bannerPreview = useMemo(() => (bannerFile ? URL.createObjectURL(bannerFile) : profile.banner_url), [bannerFile, profile.banner_url])

  if (!open) return null

  const save = async () => {
    if (!user) return
    setSaving(true)
    try {
      let avatar_url = profile.avatar_url || null
      let banner_url = profile.banner_url || null

      if (avatarFile) {
        try { avatar_url = await uploadAvatar(user.id, avatarFile) } catch (e) { console.warn('Avatar upload failed. Create public bucket "avatars".', e) }
      }
      if (bannerFile) {
        try { banner_url = await uploadBanner(user.id, bannerFile) } catch (e) { console.warn('Banner upload failed. Create public bucket "banners".', e) }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, bio, avatar_url, banner_url })
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
          <div>
            <div className="text-sm font-semibold mb-2">Banner</div>
            <div className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-hidden">
              {bannerPreview ? <img src={bannerPreview} className="h-full w-full object-cover" alt="banner" /> : null}
            </div>
            <input type="file" accept="image/*" className="mt-2 text-sm" onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Avatar</div>
            <div className="flex items-center gap-3">
              <img src={avatarPreview || 'https://via.placeholder.com/80'} className="h-16 w-16 rounded-full border border-slate-200 dark:border-slate-800 object-cover" alt="avatar" />
              <input type="file" accept="image/*" className="text-sm" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 outline-none resize-none"
              rows={3}
              placeholder="Tell people about you…"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
