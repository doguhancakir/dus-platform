import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus } from 'lucide-react'

const STRIP_W = 14
const PANEL_W = 260

export default function QuickNotesSidebar() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [checking, setChecking] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('quick_todos')
      .select('id, text')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setTodos(data || []))
  }, [user])

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 260)
      return () => clearTimeout(t)
    }
  }, [open])

  async function addTodo() {
    const text = input.trim()
    if (!text || adding || !user) return
    setAdding(true)
    const { data, error } = await supabase
      .from('quick_todos')
      .insert({ user_id: user.id, text })
      .select('id, text')
      .single()
    if (!error && data) setTodos(p => [...p, data])
    setInput('')
    setAdding(false)
    inputRef.current?.focus()
  }

  async function removeTodo(id) {
    setChecking(id)
    setTimeout(async () => {
      setTodos(p => p.filter(t => t.id !== id))
      setChecking(null)
      await supabase.from('quick_todos').delete().eq('id', id)
    }, 200)
  }

  if (!user) return null

  const totalW = open ? STRIP_W + PANEL_W : STRIP_W

  return createPortal(
    /*
     * Rendered via portal directly into document.body — bypasses any
     * CSS transform/stacking-context in the React component tree.
     * position:fixed + right:0 is now always relative to the viewport.
     */
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: totalW,
        transition: 'width 0.24s cubic-bezier(0.22,1,0.36,1)',
        zIndex: 9800,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger strip — always 14px, leftmost element */}
      <div
        style={{
          flexShrink: 0,
          width: STRIP_W,
          background: open ? 'rgba(8,145,178,0.35)' : 'rgba(8,145,178,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
          userSelect: 'none',
          cursor: 'default',
        }}
      >
        {todos.length > 0 && (
          <span style={{
            fontFamily: 'Barlow, sans-serif',
            fontWeight: 800,
            fontSize: 9,
            color: open ? '#fff' : '#0891b2',
            transition: 'color 0.2s',
            lineHeight: 1,
          }}>
            {todos.length}
          </span>
        )}
      </div>

      {/* Panel — fills remaining space to the right of strip */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: 'rgba(4,10,20,0.97)',
          borderRight: '1px solid #0d2a40',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #0d2a40', flexShrink: 0 }}>
          <p style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 13,
            letterSpacing: '0.2em',
            color: '#0891b2',
            whiteSpace: 'nowrap',
          }}>
            ÇALIŞMA NOTLARI
          </p>
          <p style={{
            fontFamily: 'Barlow, sans-serif',
            fontWeight: 600,
            fontSize: 9,
            letterSpacing: '0.14em',
            color: '#1e3a52',
            textTransform: 'uppercase',
            marginTop: 3,
            whiteSpace: 'nowrap',
          }}>
            Tik at → silinir
          </p>
        </div>

        {/* Todo list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {todos.length === 0 ? (
            <p style={{
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 600,
              fontSize: 10,
              color: '#1e3a52',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              textAlign: 'center',
              padding: '24px 16px',
              whiteSpace: 'nowrap',
            }}>
              Henüz not yok
            </p>
          ) : todos.map(todo => (
            <div
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '7px 14px',
                borderBottom: '1px solid rgba(13,42,64,0.45)',
                opacity: checking === todo.id ? 0.4 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <button
                onClick={() => removeTodo(todo.id)}
                style={{
                  flexShrink: 0,
                  width: 13,
                  height: 13,
                  marginTop: 2,
                  border: `1px solid ${checking === todo.id ? '#0891b2' : '#1e3a52'}`,
                  background: checking === todo.id ? '#0891b2' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s, border-color 0.15s',
                  padding: 0,
                }}
              >
                {checking === todo.id && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span style={{
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 600,
                fontSize: 11,
                color: '#8ab4c8',
                lineHeight: 1.55,
                flex: 1,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
              }}>
                {todo.text}
              </span>
            </div>
          ))}
        </div>

        {/* Input — use form for reliable Enter submit */}
        <form
          onSubmit={e => { e.preventDefault(); addTodo() }}
          style={{ padding: '10px 12px', borderTop: '1px solid #0d2a40', flexShrink: 0, display: 'flex', gap: 6 }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Not ekle… (Enter)"
            autoComplete="off"
            style={{
              flex: 1,
              background: '#070f1e',
              border: '1px solid #1a3050',
              borderRadius: 0,
              color: '#c8e8f4',
              fontFamily: 'Barlow, sans-serif',
              fontWeight: 600,
              fontSize: 11,
              padding: '6px 8px',
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || adding}
            style={{
              flexShrink: 0,
              background: input.trim() && !adding ? '#0891b2' : '#0a1525',
              border: '1px solid #1a3050',
              color: '#fff',
              padding: '0 9px',
              cursor: input.trim() && !adding ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
          >
            <Plus size={12} />
          </button>
        </form>
      </div>

    </div>,
    document.body
  )
}
