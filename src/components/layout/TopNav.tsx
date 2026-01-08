import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '../common/ThemeToggle'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const TopNav: React.FC = () => {
  const { pathname, search } = useLocation()
  const { user, profile } = useAuth()
  const to = user ? '/dashboard' : '/'

  // Home should be super minimal (no Sign in button)
  const hideOnMobile = pathname === '/chat'

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur ${
        (pathname === '/chat' && /[?&](to|room|group)=/.test(search)) ? 'hidden md:block' : ''
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to={to} className="text-lg font-extrabold tracking-tight">
          Frenvio
        </Link>

        
        {user && (
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
            <Link to="/dashboard" className={`flex items-center gap-2 ${pathname.startsWith('/dashboard') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
              <Home size={18} /> Dashboard
            </Link>
            <Link to="/search" className={`flex items-center gap-2 ${pathname.startsWith('/search') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
              <Search size={18} /> Search
            </Link>
            <Link to="/chat" className={`flex items-center gap-2 ${pathname.startsWith('/chat') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
              <MessageCircle size={18} /> Chat
            </Link>
            <Link to="/notifications" className={`flex items-center gap-2 ${pathname.startsWith('/notifications') ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
              <Bell size={18} /> Notifications
            </Link>
            <Link to={profile?.username ? `/${profile.username}` : `/profile/${user.id}`} className={`flex items-center gap-2 ${pathname.startsWith('/profile') || (profile?.username && pathname === `/${profile.username}`) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
              <User size={18} /> Profile
            </Link>
          </div>
        )}

        <ThemeToggle />
      </div>
    </nav>
  )
}

export default TopNav
