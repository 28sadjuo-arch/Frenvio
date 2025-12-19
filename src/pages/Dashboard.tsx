import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Heart, Search, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, type Profile, type Friendship } from '../lib/supabase';
import { ThreeDBackground } from '../components/ThreeDBackground';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'chat' | 'friends' | 'discover'>('discover');
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [profilesRes, friendshipsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .neq('id', user.id)
            .limit(20),
          supabase
            .from('friendships')
            .select('*')
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`),
        ]);

        if (profilesRes.data) setAllProfiles(profilesRes.data);
        if (friendshipsRes.data) setFriendships(friendshipsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel(`profiles:${user?.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleAddFriend = async (friendId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });
      if (error) throw error;
      setFriendships([
        ...friendships,
        {
          id: Math.random().toString(),
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isFriend = (profileId: string) =>
    friendships.some(
      (f) =>
        (f.user_id === user?.id && f.friend_id === profileId) ||
        (f.friend_id === user?.id && f.user_id === profileId)
    );

  const filteredProfiles = allProfiles.filter(
    (p) =>
      !isFriend(p.id) &&
      (p.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const friends = allProfiles.filter((p) => isFriend(p.id));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ThreeDBackground />

      <div className="relative z-10 flex flex-col lg:flex-row h-screen">
        <aside className="w-full lg:w-64 bg-white dark:bg-slate-800 border-b lg:border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">SocialHub</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </motion.div>

          <div className="flex-1 space-y-2 mb-6">
            {[
              { id: 'discover', icon: Users, label: 'Discover' },
              { id: 'friends', icon: Heart, label: 'Friends' },
              { id: 'chat', icon: MessageCircle, label: 'Messages' },
            ].map(({ id, icon: Icon, label }) => (
              <motion.button
                key={id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
              <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                {profile?.display_name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                @{profile?.username}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          {activeTab === 'discover' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700">
                <Search size={20} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 outline-none bg-transparent text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  Loading profiles...
                </div>
              ) : filteredProfiles.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProfiles.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3"
                          style={{ backgroundColor: p.avatar_color }}
                        >
                          {p.display_name.charAt(0)}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{p.display_name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">@{p.username}</p>
                        {p.location && (
                          <p className="text-xs text-slate-500 mt-1">{p.location}</p>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-4">
                          {p.bio || 'No bio yet'}
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddFriend(p.id)}
                          className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-shadow"
                        >
                          Add Friend
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  No users found matching your search
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'friends' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Friends</h2>
              {friends.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friends.map((friend, idx) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                          style={{ backgroundColor: friend.avatar_color }}
                        >
                          {friend.display_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {friend.display_name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                            @{friend.username}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${friend.online_status ? 'bg-green-500' : 'bg-slate-300'}`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                  No friends yet. Start discovering!
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 text-slate-400" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Coming Soon
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Real-time chat is being powered up!
                </p>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
