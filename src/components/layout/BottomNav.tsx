import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, MessageCircle, Bell, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const BottomNav: React.FC = () => {
  const { user } = useAuth()
  if (!user) return null
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t md:hidden flex justify-around items-center p-2">
      <Link to="/dashboard"><Home size={24} /></Link>
      <Link to="/search"><Search size={24} /></Link>
      <Link to="/chat"><MessageCircle size={24} /></Link>
      <Link to="/notifications"><Bell size={24} /></Link>
      <Link to={`/profile/${user.id}`}><User size={24} /></Link>
    </nav>
  )
}

export default BottomNav