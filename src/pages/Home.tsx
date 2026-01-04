import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, MessageCircle, Share2, Send, ChevronDown, Instagram, Twitter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type FaqItem = { q: string; a: string }

const faqs: FaqItem[] = [
  { q: 'Who is behind Frenvio?', a: 'Frenvio is built by Sadjuo (Founder & CEO) and Ines Olga (Co‑Founder).' },
  { q: 'Is Frenvio free?', a: 'Yes — Frenvio is free to use. We’re focused on building a great community first.' },
  { q: 'How do I get verified?', a: 'Go to Settings → Request verification. Our team will review your request.' },
  { q: 'Can I share photos and moments?', a: 'Yes. Frenvio supports image posts so you can share memories with your circle.' },
  { q: 'Is Frenvio available on mobile?', a: 'Yes. Frenvio is designed to work smoothly on phones, tablets, and desktop.' },
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
      </Helmet>

      {/* HERO */}
      <section className="w-full bg-gradient-to-b from-[#071339] via-[#0B1B4A] to-[#0B1B4A] text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Welcome to Frenvio
              </h1>
              <p className="mt-4 text-xl sm:text-2xl font-bold text-white/95 leading-snug">
                Where friends <span className="text-white">share</span>, <span className="text-white">chat</span>, and <span className="text-white">connect</span> with the people that matter.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={goTo}
                  className="inline-flex items-center justify-center rounded-full bg-white text-[#0B1B4A] px-6 py-3 font-extrabold hover:bg-white/90"
                >
                  Get started
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8">
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold">Follow</div>
                    <div className="text-white/80 text-sm">Find people you care about and build your circle.</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold">Chat</div>
                    <div className="text-white/80 text-sm">A clean, modern inbox for messages and groups.</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold">Share</div>
                    <div className="text-white/80 text-sm">Post thoughts, photos, and moments that matter.</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold">Connect</div>
                    <div className="text-white/80 text-sm">Stay closer to your friends — every day.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ (accordion) */}
      <section className="w-full bg-[#0B1B4A] text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8">
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
                      {isOpen && <div className="mt-2 text-sm text-white/80">{item.a}</div>}
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
      <section className="w-full bg-[#0B1B4A] text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-14">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-6 sm:p-8">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-extrabold">Quick links</h3>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/85">
                  <Link className="hover:text-white" to="/about">About</Link>
                  <Link className="hover:text-white" to="/privacy">Privacy</Link>
                  <Link className="hover:text-white" to="/terms">Terms</Link>
                  <Link className="hover:text-white" to="/contact">Contact</Link>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-extrabold">Follow us</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="https://t.me/frenvio" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Telegram @frenvio" title="Telegram @frenvio">
                    <Send className="h-5 w-5" />
                  </a>

                  <a href="https://instagram.com/frenvio" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Instagram @frenvio" title="Instagram @frenvio">
                    <Instagram className="h-5 w-5" />
                  </a>

                  <a href="https://x.com/frenviox" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 w-11 rounded-full border border-white/15 bg-white/5 hover:bg-white/10" aria-label="X @frenviox" title="X @frenviox">
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 border-t border-white/15 pt-6 text-sm text-white/70">
              © 2026 Frenvio. All rights reserved.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
