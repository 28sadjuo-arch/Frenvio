import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, MessageCircle, Share2, Send, ChevronDown, Instagram, Twitter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type FaqItem = { q: string; a: string }

const faqs: FaqItem[] = [
  { q: 'Who is behind Frenvio?', a: 'Frenvio Founded & Owned by Amahoro Sadju' },
  { q: 'Is Frenvio free?', a: 'Yes — Frenvio is free to use. We’re focused on building a great community first.' },
  { q: 'How do I get verified?', a: 'Go to Settings → Request verification. Our team will review your request.' },
  { q: 'Can I share Anything on Frenvio?', a: 'Yes. Frenvio is Freespeech platform.' },
  { q: 'Is Frenvio available on all devices?', a: 'Yes. Frenvio is designed to work smoothly on phones, tablets, and desktop.' },
]

const Home: React.FC = () => {
  const { user } = useAuth()
  const [open, setOpen] = useState<number | null>(0)

  const goTo = user ? '/dashboard' : '/auth'

  return (
    <div className="w-full">
      <Helmet>
        <title>Frenvio — Share, chat, and connect</title>
        <meta name="description" content="Welcome to Frenvio — where friends share, chat, and connect." />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Frenvio',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://frenvio.com',
            description: 'Frenvio is a social platform for sharing posts, chatting, and connecting with friends.',
            publisher: {
              '@type': 'Organization',
              name: 'Frenvio',
              founder: {
                '@type': 'Person',
                name: 'Amahoro Sadju',
              },
            },
          })}
        </script>
      </Helmet>

      {/* HERO */}
      <section className="w-full bg-gradient-to-b from-white via-white to-white text-slate-900 dark:from-[#071339] dark:via-[#0B1B4A] dark:to-[#0B1B4A] dark:text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Welcome to Frenvio
            </h1>
            <p className="mt-4 text-2xl sm:text-3xl font-extrabold leading-snug">
              Where friends <span className="text-blue-600 dark:text-white">share</span>, <span className="text-blue-600 dark:text-white">chat</span>, and <span className="text-blue-600 dark:text-white">connect</span>.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={user ? '/dashboard' : '/auth'}
                className="px-6 py-3 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold hover:opacity-90 transition"
              >
                Get started
              </Link>
            </div>

            <div className="mt-12">
              <div className="text-lg sm:text-xl font-extrabold tracking-tight">Why Frenvio</div>
              <div className="mt-4 rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-white/10 backdrop-blur p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900/5 dark:bg-white/10 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold">Follow</div>
                      <div className="text-sm text-slate-600 dark:text-white/80">Find people you care about and build your circle.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900/5 dark:bg-white/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold">Chat</div>
                      <div className="text-sm text-slate-600 dark:text-white/80">A clean, modern inbox for messages and groups.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900/5 dark:bg-white/10 flex items-center justify-center">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold">Share</div>
                      <div className="text-sm text-slate-600 dark:text-white/80">Post thoughts, photos, and moments that matter.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-900/5 dark:bg-white/10 flex items-center justify-center">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-extrabold">Connect</div>
                      <div className="text-sm text-slate-600 dark:text-white/80">Stay closer to your friends — every day.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ (accordion) */}
      <section className="w-full bg-slate-100 text-slate-900 dark:bg-[#0B1B4A] dark:text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold">FAQ</h2>

            <div className="mt-5 divide-y divide-white/10">
              {faqs.map((item, i) => {
                const isOpen = open === i
                return (
                  <button
                    key={item.q}
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full text-left py-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold">{item.q}</div>
                      {isOpen && <div className="mt-2 text-sm text-slate-600 dark:text-white/80">{item.a}</div>}
                    </div>
                    <ChevronDown className={`h-5 w-5 mt-0.5 shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section className="w-full bg-slate-100 text-slate-900 dark:bg-[#0B1B4A] dark:text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-14">
          <div className="rounded-3xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur p-6 sm:p-8">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-extrabold">Quick links</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700 dark:text-white/85">
                  <Link className="hover:text-slate-900 dark:hover:text-white" to="/about">About</Link>
                  <Link className="hover:text-slate-900 dark:hover:text-white" to="/privacy">Privacy</Link>
                  <Link className="hover:text-slate-900 dark:hover:text-white" to="/terms">Terms</Link>
                  <Link className="hover:text-slate-900 dark:hover:text-white" to="/contact">Contact</Link>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold">Follow us</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="https://t.me/frenvio" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Telegram @frenvio" title="Telegram @frenvio">
                    <Send className="h-5 w-5" />
                  </a>

                  <a href="https://instagram.com/frenvio" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Instagram @frenvio" title="Instagram @frenvio">
                    <Instagram className="h-5 w-5" />
                  </a>

                  <a href="https://x.com/frenviox" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="X @frenviox" title="X @frenviox">
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 dark:border-white/15 pt-6 text-sm text-slate-600 dark:text-white/70">
              © 2026 Frenvio. All rights reserved.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
