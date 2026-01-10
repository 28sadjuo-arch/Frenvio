import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Helmet } from 'react-helmet-async'

const Auth: React.FC = () => {
  const navigate = useNavigate()
  const { user, signUp, signIn } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)

  const [identifier, setIdentifier] = useState('') // username for login
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  React.useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isSignUp) {
        const result = await signUp(password, username, fullName)
        if (!result.ok) {
          setError(result.error || 'Something went wrong.')
          return
        }
        // If signup succeeded but the project requires email confirmation / no immediate session,
        // switch to login and let the user sign in with username + password.
        if (result.error) {
          setIsSignUp(false)
          setIdentifier(username)
          setError(result.error)
          return
        }
      } else {
        const result = await signIn(identifier, password)
        if (!result.ok) {
          setError(result.error || 'Something went wrong.')
          return
        }
      }
      navigate('/dashboard')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="text-2xl font-extrabold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {isSignUp ? 'Join Frenvio in seconds.' : 'Log in to continue.'}
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          {isSignUp ? (
            <>
              <div>
                <label className="text-sm font-semibold">Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                  placeholder="username"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm font-semibold">Username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2"
                placeholder="username"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold">Password</label>
            <div className="mt-1 relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 transition disabled:opacity-60"
          >
            {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Log in'}
          </button>

          {isSignUp ? (
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                Terms
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>
                Privacy Policy
              </Link>
              .
            </div>
          ) : null}

          <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignUp((v) => !v)}
              className="font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="px-6 pb-6 text-xs text-slate-500">
          <Link to="/" className="hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}

export default Auth