import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, MessageCircle, Share2, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Home: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="w-full">
      <Helmet>
        <title>Frenvio — Share, chat, and connect</title>
        <meta name="description" content="Welcome to Frenvio — where friends share, chat, and connect." />
      </Helmet>

      {/* Hero */}
      <section className="w-full bg-gradient-to-b from-[#0B1B4A] to-[#102B7A] text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Welcome to Frenvio
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/85">
              Where friends share, chat, and connect with the people that matter.
            </p>

            <div className="mt-6">
              <div className="font-bold">Sadjuo</div>
              <div className="text-sm text-white/80">Founder &amp; CEO, Frenvio</div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to={user ? '/dashboard' : '/auth'}
                className="inline-flex items-center justify-center rounded-full bg-white text-[#0B1B4A] font-extrabold px-6 py-3 hover:bg-white/90"
              >
                Get started
              </Link>
              <a
                href="#why"
                className="inline-flex items-center justify-center rounded-full border border-white/40 text-white font-semibold px-6 py-3 hover:bg-white/10"
              >
                Why Frenvio
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Frenvio */}
      <section id="why" className="w-full bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-14">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Why Frenvio
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              { icon: <Users className="h-5 w-5" />, title: 'Follow', desc: 'Find people you care about and build your circle.' },
              { icon: <MessageCircle className="h-5 w-5" />, title: 'Chat', desc: 'Message fast with a clean, modern inbox.' },
              { icon: <Share2 className="h-5 w-5" />, title: 'Share', desc: 'Post thoughts, photos, and moments that matter.' },
              { icon: <Send className="h-5 w-5" />, title: 'Connect', desc: 'Join communities and feel closer every day.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/30">
                <div className="h-10 w-10 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  {f.icon}
                </div>
                <div className="mt-3 font-extrabold text-slate-900 dark:text-slate-100">{f.title}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ + Footer */}
      <section className="w-full bg-[#0B1B4A] text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-14">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-extrabold">FAQ</h3>
              <div className="mt-4 space-y-4 text-white/85">
                <div>
                  <div className="font-bold text-white">Who is behind Frenvio?</div>
                  <div className="text-sm">
                    Frenvio is built by <span className="font-semibold">Sadjuo</span> (Founder &amp; CEO) and{' '}
                    <span className="font-semibold">Ines Olga</span> (Co‑Founder).
                  </div>
                </div>
                <div>
                  <div className="font-bold text-white">Is Frenvio free?</div>
                  <div className="text-sm">Yes — Frenvio is free to use. We’re focused on building a great community first.</div>
                </div>
                <div>
                  <div className="font-bold text-white">How do I get verified?</div>
                  <div className="text-sm">Go to Settings → Request verification. Our team will review your request.</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-extrabold">Quick links</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Link to="/about" className="hover:underline">About</Link>
                <Link to="/privacy" className="hover:underline">Privacy</Link>
                <Link to="/terms" className="hover:underline">Terms</Link>
                <Link to="/contact" className="hover:underline">Contact</Link>
                <a href="#why" className="hover:underline">Learn more</a>
              </div>

              <h3 className="mt-8 text-xl font-extrabold">Follow us</h3>
              <div className="mt-4 flex items-center gap-3 text-sm">
                <a className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 hover:bg-white/10" href="#" aria-label="Telegram">
                  <span className="font-semibold">Telegram</span>
                </a>
                <a className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 hover:bg-white/10" href="#" aria-label="Instagram">
                  <span className="font-semibold">Instagram</span>
                </a>
                <a className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 hover:bg-white/10" href="#" aria-label="X">
                  <span className="font-semibold">X</span>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/15 pt-6 text-sm text-white/70 flex flex-col sm:flex-row gap-2 justify-between">
            <div>© 2026 Frenvio. All rights reserved.</div>
            <div className="text-white/70">Built for real connections.</div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
