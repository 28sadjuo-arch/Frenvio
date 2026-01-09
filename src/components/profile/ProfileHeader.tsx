import React from 'react'
import { Profile } from '../../lib/supabase'
import { Shield } from 'lucide-react'

interface ProfileHeaderProps {
  profile: Profile
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg mb-4 flex items-center space-x-4">
    <img src="https://via.placeholder.com/64" alt="Profile" className="rounded-full w-16 h-16" />
    <div>
      <h1 className="text-xl font-bold">{profile.username}</h1>
      {profile.verified && <Shield className="h-4 w-4 text-blue-500 inline" />}
      <p className="text-gray-500">{profile.bio}</p>
      <p className="text-sm">Followers: {profile.followers_count} | Following: {profile.following_count}</p>
    </div>
  </div>
)

export default ProfileHeader