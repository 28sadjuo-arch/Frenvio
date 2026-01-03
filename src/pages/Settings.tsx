import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ShieldCheck, Trash2, Mail, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
    <div className="font-extrabold">{title}</div>
    <div className="mt-3">{children}</div>
  </div>
)

const Settings: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [busy, setBusy] = useState(false)

  const requestVerification = async () => {
    if (!user) return
    setBusy(true)
    try {
      // Optional: flag on profile
      await supabase.from('profiles').update({ verification_requested: true }).eq('id', user.id)
      // Optional: table
      try { await supabase.from('verification_requests').insert({ user_id: user.id }) } catch {}
      // Email support (works after function deploy)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: import.meta.env.VITE_SUPPORT_EMAIL || 'support@frenvio.app',
            subject: 'Verification request',
            body: `User ${profile?.username || user.email || user.id} requested verification.`,
          },
        })
      } catch {}
      alert('Verification request sent! We will review it.')
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
      // Optional: table
      try { await supabase.from('account_deletion_requests').insert({ user_id: user.id }) } catch {}
      // Email support (works after function deploy)
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            to: import.meta.env.VITE_SUPPORT_EMAIL || 'support@frenvio.app',
            subject: 'Account deletion request',
            body: `User ${profile?.username || user.email || user.id} requested account deletion.`,
          },
        })
      } catch {}
      alert('Deletion request sent. Support will contact you.')
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
              Request a verified badge. We review accounts manually to keep it fair.
            </div>
            <button
              disabled={busy || !!profile?.verified}
              onClick={requestVerification}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60"
            >
              {profile?.verified ? 'You are verified' : 'Request verification'}
            </button>
          </div>
        </div>
      </Card>

      <Card title="Account">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-slate-600 mt-0.5" />
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

        <p className="mt-3 text-xs text-slate-500">
          Full deletion of an auth user requires a server/admin action. This button sends a request to support.
        </p>
      </Card>
    </div>
  )
}

export default Settings
