import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, MessageCircle, Share2, Instagram, Twitter, MessageSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const { user } = useAuth()
  
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>FREVIO - Beautiful Social Connections</title>
        <meta name="description" content="Where friends share, chat, and connect. Join FRENVIO today." />
      </Helmet>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl font-bold mb-4">Welcome to FREVIO</h1>
          <p className="text-xl mb-2">Where friends share, chat, and connect</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
            <p className="text-lg opacity-90">"We believe social connections should be beautiful, secure, and meaningful."</p>
            <div className="text-right">
              <p className="font-semibold">— Amahoro Sadju</p>
              <p className="text-sm opacity-90">Founder & CEO</p>
            </div>
          </div>
          <Link to={user ? '/dashboard' : '/auth'} className="bg-white text-blue-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
            {user ? 'Go to Feed' : 'Get Started'}
          </Link>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why FREVIO?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Find & Follow</h3>
              <p>Discover new friends and follow their journeys.</p>
            </div>
            <div className="text-center">
              <MessageCircle className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Chat</h3>
              <p>and stay connected with your friends.</p>
            </div>
            <div className="text-center">
              <Share2 className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Share Moments</h3>
              <p>Share your thoughts with your friends.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <section className="bg-gray-100 dark:bg-gray-800 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 block">About</Link>
                <Link to="/blog" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 block">Blog</Link>
                <Link to="/privacy" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 block">Privacy</Link>
                <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 block">Terms & Conditions</Link>
              </div>
            </div>
            
            {/* Right: Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="https://instagram.com/frenvio" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-pink-600 transition">
                  <Instagram className="w-6 h-6" />
                </a>
                <a href="https://twitter.com/frenvio" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-blue-400 transition">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="https://discord.com/invite/yourserver" target="_blank" rel="noopener noreferrer" className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 transition">
                  <MessageSquare className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-300 dark:border-gray-700 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 FRENVIO. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
