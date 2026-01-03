import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'

const Contact: React.FC = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: import.meta.env.VITE_SUPPORT_EMAIL || 'support@frenvio.app',
          subject: 'Contact form message',
          body: `From: ${email}\n\n${message}`,
        },
      })
      setEmail('')
      setMessage('')
      alert('Sent! We will reply soon.')
    } catch (e) {
      console.error(e)
      alert('Could not send message. Make sure your email function is deployed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Helmet>
        <title>Contact — Frenvio</title>
      </Helmet>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Contact us</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Have feedback or need help? Send us a message.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm font-semibold">Your email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 outline-none"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 outline-none resize-none"
              placeholder="How can we help?"
            />
          </div>

          <button
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Contact
