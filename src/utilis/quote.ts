export function extractQuotePostId(text: string): string | null {
  const m = (text || '').match(/\[\[quote:([a-z0-9\-]{6,64})\]\]/i)
  return m ? m[1] : null
}

export function stripQuoteToken(text: string): string {
  return (text || '').replace(/\s*\[\[quote:[^\]]+\]\]\s*/gi, ' ').replace(/\s{2,}/g, ' ').trim()
}
