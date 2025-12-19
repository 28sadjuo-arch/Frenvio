import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, MessageCircle, Sparkles, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, type Review, type Profile } from '../lib/supabase';
import { ThreeDBackground } from '../components/ThreeDBackground';

export function Home() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [reviews, setReviews] = useState<(Review & { author: Profile })[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select(`
            *,
            author:profiles(*)
          `)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        setReviews(data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ThreeDBackground />

      <div className="relative z-10">
        <nav className="backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 sticky top-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">SocialHub</span>
              </motion.div>

              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Features
                </a>
                <a href="#reviews" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Reviews
                </a>
                <a href="#about" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                  About
                </a>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  {theme === 'light' ? (
                    <Moon size={20} className="text-slate-600 dark:text-slate-300" />
                  ) : (
                    <Sun size={20} className="text-slate-600 dark:text-slate-300" />
                  )}
                </button>

                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="hidden sm:px-4 sm:py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-semibold"
                  >
                    Sign Out
                  </button>
                ) : null}

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block mb-6 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-2">
                <Sparkles size={16} />
                Next-Generation Social Hub
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Connect in a
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                Whole New Way
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
              Experience immersive social connections with stunning 3D visuals, real-time chat, and AI-powered friend discovery.
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.hash = '#auth'}
                  className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-shadow"
                >
                  Get Started
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Learn More
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.hash = '#chat'}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-shadow"
              >
                Go to Dashboard
              </motion.button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            id="features"
            className="grid md:grid-cols-3 gap-8 mb-20"
          >
            <div className="p-6 rounded-xl bg-white dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700">
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Friend Discovery</h3>
              <p className="text-slate-600 dark:text-slate-400">AI-powered recommendations based on interests and location</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700">
              <MessageCircle className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Real-time Chat</h3>
              <p className="text-slate-600 dark:text-slate-400">Encrypted messaging with end-to-end security</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">3D Immersion</h3>
              <p className="text-slate-600 dark:text-slate-400">Stunning visual experience with interactive backgrounds</p>
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            id="reviews"
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">What Users Say</h2>
              <p className="text-slate-600 dark:text-slate-300">Join thousands of users loving SocialHub</p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-slate-600 dark:text-slate-300">Loading reviews...</div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="p-6 rounded-xl bg-white dark:bg-slate-800/50 backdrop-blur border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: review.author?.avatar_color || '#3B82F6' }}
                      >
                        {review.author?.display_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{review.author?.display_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">@{review.author?.username}</p>
                      </div>
                    </div>

                    {review.image_url && (
                      <img
                        src={review.image_url}
                        alt={review.title}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}

                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">{review.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{review.content}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-600 dark:text-slate-400">
                No reviews yet. Be the first to share your experience!
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            id="about"
            className="mb-20 text-center"
          >
            <div className="inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden mb-4 mx-auto">
                <div className="text-3xl">👤</div>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Meet Our Founder & CEO</h2>
            <div className="max-w-2xl mx-auto">
              <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">AMAHORO SADJU</p>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Visionary founder and CEO of SocialHub, dedicated to revolutionizing how people connect online. With years of experience in social technology and immersive design, Amahoro is building the next generation of social platforms.
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm italic">
                "We believe social connections should be beautiful, secure, and meaningful."
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
