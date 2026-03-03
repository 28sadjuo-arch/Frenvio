import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const TopNav: React.FC = () => {
  const { pathname, search } = useLocation()
  const { user, profile } = useAuth()
  const to = user ? '/dashboard' : '/'

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 pt-[env(safe-area-inset-top)] ${
        (pathname === '/chat' && /[?&](to|room|group)=/.test(search)) ? 'hidden md:block' : ''
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to={to} className="text-lg font-extrabold tracking-tight">
          Frenvio
        </Link>

        {!user && (
          <div className="hidden sm:flex items-center gap-4 text-sm font-semibold">
            <Link to="/auth" className={`hover:underline ${pathname.startsWith('/auth') ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              Log in
            </Link>
            <Link to="/auth" className="px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              Sign up
            </Link>
            <Link to="/about" className={`hover:underline ${pathname.startsWith('/about') ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              About
            </Link>
            <Link to="/terms" className={`hover:underline ${pathname.startsWith('/terms') ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              Terms
            </Link>
            <Link to="/privacy" className={`hover:underline ${pathname.startsWith('/privacy') ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              Privacy
            </Link>
          </div>
        )}

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
      </div>
    </nav>
  )
}

export default TopNav
