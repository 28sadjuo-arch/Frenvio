import { supabase } from './supabase'

export async function uploadPostImage(file: File, userId: string) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('post-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}
