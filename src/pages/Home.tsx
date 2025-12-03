import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, MessageCircle, Share2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const { user } = useAuth()
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>FREVIO - Beautiful Social Connections</title>
        <meta name="description" content="Where friends share, chat, and connect. Join FREVIO today." />
      </Helmet>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl font-bold mb-4">Welcome to FREVIO</h1>
          <p className="text-xl mb-2">Where friends share, chat, and connect</p>
          <p className="text-lg mb-8 opacity-90">We believe social connections should be beautiful, secure, and meaningful.</p>
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
              <h3 className="text-xl font-semibold mb-2">Realtime Chat</h3>
              <p>Chat with emojis, edit messages, and stay connected.</p>
            </div>
            <div className="text-center">
              <Share2 className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold mb-2">Share Moments</h3>
              <p>Post, like, repost, and mention friends effortlessly.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Founder */}
      <section className="bg-gray-100 dark:bg-gray-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Meet the Founder</h2>
          <p className="text-xl mb-8">Amahoro Sadju — Founder & CEO of FREVIO</p>
          <img src="https://via.placeholder.com/128?text=AS" alt="Amahoro Sadju" className="mx-auto rounded-full w-32 h-32 object-cover mb-4" />
          <p className="max-w-2xl mx-auto">Building a platform where connections matter. Join us in making social media meaningful again.</p>
        </div>
      </section>
    </div>
  )
}

export default Home
