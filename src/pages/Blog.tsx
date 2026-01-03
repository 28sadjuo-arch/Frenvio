import React from 'react'
import { Helmet } from 'react-helmet-async'

const posts = [
  { title: 'Welcome to Frenvio', date: '2026-01-03', excerpt: 'We are building a cleaner social experience — with real conversations and modern design.' },
  { title: 'What’s coming next', date: '2026-01-03', excerpt: 'Media posts, better profiles, real notifications, and group chats.' },
]

const Blog: React.FC = () => (
  <div className="space-y-4">
    <Helmet>
      <title>Blog — Frenvio</title>
    </Helmet>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Blog</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">Updates from the Frenvio team.</p>

      <div className="mt-6 space-y-3">
        {posts.map((p) => (
          <div key={p.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="text-sm text-slate-500">{new Date(p.date).toLocaleDateString()}</div>
            <div className="mt-1 font-extrabold">{p.title}</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.excerpt}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default Blog
