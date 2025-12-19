import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"

import Home from "./pages/Home"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import Profile from "./pages/Profile"
import Chat from "./pages/Chat"

const App = () => {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" /> : <Home />}
      />

      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" /> : <Auth />}
      />

      <Route
        path="/dashboard"
        element={user ? <Dashboard /> : <Navigate to="/auth" />}
      />

      <Route
        path="/profile/:id"
        element={user ? <Profile /> : <Navigate to="/auth" />}
      />

      <Route
        path="/chat"
        element={user ? <Chat /> : <Navigate to="/auth" />}
      />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
