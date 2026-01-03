import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Auth: React.FC = () => {
  const navigate = useNavigate()
  const { user, signUp, signIn } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [identifier, setIdentifier] = useState('') // email or username for login
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = isSignUp
      ? await signUp(email.trim(), password, username.trim(), fullName.trim())
      : await signIn(identifier.trim(), password)

    setLoading(false)

    if (!result.ok) {
      setError(result.error || 'Something went wrong.')
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="text-2xl font-extrabold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {isSignUp ? 'Join Frenvio in seconds.' : 'Log in to continue.'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSignUp ? (
            <>
              <div>
                <label className="text-sm font-semibold">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 outline-none text-slate-900 dark:text-slate-100"
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 outline-none text-slate-900 dark:text-slate-100"
                  placeholder="sadjuo"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 outline-none text-slate-900 dark:text-slate-100"
                  placeholder="you@example.com"
                  type="email"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm font-semibold">Email or username</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 outline-none text-slate-900 dark:text-slate-100"
                placeholder="you@example.com or sadjuo"
                required
              />
            </div>
          )}

          <div>
            <label className="text-sm font-semibold">Password</label>
            <div className="mt-1 flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent py-3 outline-none text-slate-900 dark:text-slate-100"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 transition disabled:opacity-60"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Get started' : 'Log in'}
          </button>

          {isSignUp && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              By signing up, you agree to our{' '}
              <Link to="/terms" className="underline">Terms</Link> and{' '}
              <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </div>
          )}

          <div className="text-sm text-slate-600 dark:text-slate-300">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsSignUp((v) => !v); setError(null) }}
              className="font-bold text-blue-600 hover:underline"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>

        <div className="px-6 pb-6 text-xs text-slate-500">
          <Link to="/" className="hover:underline">Back to home</Link>
        </div>
      </div>
    </div>
  )
}

export default Auth
