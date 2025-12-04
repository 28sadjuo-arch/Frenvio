import React from 'react'
import { Profile } from '../../lib/supabase'
import { Shield, MapPin, Heart, Repeat2, MessageCircle } from 'lucide-react'

interface ProfileHeaderProps {
  profile: Profile
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg mb-4 overflow-hidden">
    <div className="h-32 bg-gradient-to-r from-blue-400 to-blue-600"></div>

    <div className="px-6 pb-6">
      <div className="flex justify-between items-start -mt-16 mb-4">
        <img
          src="https://via.placeholder.com/120"
          alt="Profile"
          className="rounded-full w-32 h-32 border-4 border-white dark:border-gray-800"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{profile.username}</h1>
          {profile.verified && <Shield className="h-5 w-5 text-blue-500" />}
        </div>
        <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
      </div>

      {profile.bio && <p className="text-gray-700 dark:text-gray-300 mb-3">{profile.bio}</p>}

      {profile.location && (
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{profile.location}</span>
        </div>
      )}

      <div className="flex gap-6 mb-4 text-sm">
        <div>
          <span className="font-bold text-gray-900 dark:text-white">{profile.following_count}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">Following</span>
        </div>
        <div>
          <span className="font-bold text-gray-900 dark:text-white">{profile.followers_count}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
        </div>
      </div>

      <div className="flex gap-4 text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button className="flex items-center gap-2 hover:text-red-500 transition">
          <Heart className="h-5 w-5" />
          <span className="text-sm">Likes</span>
        </button>
        <button className="flex items-center gap-2 hover:text-green-500 transition">
          <Repeat2 className="h-5 w-5" />
          <span className="text-sm">Reposts</span>
        </button>
        <button className="flex items-center gap-2 hover:text-blue-500 transition">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm">Comments</span>
        </button>
      </div>
    </div>
  </div>
)

export default ProfileHeader