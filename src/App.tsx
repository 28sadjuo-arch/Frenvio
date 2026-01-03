import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

import TopNav from './components/layout/TopNav'
import BottomNav from './components/layout/BottomNav'
import LoadingSpinner from './components/common/LoadingSpinner'

import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Chat from './pages/Chat'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Admin from './pages/Admin'
import About from './pages/About'
import Blog from './pages/Blog'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  // NOTE: true admin control should be handled with Supabase RLS/roles.
  return profile?.verified ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AppShell() {
  const { theme } = useTheme()
  const { user } = useAuth()

  return (
    <div className={`${theme} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors`}>
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-24 md:pb-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {user && <BottomNav />}
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <HelmetProvider>
            <Router>
              <AppShell />
            </Router>
          </HelmetProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
