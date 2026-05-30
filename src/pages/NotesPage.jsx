import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import NotesCanvas from '../components/NotesCanvas'
import Layout from '../components/Layout'

export default function NotesPage() {
  const { branchId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])

  useEffect(() => {
    supabase.from('branches').select('id, name, icon, color').order('sort_order')
      .then(({ data }) => setBranches(data || []))
  }, [])

  // ── Canvas view ─────────────────────────────────────────────────────
  if (branchId) {
    const branch = branches.find(b => b.id === parseInt(branchId))
    return (
      <NotesCanvas
        branchId={parseInt(branchId)}
        branchName={branch?.name ?? ''}
        userId={user?.id}
        onBack={() => navigate('/notes')}
      />
    )
  }

  // ── Branch selection ─────────────────────────────────────────────────
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10"
        >
          <button
            onClick={() => navigate('/')}
            style={{
              fontFamily: 'Barlow, sans-serif', fontWeight: 700,
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#1a3050', background: 'transparent', border: 'none',
              cursor: 'pointer', marginBottom: 16, display: 'block',
            }}
          >
            ← Geri
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 3, height: 32, background: '#0891b2', flexShrink: 0 }} />
            <h1
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 32, letterSpacing: '0.15em', color: '#ffffff',
              }}
            >
              NOTLARIM
            </h1>
          </div>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '0.18em', color: '#1a3050', textTransform: 'uppercase', marginLeft: 15 }}>
            Branş seç
          </p>
        </motion.div>

        {/* Branch grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {branches.map((b, i) => (
            <motion.button
              key={b.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate(`/notes/${b.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                background: 'rgba(8,14,24,0.7)',
                border: '1px solid #1a2d45',
                borderLeft: `3px solid ${b.color ?? '#0891b2'}`,
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.07)'; e.currentTarget.style.borderColor = `${b.color ?? '#0891b2'}` }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,14,24,0.7)'; e.currentTarget.style.borderColor = '#1a2d45'; e.currentTarget.style.borderLeftColor = b.color ?? '#0891b2' }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{b.icon}</span>
              <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', color: '#8aa4c0', textTransform: 'uppercase', lineHeight: 1.35 }}>
                {b.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
