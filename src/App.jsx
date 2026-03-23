import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Dashboard from './pages/Dashboard'
import BranchPage from './pages/BranchPage'
import TopicPage from './pages/TopicPage'
import AdminPage from './pages/AdminPage'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[rgba(8,145,178,0.2)] border-t-[#0891b2] rounded-full animate-spin" />
          <p className="text-gray-600 text-xs uppercase tracking-widest">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />
      <Route path="/" element={<Dashboard />} />
      <Route path="/branch/:id" element={<BranchPage />} />
      <Route path="/topic/:id" element={<TopicPage />} />
      <Route path="/admin" element={
        <ProtectedRoute><AdminPage /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
