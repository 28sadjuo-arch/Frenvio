import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Auth: React.FC = () => {
  const navigate = useNavigate()
  const { user, signUp, signIn } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/dashboard')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = isSignUp ? await signUp(email, password, username) : await signIn(email, password)

    setLoading(false)
    if (!result.ok) {
      setError(result.error || 'Something went wrong.')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {isSignUp ? 'Join the conversation on Frenvio.' : 'Sign in to continue.'}
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          {isSignUp && (
            <div>
              <label className="text-sm font-semibold">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g. sadjuo"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="you@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="••••••••"
              required
            />
          </div>

          {isSignUp && (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="underline underline-offset-2">Terms of Service</Link> and{' '}
              <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 transition disabled:opacity-60"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-slate-600 dark:text-slate-300">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="font-semibold text-blue-600 hover:underline">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
