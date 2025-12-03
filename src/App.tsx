import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { Helmet } from 'react-helmet-async'

import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Admin from './pages/Admin'
import About from './pages/About'
import Blog from './pages/Blog'
import Privacy from './pages/Privacy'
import Contact from './pages/Contact'

import TopNav from './components/layout/TopNav'
import BottomNav from './components/layout/BottomNav'
import LoadingSpinner from './components/common/LoadingSpinner'

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  if (!profile?.verified) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppContent() {
  const { theme } = useTheme()

  return (
    <div className={`${theme} min-h-screen bg-gray-50 dark:bg-slate-950`}>
      <Helmet>
        <title>FREVIO – Where friends share, chat, and connect</title>
        <meta name="description" content="We believe social connections should be beautiful, secure, and meaningful." />
      </Helmet>

      <Router>
        <TopNav />
        <main className="container mx-auto px-4 pb-20 pt-16 md:pt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <BottomNav />
      </Router>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}