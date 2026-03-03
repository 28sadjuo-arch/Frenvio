import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

const Dot = () => (
  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-950" />
)

const Item = ({
  to,
  children,
  badge,
  onClick,
}: {
  to: string
  children: React.ReactNode
  badge?: boolean
  onClick?: (e: React.MouseEvent) => void
}) => {
  const { pathname, search } = useLocation()
  const active = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex-1 flex justify-center py-2 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative inline-flex">
        {children}
        {badge ? <Dot /> : null}
      </span>
    </Link>
  )
}

const BottomNav: React.FC = () => {
  const { user, profile } = useAuth()
  const profileHref = profile?.username ? `/${profile.username}` : user ? `/profile/${user.id}` : '/auth'

  const { pathname } = useLocation()

  const { data: badges } = useQuery({
    queryKey: ['bottomnav-badges', user?.id],
    enabled: !!user,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!user) return { chat: false, notifications: false }

      // Notifications unread
      const { count: notifUnread } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      // DM unread (receiver and not read)
      const { count: dmUnread } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null)

      // Group unread (best-effort)
      let groupUnread = 0
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, last_read_at')
        .eq('user_id', user.id)

      if (memberships && memberships.length) {
        const counts = await Promise.all(
          memberships.map(async (m: any) => {
            const last = m.last_read_at || '1970-01-01T00:00:00.000Z'
            const { count } = await supabase
              .from('group_messages')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', m.group_id)
              .gt('created_at', last)
            return count || 0
          }),
        )
        groupUnread = counts.reduce((a, b) => a + b, 0)
      }

      return {
        notifications: (notifUnread || 0) > 0,
        chat: ((dmUnread || 0) + groupUnread) > 0,
      }
    },
  })

  // Hide on desktop
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur md:hidden">
      <div className="mx-auto max-w-3xl px-2 flex items-center">
        <Item
          to="/dashboard"
          onClick={(e) => {
            // If already on dashboard, behave like "scroll to top + refresh"
            if (pathname.startsWith('/dashboard')) {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
              window.dispatchEvent(new CustomEvent('dashboard-home'))
            }
          }}
        >
          <Home size={22} />
        </Item>
        <Item to="/search"><Search size={22} /></Item>
        <Item to="/chat" badge={!!badges?.chat}><MessageCircle size={22} /></Item>
        <Item to="/notifications" badge={!!badges?.notifications}><Bell size={22} /></Item>
        <Item to={profileHref}><User size={22} /></Item>
      </div>
    </nav>
  )
}

export default BottomNav
