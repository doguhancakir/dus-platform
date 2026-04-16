import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function toKey(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default function DailyCalendar({ userId }) {
  const today = getToday()
  const [sel, setSel] = useState(getToday())
  const [calOpen, setCalOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [todos, setTodos] = useState([])
  const [dayStatus, setDayStatus] = useState({}) // dateKey -> 'complete' | 'partial'
  const [inputVal, setInputVal] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const inputRef = useRef(null)

  const selKey = toKey(sel)
  const todayKey = toKey(today)

  // ── data loaders ──────────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    if (!userId) return
    const start = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const end   = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
    const { data } = await supabase
      .from('daily_todos')
      .select('date, completed')
      .eq('user_id', userId)
      .gte('date', toKey(start))
      .lte('date', toKey(end))
    if (!data) return
    const g = {}
    data.forEach(t => {
      if (!g[t.date]) g[t.date] = { total: 0, done: 0 }
      g[t.date].total++
      if (t.completed) g[t.date].done++
    })
    const s = {}
    Object.entries(g).forEach(([d, { total, done }]) => {
      s[d] = total > 0 && done === total ? 'complete' : 'partial'
    })
    setDayStatus(s)
  }, [userId, viewMonth.getTime()])

  const loadTodos = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('daily_todos')
      .select('*')
      .eq('user_id', userId)
      .eq('date', selKey)
      .order('created_at')
    setTodos(data || [])
  }, [userId, selKey])

  useEffect(() => { loadStatus() }, [loadStatus])
  useEffect(() => { loadTodos() }, [loadTodos])

  // ── mutations ─────────────────────────────────────────────────────────────

  async function addTodo() {
    const text = inputVal.trim()
    if (!text || !userId) return
    const { data } = await supabase
      .from('daily_todos')
      .insert({ user_id: userId, date: selKey, text })
      .select()
      .single()
    if (data) {
      setTodos(p => [...p, data])
      setInputVal('')
      loadStatus()
    }
  }

  async function toggleTodo(todo) {
    const { data } = await supabase
      .from('daily_todos')
      .update({ completed: !todo.completed })
      .eq('id', todo.id)
      .select()
      .single()
    if (data) {
      setTodos(p => p.map(t => t.id === todo.id ? data : t))
      loadStatus()
    }
  }

  async function deleteTodo(id) {
    await supabase.from('daily_todos').delete().eq('id', id)
    setTodos(p => p.filter(t => t.id !== id))
    loadStatus()
  }

  // ── navigation ────────────────────────────────────────────────────────────

  function goDay(delta) {
    const d = new Date(sel)
    d.setDate(d.getDate() + delta)
    if (d > today) return
    setSel(d)
    const nm = new Date(d.getFullYear(), d.getMonth(), 1)
    if (nm.getTime() !== viewMonth.getTime()) setViewMonth(nm)
  }

  function pickDay(d) {
    if (d > today) return
    setSel(new Date(d))
    const nm = new Date(d.getFullYear(), d.getMonth(), 1)
    if (nm.getTime() !== viewMonth.getTime()) setViewMonth(nm)
    setCalOpen(false)
  }

  function getMonthGrid() {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    const first = new Date(y, m, 1)
    const last  = new Date(y, m + 1, 0)
    let dow = first.getDay() - 1
    if (dow < 0) dow = 6
    const days = Array(dow).fill(null)
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(y, m, d))
    return days
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  const prev = new Date(sel); prev.setDate(prev.getDate() - 1)
  const next = new Date(sel); next.setDate(next.getDate() + 1)
  const nextFuture = next > today

  const fmtShort = d => `${d.getDate()} ${MONTHS_TR[d.getMonth()].slice(0, 3)}`
  const fmtFull  = d => `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden select-none" style={{ padding: '18px 22px 14px' }}>

      {/* ── Day scroller row ── */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        {/* Full-cal toggle */}
        <button
          onClick={() => setCalOpen(v => !v)}
          title={calOpen ? 'Takvimi kapat' : 'Tam takvimi aç'}
          className="flex-shrink-0 flex items-center justify-center transition-all duration-200"
          style={{
            width: 22, height: 22,
            background: calOpen ? 'rgba(8,145,178,0.22)' : 'rgba(8,145,178,0.06)',
            border: `1px solid ${calOpen ? 'rgba(8,145,178,0.5)' : 'rgba(8,145,178,0.2)'}`,
            color: '#0891b2',
            fontSize: 10,
            clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)',
            cursor: 'pointer',
          }}
        >
          ▦
        </button>

        {/* Prev / current / next */}
        <div className="flex-1 flex items-center justify-between">
          <button
            onClick={() => goDay(-1)}
            className="font-bebas text-xl leading-none px-1 transition-colors"
            style={{ color: '#0891b2', cursor: 'pointer' }}
          >
            ‹
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => goDay(-1)}
              className="font-barlow text-[10px] tracking-wide transition-colors"
              style={{ color: '#253545', cursor: 'pointer' }}
            >
              {fmtShort(prev)}
            </button>

            <div className="flex flex-col items-center">
              <span
                className="font-bebas tracking-widest leading-none text-white"
                style={{ fontSize: '1.05rem' }}
              >
                {fmtFull(sel)}
              </span>
              {selKey === todayKey && (
                <span
                  className="font-barlow font-bold text-[7px] tracking-[0.25em] uppercase mt-0.5"
                  style={{ color: '#0891b2' }}
                >
                  BUGÜN
                </span>
              )}
            </div>

            <button
              onClick={() => !nextFuture && goDay(1)}
              className="font-barlow text-[10px] tracking-wide"
              style={{
                color: nextFuture ? '#18273a' : '#253545',
                cursor: nextFuture ? 'default' : 'pointer',
              }}
            >
              {fmtShort(next)}
            </button>
          </div>

          <button
            onClick={() => !nextFuture && goDay(1)}
            disabled={nextFuture}
            className="font-bebas text-xl leading-none px-1 transition-colors"
            style={{ color: nextFuture ? '#18273a' : '#0891b2', cursor: nextFuture ? 'default' : 'pointer' }}
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Full calendar panel ── */}
      <AnimatePresence>
        {calOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden flex-shrink-0 mb-3"
          >
            <div
              style={{
                background: 'rgba(4,8,18,0.7)',
                border: '1px solid rgba(8,145,178,0.15)',
                borderLeft: '2px solid rgba(8,145,178,0.35)',
                padding: '10px 12px',
              }}
            >
              {/* Month nav */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                  className="font-bebas text-xl leading-none w-6 h-6 flex items-center justify-center transition-colors"
                  style={{ color: '#0891b2', cursor: 'pointer' }}
                >
                  ‹
                </button>
                <span className="font-barlow font-bold text-[10px] tracking-[0.22em] uppercase" style={{ color: '#0891b2' }}>
                  {MONTHS_TR[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <button
                  onClick={() => {
                    const nm = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    if (nm <= thisMonth) setViewMonth(nm)
                  }}
                  className="font-bebas text-xl leading-none w-6 h-6 flex items-center justify-center transition-colors"
                  style={{ color: '#0891b2', cursor: 'pointer' }}
                >
                  ›
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                  <div
                    key={d}
                    className="text-center font-barlow font-bold text-[8px] uppercase tracking-wider py-0.5"
                    style={{ color: '#1e3050' }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-px">
                {getMonthGrid().map((d, i) => {
                  if (!d) return <div key={`e-${i}`} />
                  const key      = toKey(d)
                  const isSel    = key === selKey
                  const isToday  = key === todayKey
                  const isFuture = d > today
                  const isDone   = dayStatus[key] === 'complete'
                  const isPartial = dayStatus[key] === 'partial'

                  return (
                    <button
                      key={key}
                      onClick={() => pickDay(d)}
                      className="relative flex items-center justify-center transition-all duration-100"
                      style={{
                        height: 24,
                        background: isSel
                          ? 'rgba(8,145,178,0.22)'
                          : isToday
                          ? 'rgba(8,145,178,0.07)'
                          : 'transparent',
                        border: isSel
                          ? '1px solid rgba(8,145,178,0.5)'
                          : isToday
                          ? '1px solid rgba(8,145,178,0.2)'
                          : '1px solid transparent',
                        color: isFuture
                          ? '#18273a'
                          : isDone
                          ? '#10b981'
                          : isSel
                          ? '#ffffff'
                          : isToday
                          ? '#0891b2'
                          : '#3a5060',
                        fontSize: 10,
                        fontFamily: 'Barlow, sans-serif',
                        fontWeight: 700,
                        cursor: isFuture ? 'default' : 'pointer',
                        textDecoration: isDone ? 'line-through' : 'none',
                        textDecorationColor: '#10b981',
                      }}
                    >
                      {d.getDate()}
                      {/* Yellow dot for partial completion */}
                      {isPartial && !isFuture && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 2, right: 3,
                            width: 3, height: 3,
                            borderRadius: '50%',
                            background: '#f0c040',
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section divider ── */}
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, #1a2d45, transparent)' }} />
        <span
          className="font-barlow font-bold text-[8px] tracking-[0.25em] uppercase flex-shrink-0"
          style={{ color: '#1e3050' }}
        >
          {selKey === todayKey ? 'BUGÜNÜN GÖREVLERİ' : `${fmtShort(sel).toUpperCase()} · GÖREVLERİ`}
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, #1a2d45, transparent)' }} />
      </div>

      {/* ── Todo list ── */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {todos.map(todo => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.14 }}
              className="flex items-start gap-2 py-1.5"
              style={{ borderBottom: '1px solid rgba(18,35,55,0.9)' }}
              onMouseEnter={() => setHoveredId(todo.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo)}
                className="flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-150"
                style={{
                  width: 14, height: 14,
                  border: `1px solid ${todo.completed ? '#10b981' : 'rgba(8,145,178,0.3)'}`,
                  background: todo.completed ? 'rgba(16,185,129,0.12)' : 'transparent',
                  color: '#10b981',
                  fontSize: 8,
                  cursor: 'pointer',
                  clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 0 100%)',
                }}
              >
                {todo.completed ? '✓' : ''}
              </button>

              {/* Text */}
              <span
                className="flex-1 font-barlow text-[11px] leading-snug min-w-0"
                style={{
                  color: todo.completed ? '#253545' : '#8a9ab0',
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  textDecorationColor: '#10b981',
                  textDecorationThickness: '1.5px',
                  wordBreak: 'break-word',
                }}
              >
                {todo.text}
              </span>

              {/* Delete — appears on row hover */}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="flex-shrink-0 font-barlow text-[10px] transition-all duration-150 mt-0.5"
                style={{
                  color: '#ef4444',
                  opacity: hoveredId === todo.id ? 0.6 : 0,
                  cursor: 'pointer',
                  pointerEvents: hoveredId === todo.id ? 'auto' : 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = hoveredId === todo.id ? '0.6' : '0' }}
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {todos.length === 0 && (
          <div
            className="py-2 font-barlow text-[10px] tracking-wider"
            style={{ color: '#152030' }}
          >
            — henüz görev eklenmedi
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div
        className="flex items-center gap-2 mt-2 pt-2 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(8,145,178,0.09)' }}
      >
        <span className="font-bebas text-base leading-none flex-shrink-0" style={{ color: 'rgba(8,145,178,0.35)' }}>
          +
        </span>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
          placeholder="Görev ekle… (Enter)"
          className="flex-1 bg-transparent font-barlow text-[11px] outline-none"
          style={{ color: '#8a9ab0', caretColor: '#0891b2' }}
        />
      </div>
    </div>
  )
}
