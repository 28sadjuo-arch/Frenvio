import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from '../common/ThemeToggle'
import { useAuth } from '../../contexts/AuthContext'

const TopNav: React.FC = () => {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const to = user ? '/dashboard' : '/'

  // Home should be super minimal (no Sign in button)
  const hideOnMobile = pathname === '/chat'

  return (
    <nav
      className={`sticky top-0 z-50 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur ${
        hideOnMobile ? 'hidden md:block' : ''
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to={to} className="text-lg font-extrabold tracking-tight">
          Frenvio
        </Link>

        <ThemeToggle />
      </div>
    </nav>
  )
}

export default TopNav
