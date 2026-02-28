import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Trash2, User, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
    <div className="font-extrabold">{title}</div>
    <div className="mt-3">{children}</div>
  </div>
)

const Settings: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [busy, setBusy] = useState(false)

  const [fullName, setFullName] = useState(profile?.display_name || '')
  const [why, setWhy] = useState('')
  const [daddy, setDaddy] = useState<'yes' | 'no' | ''>('')

  const requestVerification = async () => {
    if (!user) return
    if (!fullName.trim() || !why.trim() || !daddy) {
      alert('Please fill the verification form.')
      return
    }

    setBusy(true)
    try {
      await supabase.from('profiles').update({ verification_requested: true }).eq('id', user.id)

      // Keep insert minimal to avoid “column not found” errors
      try { await supabase.from('verification_requests').insert({ user_id: user.id }) } catch {}

      // If you have an edge function, send full details there
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: import.meta.env.VITE_SUPPORT_EMAIL || 'support@frenvio.app',
            subject: 'Verification request',
            body:
              `User: ${profile?.username || user.email || user.id}\n` +
              `Full name: ${fullName}\n` +
              `Why: ${why}\n` +
              `Do you like Daddy Sadju?: ${daddy}\n`,
          },
        })
      } catch {}

      alert('Verification request sent! Daddy Sadju will review it.')
      await refreshProfile()
    } catch (e) {
      console.error(e)
      alert('Could not send verification request.')
    } finally {
      setBusy(false)
    }
  }

  const requestDeletion = async () => {
    if (!user) return
    const ok = confirm('This will request account deletion. Continue?')
    if (!ok) return
    setBusy(true)
    try {
      try { await supabase.from('account_deletion_requests').insert({ user_id: user.id }) } catch {}
      alert('Deletion request sent.')
    } catch (e) {
      console.error(e)
      alert('Could not send deletion request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold tracking-tight">Settings</h1>

      <Card title="Verification">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Request a verified badge. Our team will review accounts manually.
            </div>

            <div className="mt-4 space-y-2">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm"
              />

              <textarea
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Why should we verify you?"
                className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm"
              />

              <div className="text-sm font-semibold">Do you like Daddy Sadju?</div>
              <select
                value={daddy}
                onChange={(e) => setDaddy(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Select…</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>

              <button
                disabled={busy || !!profile?.verified}
                onClick={requestVerification}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
              >
                {profile?.verified ? 'You are verified' : 'Submit verification request'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Appearance">
        <div className="text-sm text-slate-600 dark:text-slate-300">Switch between Light and Dark mode.</div>
        <div className="mt-3">
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
          >
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </Card>

      <Card title="Account">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-slate-600 mt-0.5" />
          <div className="flex-1 text-sm text-slate-600 dark:text-slate-300">
            Logged in as <span className="font-semibold">{profile?.username || user?.email}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>

          <button
            disabled={busy}
            onClick={requestDeletion}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Request account deletion
          </button>
        </div>
      </Card>
    </div>
  )
}

export default Settings
