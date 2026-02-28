import { supabase } from './supabase'

const FRENVI0_AI_USERNAME = 'frenvioai'

export async function getFrenvioAiUserId(): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', FRENVI0_AI_USERNAME)
      .maybeSingle()
    return (data as any)?.id || null
  } catch {
    return null
  }
}

export function textMentionsFrenvioAi(text: string) {
  return /(^|\s)@frenvioai\b/i.test(text || '')
}

export async function askFrenvioAi(message: string, history?: { role: 'user' | 'assistant'; content: string }[]) {
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: history || [] }),
  })
  const data = await r.json().catch(() => null)
  return String(data?.reply || '').trim()
}
