import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const Item = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const { pathname } = useLocation()
  const active = pathname === to || (to !== '/' && pathname.startsWith(to))
  return (
    <Link
      to={to}
      className={`flex-1 flex justify-center py-2 ${active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
    >
      {children}
    </Link>
  )
}

const BottomNav: React.FC = () => {
  const { user } = useAuth()
  if (!user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur md:hidden">
      <div className="mx-auto max-w-3xl px-2 flex items-center">
        <Item to="/dashboard"><Home size={22} /></Item>
        <Item to="/search"><Search size={22} /></Item>
        <Item to="/chat"><MessageCircle size={22} /></Item>
        <Item to="/notifications"><Bell size={22} /></Item>
        <Item to={`/profile/${user.id}`}><User size={22} /></Item>
      </div>
    </nav>
  )
}

export default BottomNav
