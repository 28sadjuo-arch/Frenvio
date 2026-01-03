import { supabase } from './supabase'

async function uploadTo(bucket: string, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split('.').pop() || 'jpg'
  return uploadTo('avatars', `${userId}/avatar.${ext}`, file)
}

export async function uploadBanner(userId: string, file: File) {
  const ext = file.name.split('.').pop() || 'jpg'
  return uploadTo('banners', `${userId}/banner.${ext}`, file)
}
