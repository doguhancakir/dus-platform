import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { StudyTimerProvider } from './contexts/StudyTimerContext'
import { Toaster, toast } from 'sonner'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import BranchPage from './pages/BranchPage'
import AdminPage from './pages/AdminPage'
import Login from './pages/Login'
import NotesPage from './pages/NotesPage'
import FlaggedPage from './pages/FlaggedPage'
import LibraryPage from './pages/LibraryPage'
import { supabase } from './lib/supabase'
import StudyTimerWidget from './components/StudyTimerWidget'
import QuickNotesSidebar from './components/QuickNotesSidebar'

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

// Konu sayfası şimdilik kapalı (TopicPage silinmedi) — eski linkler konunun branşına gider
function TopicRedirect() {
  const { id } = useParams()
  const [branchId, setBranchId] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    supabase.from('topics').select('branch_id').eq('id', id).maybeSingle()
      .then(({ data }) => data?.branch_id ? setBranchId(data.branch_id) : setFailed(true))
  }, [id])
  if (failed) return <Navigate to="/" replace />
  if (!branchId) return null
  return <Navigate to={`/branch/${branchId}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/branch/:id" element={
        <ProtectedRoute><BranchPage /></ProtectedRoute>
      } />
      <Route path="/topic/:id" element={
        <ProtectedRoute><TopicRedirect /></ProtectedRoute>
      } />
      <Route path="/flagged" element={
        <ProtectedRoute><FlaggedPage /></ProtectedRoute>
      } />

      <Route path="/library" element={
        <ProtectedRoute><LibraryPage /></ProtectedRoute>
      } />
      <Route path="/notes" element={
        <ProtectedRoute><NotesPage /></ProtectedRoute>
      } />
      <Route path="/notes/:branchId" element={
        <ProtectedRoute><NotesPage /></ProtectedRoute>
      } />
      <Route path="/notes/:branchId/:canvasId" element={
        <ProtectedRoute><NotesPage /></ProtectedRoute>
      } />
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
          <QuickNotesSidebar />
          <AppRoutes />
        </StudyTimerProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
