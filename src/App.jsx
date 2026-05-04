import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { StudyTimerProvider } from './contexts/StudyTimerContext'
import { Toaster, toast } from 'sonner'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import BranchPage from './pages/BranchPage'
import TopicPage from './pages/TopicPage'
import AdminPage from './pages/AdminPage'
import Login from './pages/Login'
import Register from './pages/Register'
import MixedQuizPage from './pages/MixedQuizPage'
import StudyTimerWidget from './components/StudyTimerWidget'

// ── Offline banner ────────────────────────────────────────────────────────────
function OfflineDetector() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    function handleOffline() {
      setOffline(true)
      toast.error('İnternet bağlantısı kesildi', { id: 'offline', duration: Infinity })
    }
    function handleOnline() {
      setOffline(false)
      toast.success('Bağlantı yeniden kuruldu', { id: 'offline', duration: 2500 })
    }
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!offline) return null
  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#cc0000', color: '#fff',
        fontFamily: 'Barlow, sans-serif', fontWeight: 700,
        fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
        textAlign: 'center', padding: '6px 0',
      }}
    >
      ⚠ İnternet bağlantısı yok — veriler kaydedilmiyor
    </div>
  )
}

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
      <Route path="/mixed-quiz" element={<MixedQuizPage />} />
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
        <StudyTimerProvider>
          <OfflineDetector />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0a1628',
                border: '1px solid #1e3555',
                color: '#d8dce8',
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 600,
                fontSize: 13,
              },
            }}
          />
          <StudyTimerWidget />
          <AppRoutes />
        </StudyTimerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
