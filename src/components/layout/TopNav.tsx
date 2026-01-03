import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, MessageCircle, Search, Settings, ShieldCheck } from 'lucide-react'
import ThemeToggle from '../common/ThemeToggle'
import { useAuth } from '../../contexts/AuthContext'

const TopNav: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
        <Link to={user ? '/dashboard' : '/'} className="text-lg font-extrabold tracking-tight">
          Frenvio
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => navigate('/search')}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Messages"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/notifications')}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {profile?.verified && (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                  aria-label="Admin"
                >
                  <ShieldCheck className="h-5 w-5" />
                </Link>
              )}

              <Link
                to={`/profile/${user.id}`}
                className="px-3 py-2 rounded-full text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                {profile?.username || 'Profile'}
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
                className="text-sm font-semibold px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-sm font-semibold px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
              Sign in
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

export default TopNav
