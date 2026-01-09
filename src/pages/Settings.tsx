import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [reason, setReason] = useState('')
  const [daddySadju, setDaddySadju] = useState('Yes')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!user) return
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .maybeSingle()
      setDisplayName((p as any)?.full_name || (p as any)?.username || '')
    })()
  }, [user?.id])

  const submit = async () => {
    if (!user) return
    setLoading(true)
    setStatus(null)
    try {
      // Flexible insert: will work even if extra columns don't exist (we'll retry)
      const payload: any = {
        user_id: user.id,
        full_name: displayName || null,
        reason: reason || null,
        extra_question: 'Do you like Daddy Sadju?',
        extra_answer: daddySadju,
        status: 'pending',
      }

      let { error } = await supabase.from('verification_requests').insert(payload)
      if (error && String(error.message || '').includes('extra_')) {
        // Fallback for DBs without extra columns
        const minimal: any = {
          user_id: user.id,
          full_name: displayName || null,
          reason: `Do you like Daddy Sadju? ${daddySadju}\n\n${reason || ''}`.trim(),
          status: 'pending',
        }
        ;({ error } = await supabase.from('verification_requests').insert(minimal))
      }
      if (error) throw error

      setStatus('Request submitted! We will review it soon.')
      setReason('')
    } catch (e: any) {
      setStatus(e?.message || 'Could not submit request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-extrabold mb-4">Settings</h1>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="font-bold mb-2">Request verification</div>
        <div className="text-sm text-slate-500 mb-4">
          Fill this form and submit. New accounts are not verified until approved.
        </div>

        <label className="block text-sm font-semibold mb-1">Display name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full mb-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
          placeholder="Your name"
        />

        <label className="block text-sm font-semibold mb-1">Do you like Daddy Sadju?</label>
        <select
          value={daddySadju}
          onChange={(e) => setDaddySadju(e.target.value)}
          className="w-full mb-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
        >
          <option>Yes</option>
          <option>No</option>
          <option>Not sure</option>
        </select>

        <label className="block text-sm font-semibold mb-1">Why should you be verified?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={5}
          className="w-full mb-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
          placeholder="Tell us about your account..."
        />

        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Submitting…' : 'Submit request'}
        </button>

        {status ? <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{status}</div> : null}
      </div>
    </div>
  )
}
