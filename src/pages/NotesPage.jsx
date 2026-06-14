import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import NotesCanvas from '../components/NotesCanvas'
import Layout from '../components/Layout'

const backBtnStyle = {
  fontFamily: 'Barlow, sans-serif', fontWeight: 700,
  fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
  color: '#1a3050', background: 'transparent', border: 'none',
  cursor: 'pointer', marginBottom: 16, display: 'block',
}

function hexRgb(hex) {
  const h = hex.replace('#', '')
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`
}

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Note list ───────────────────────────────────────────────────────────────
function NoteListView({ branch, branchId, userId, navigate }) {
  const [canvases, setCanvases]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [hoveredId, setHoveredId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')
  const [creating, setCreating]   = useState(false)

  const color = branch?.color ?? '#0891b2'
  const rgb   = hexRgb(color)

  useEffect(() => {
    if (!userId || !branchId) { setLoading(false); return }
    supabase
      .from('note_canvases')
      .select('id, name, updated_at')
      .eq('user_id', userId)
      .eq('branch_id', branchId)
      .order('updated_at', { ascending: true })
      .then(({ data }) => { setCanvases(data || []); setLoading(false) })
  }, [branchId, userId])

  async function createCanvas() {
    if (creating) return
    setCreating(true)
    const n = canvases.length + 1
    const { data, error } = await supabase
      .from('note_canvases')
      .insert({ user_id: userId, branch_id: branchId, name: `Notlar ${n}` })
      .select('id')
      .single()
    setCreating(false)
    if (!error && data) navigate(`/notes/${branchId}/${data.id}`)
  }

  async function deleteCanvas(e, id) {
    e.stopPropagation()
    if (!window.confirm('Bu notu silmek istediğinden emin misin? Geri alınamaz.')) return
    await supabase.from('note_canvases').delete().eq('id', id)
    setCanvases(prev => prev.filter(c => c.id !== id))
  }

  function startEdit(e, canvas) {
    e.stopPropagation()
    setEditingId(canvas.id)
    setEditName(canvas.name)
  }

  async function commitEdit(id) {
    const name = editName.trim() || 'Notlar'
    await supabase.from('note_canvases').update({ name }).eq('id', id)
    setCanvases(prev => prev.map(c => c.id === id ? { ...c, name } : c))
    setEditingId(null)
  }

  const cardBase = {
    position: 'relative', cursor: 'pointer', minHeight: 100,
    border: '1px solid #1a2d45',
    borderLeft: `3px solid ${color}`,
    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
    transition: 'background 0.15s',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '16px 14px',
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-10">
          <button onClick={() => navigate('/notes')} style={backBtnStyle}>← Branşlar</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 3, height: 32, background: color, flexShrink: 0 }} />
            {branch?.icon && <span style={{ fontSize: 22 }}>{branch.icon}</span>}
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 28, letterSpacing: '0.12em', color: '#ffffff' }}>
              {branch?.name?.toUpperCase() ?? ''}
            </h1>
          </div>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '0.18em', color: '#1a3050', textTransform: 'uppercase', marginLeft: 15 }}>
            Notlarım
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {loading ? (
            [1,2].map(i => <div key={i} style={{ ...cardBase, cursor: 'default', opacity: 0.4, background: 'rgba(8,14,24,0.7)' }} />)
          ) : (
            <>
              {canvases.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  onClick={() => editingId !== c.id && navigate(`/notes/${branchId}/${c.id}`)}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ ...cardBase, background: hoveredId === c.id ? `rgba(${rgb},0.07)` : 'rgba(8,14,24,0.7)' }}
                >
                  {/* Trash */}
                  {hoveredId === c.id && editingId !== c.id && (
                    <button
                      onClick={e => deleteCanvas(e, c.id)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#ef4444', padding: '3px 5px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}

                  {/* Name */}
                  <div>
                    {editingId === c.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(c.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          style={{
                            background: 'transparent', border: 'none',
                            borderBottom: `1px solid ${color}`,
                            color: '#ffffff', fontFamily: '"Bebas Neue", sans-serif',
                            fontSize: 18, letterSpacing: '0.1em',
                            outline: 'none', width: '100%', padding: '2px 0',
                          }}
                        />
                        <button onClick={() => commitEdit(c.id)} style={{ background: 'none', border: 'none', color: color, cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: '#1a3050', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 18, letterSpacing: '0.1em', color: '#ffffff' }}>
                          {c.name}
                        </span>
                        {hoveredId === c.id && (
                          <button
                            onClick={e => startEdit(e, c)}
                            style={{ background: 'none', border: 'none', color: '#1a3050', cursor: 'pointer', padding: 0 }}
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ marginTop: 12 }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 10, letterSpacing: '0.12em', color: '#1a3050', textTransform: 'uppercase' }}>
                      {fmtDate(c.updated_at)}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* + New note */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: canvases.length * 0.06, duration: 0.3 }}
                onClick={createCanvas}
                disabled={creating}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '16px 14px', cursor: creating ? 'default' : 'pointer', minHeight: 100,
                  background: 'transparent',
                  border: `1px dashed rgba(${rgb},0.35)`,
                  borderLeft: `3px solid ${color}`,
                  color: color, opacity: creating ? 0.5 : 1,
                  transition: 'background 0.15s',
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
                }}
                onMouseEnter={e => !creating && (e.currentTarget.style.background = `rgba(${rgb},0.06)`)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Plus size={20} />
                <span style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  {creating ? 'Oluşturuluyor…' : 'Yeni Not'}
                </span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function NotesPage() {
  const { branchId, canvasId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])

  useEffect(() => {
    supabase.from('branches').select('id, name, icon, color').order('sort_order')
      .then(({ data }) => setBranches(data || []))
  }, [])

  const branch = branches.find(b => b.id === parseInt(branchId))

  // ── Canvas view
  if (branchId && canvasId) {
    return (
      <NotesCanvas
        canvasId={canvasId}
        branchId={parseInt(branchId)}
        branchName={branch?.name ?? ''}
        userId={user?.id}
        onBack={() => navigate(`/notes/${branchId}`)}
      />
    )
  }

  // ── Note list view
  if (branchId) {
    return (
      <NoteListView
        branch={branch}
        branchId={parseInt(branchId)}
        userId={user?.id}
        navigate={navigate}
      />
    )
  }

  // ── Branch selection
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-10">
          <button onClick={() => navigate('/')} style={backBtnStyle}>← Geri</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 3, height: 32, background: '#0891b2', flexShrink: 0 }} />
            <h1 style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 32, letterSpacing: '0.15em', color: '#ffffff' }}>
              NOTLARIM
            </h1>
          </div>
          <p style={{ fontFamily: 'Barlow, sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '0.18em', color: '#1a3050', textTransform: 'uppercase', marginLeft: 15 }}>
            Branş seç
          </p>
        </motion.div>

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
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(8,145,178,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(8,14,24,0.7)')}
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
