import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, MessageCircle, Share2, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-[80vh]">
      <Helmet>
        <title>Frenvio — Beautiful Social Connections</title>
        <meta name="description" content="Where friends share, chat, and connect. Join Frenvio today." />
      </Helmet>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Where friends share, chat, and connect.
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300 max-w-2xl">
          Frenvio is a modern social space — fast, simple, and built for real conversations.
        </p>

        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Sadjuo</div>
          <div>Founder &amp; CEO, Frenvio</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link to="/dashboard" className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/auth" className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              Join now
            </Link>
          )}
          <Link to="/about" className="px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold">
            Learn more
          </Link>
        </div>
      </section>

      <section className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <Users className="h-10 w-10 text-blue-600" />
          <h3 className="mt-4 text-lg font-extrabold">Find &amp; Follow</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Discover people and follow what matters to you.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <MessageCircle className="h-10 w-10 text-blue-600" />
          <h3 className="mt-4 text-lg font-extrabold">Messages</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Clean chat UI that feels like a real social app.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <Share2 className="h-10 w-10 text-blue-600" />
          <h3 className="mt-4 text-lg font-extrabold">Create &amp; Share</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Post updates with text and images.</p>
        </div>
      </section>

      <footer className="mt-10 pb-6 text-sm text-slate-600 dark:text-slate-300 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex gap-4">
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/contact" className="hover:underline">Contact</Link>
        </div>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert('Add your Telegram link in Home.tsx when you have it.') }}
          className="inline-flex items-center gap-2 hover:underline"
        >
          <Send className="h-4 w-4" />
          Telegram
        </a>
      </footer>
    </div>
  )
}

export default Home
