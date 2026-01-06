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


export async function uploadChatMedia(file: File, roomId: string) {
  const ext = file.name.split('.').pop() || 'bin'
  const safeRoom = roomId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const path = `${safeRoom}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('chat-media').getPublicUrl(path)
  return data.publicUrl
}
