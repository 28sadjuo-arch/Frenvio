export type BadgeVariant = 'blue' | 'gold'

// Frenvio team accounts (gold badge).
// You can add/remove usernames here without changing the database.
export const TEAM_USERNAMES = new Set([
  'frenvio',
  'frenvioai',
  'sadju',
  'olga',
])

export function badgeVariantForProfile(p: any): BadgeVariant | null {
  const username = String(p?.username || '').toLowerCase()
  const explicit = String(p?.badge || '').toLowerCase()
  const isTeam = Boolean(p?.is_team || p?.team || TEAM_USERNAMES.has(username) || explicit === 'gold')
  if (isTeam) return 'gold'
  if (p?.verified || explicit === 'blue') return 'blue'
  return null
}
