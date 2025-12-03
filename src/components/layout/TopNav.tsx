import React from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../common/ThemeToggle'
import { useAuth } from '../../contexts/AuthContext'
import { Shield } from 'lucide-react'

const TopNav: React.FC = () => {
  const { user, signOut } = useAuth()
  return (
    <nav className="bg-primary-900 text-white p-4 flex justify-between items-center hidden md:flex">
      <Link to="/" className="text-xl font-bold">FREVIO</Link>
      <div className="flex space-x-4">
        {user ? (
          <>
            <Link to="/dashboard">Home</Link>
            <Link to="/search">Search</Link>
            <Link to="/chat">Chat</Link>
            <Link to="/notifications">Notifs</Link>
            <Link to="/profile/{user.id}">Profile</Link>
            {user.verified && <Link to="/admin"><Shield /></Link>}
            <button onClick={signOut}>Logout</button>
          </>
        ) : (
          <Link to="/auth">Sign In</Link>
        )}
        <ThemeToggle />
      </div>
    </nav>
  )
}

export default TopNav