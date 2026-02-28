import { supabase } from '../lib/supabase'

const LS_KEY = 'frenvio:pinned_posts'

function getLocalPins(userId: string): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const obj = raw ? JSON.parse(raw) : {}
    const arr = Array.isArray(obj?.[userId]) ? obj[userId] : []
    return arr.filter((x: any) => typeof x === 'string')
  } catch {
    return []
  }
}

function setLocalPins(userId: string, pins: string[]) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const obj = raw ? JSON.parse(raw) : {}
    obj[userId] = pins
    localStorage.setItem(LS_KEY, JSON.stringify(obj))
  } catch {
    // ignore
  }
}

export async function getPinnedPostIds(userId: string): Promise<string[]> {
  // Prefer server-side pins if the column exists; otherwise use local fallback.
  try {
    const { data, error } = await supabase.from('profiles').select('pinned_post_ids').eq('id', userId).maybeSingle()
    if (!error) {
      const arr = (data as any)?.pinned_post_ids
      if (Array.isArray(arr)) return arr.filter((x: any) => typeof x === 'string')
    }
  } catch {
    // ignore
  }
  return getLocalPins(userId)
}

export async function togglePin(userId: string, postId: string): Promise<string[]> {
  const current = await getPinnedPostIds(userId)
  const exists = current.includes(postId)
  let next = exists ? current.filter((x) => x !== postId) : [postId, ...current]
  next = next.slice(0, 2) // max 2

  // Try server update first; if column doesn't exist, fallback to local.
  try {
    const { error } = await supabase.from('profiles').update({ pinned_post_ids: next as any }).eq('id', userId)
    if (!error) return next
  } catch {
    // ignore
  }

  setLocalPins(userId, next)
  return next
}
