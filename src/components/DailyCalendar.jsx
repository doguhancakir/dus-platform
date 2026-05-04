import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

const GOAL_TEXT = '50 Soru Çöz'

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

export default function DailyCalendar({ userId, todayAnswered = 0 }) {
  const today = getToday()
  const [sel, setSel] = useState(getToday())
  const [calOpen, setCalOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [todos, setTodos] = useState([])
  const [dayStatus, setDayStatus] = useState({})
  const [inputVal, setInputVal] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [goalTaskId, setGoalTaskId] = useState(null)
  const inputRef = useRef(null)

  const selKey = toKey(sel)
  const todayKey = toKey(today)

  // ── loaders ───────────────────────────────────────────────────────────────

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

    // For today: ensure "50 Soru Çöz" exists before fetching (sequential, not racy)
    if (selKey === todayKey) {
      const { data: existing } = await supabase
        .from('daily_todos')
        .select('id')
        .eq('user_id', userId)
        .eq('date', todayKey)
        .eq('text', GOAL_TEXT)
        .maybeSingle()
      if (!existing) {
        await supabase
          .from('daily_todos')
          .insert({ user_id: userId, date: todayKey, text: GOAL_TEXT, completed: false })
      }
    }

    const { data } = await supabase
      .from('daily_todos')
      .select('*')
      .eq('user_id', userId)
      .eq('date', selKey)
      .order('created_at')
    const rows = data || []
    setTodos(rows)

    // Track goal task ID for auto-complete (needed even when not viewing today)
    if (selKey === todayKey) {
      const goal = rows.find(t => t.text === GOAL_TEXT)
      if (goal) setGoalTaskId(goal.id)
    }
  }, [userId, selKey, todayKey])

  useEffect(() => { loadStatus() }, [loadStatus])
  useEffect(() => { loadTodos() }, [loadTodos])

  // Backup: ensure goalTaskId is known even when not viewing today
  useEffect(() => {
    if (!userId || goalTaskId) return
    supabase
      .from('daily_todos')
      .select('id')
      .eq('user_id', userId)
      .eq('date', todayKey)
      .eq('text', GOAL_TEXT)
      .maybeSingle()
      .then(({ data }) => { if (data?.id) setGoalTaskId(data.id) })
  }, [userId, todayKey, goalTaskId])

  // Auto-complete "50 Soru Çöz" when todayAnswered reaches 50
  useEffect(() => {
    if (!userId || !goalTaskId || todayAnswered < 50) return
    supabase
      .from('daily_todos')
      .update({ completed: true })
      .eq('id', goalTaskId)
      .eq('completed', false)   // no-op if already ticked
      .select()
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        // Update UI if the task is currently visible in the list
        setTodos(prev => {
          const found = prev.find(t => t.id === goalTaskId)
          if (!found) return prev
          return prev.map(t => t.id === goalTaskId ? data : t)
        })
        loadStatus()
      })
  }, [userId, goalTaskId, todayAnswered]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── mutations ─────────────────────────────────────────────────────────────

  async function addTodo() {
    const text = inputVal.trim()
    if (!text || !userId) return
    const { data, error } = await supabase
      .from('daily_todos')
      .insert({ user_id: userId, date: selKey, text })
      .select()
      .single()
    if (error) { console.error('addTodo error', error); return }
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

  // ── derived ───────────────────────────────────────────────────────────────

  const prevDay = new Date(sel); prevDay.setDate(prevDay.getDate() - 1)
  const nextDay = new Date(sel); nextDay.setDate(nextDay.getDate() + 1)
  const nextFuture = nextDay > today

  const fmtShort = d => `${d.getDate()} ${MONTHS_TR[d.getMonth()].slice(0, 3)}`
  const fmtFull  = d => `${d.getDate()} ${MONTHS_TR[d.getMonth()]}`

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ padding: '20px 24px 16px' }}
    >

      {/* ── Day navigator ── */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">

        {/* Full-calendar toggle button */}
        <button
          onClick={() => setCalOpen(v => !v)}
          title={calOpen ? 'Takvimi kapat' : 'Tam takvimi aç'}
          style={{
            flexShrink: 0,
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: calOpen ? 'rgba(8,145,178,0.22)' : 'rgba(8,145,178,0.07)',
            border: `1px solid ${calOpen ? 'rgba(8,145,178,0.55)' : 'rgba(8,145,178,0.25)'}`,
            color: '#0891b2',
            fontSize: 13,
            cursor: 'pointer',
            clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)',
            transition: 'all 0.15s',
          }}
        >
          ▦
        </button>

        {/* Prev / current / next */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Left arrow */}
          <button
            onClick={() => goDay(-1)}
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 26,
              lineHeight: 1,
              color: '#0891b2',
              cursor: 'pointer',
              padding: '0 4px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ‹
          </button>

          {/* Dates row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Previous day */}
            <button
              onClick={() => goDay(-1)}
              style={{
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.08em',
                color: '#2a3d50',
                cursor: 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#4a6070'}
              onMouseLeave={e => e.currentTarget.style.color = '#2a3d50'}
            >
              {fmtShort(prevDay)}
            </button>

            {/* Selected day — prominent */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 22,
                  letterSpacing: '0.1em',
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                {fmtFull(sel)}
              </span>
              {selKey === todayKey && (
                <span
                  style={{
                    fontFamily: 'Barlow, sans-serif',
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    color: '#0891b2',
                    marginTop: 2,
                  }}
                >
                  BUGÜN
                </span>
              )}
            </div>

            {/* Next day */}
            <button
              onClick={() => !nextFuture && goDay(1)}
              style={{
                fontFamily: 'Barlow, sans-serif',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.08em',
                color: nextFuture ? '#18273a' : '#2a3d50',
                cursor: nextFuture ? 'default' : 'pointer',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!nextFuture) e.currentTarget.style.color = '#4a6070' }}
              onMouseLeave={e => { e.currentTarget.style.color = nextFuture ? '#18273a' : '#2a3d50' }}
            >
              {fmtShort(nextDay)}
            </button>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => !nextFuture && goDay(1)}
            disabled={nextFuture}
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 26,
              lineHeight: 1,
              color: nextFuture ? '#18273a' : '#0891b2',
              cursor: nextFuture ? 'default' : 'pointer',
              padding: '0 4px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!nextFuture) e.currentTarget.style.opacity = '0.65' }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Full calendar panel ── */}
      <AnimatePresence>
        {calOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden', flexShrink: 0, marginBottom: 12 }}
          >
            <div
              style={{
                background: 'rgba(4,8,18,0.75)',
                border: '1px solid rgba(8,145,178,0.18)',
                borderLeft: '2px solid rgba(8,145,178,0.4)',
                padding: '12px 14px',
              }}
            >
              {/* Month navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <button
                  onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                  style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: '#0891b2', cursor: 'pointer', width: 28, textAlign: 'center', lineHeight: 1 }}
                >‹</button>
                <span
                  style={{
                    fontFamily: 'Barlow, sans-serif', fontWeight: 700,
                    fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: '#0891b2',
                  }}
                >
                  {MONTHS_TR[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <button
                  onClick={() => {
                    const nm = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    if (nm <= thisMonth) setViewMonth(nm)
                  }}
                  style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: 22, color: '#0891b2', cursor: 'pointer', width: 28, textAlign: 'center', lineHeight: 1 }}
                >›</button>
              </div>

              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                  <div
                    key={d}
                    style={{
                      textAlign: 'center',
                      fontFamily: 'Barlow, sans-serif', fontWeight: 700,
                      fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: '#1e3050', padding: '2px 0',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {getMonthGrid().map((d, i) => {
                  if (!d) return <div key={`e-${i}`} />
                  const key       = toKey(d)
                  const isSel     = key === selKey
                  const isToday   = key === todayKey
                  const isFuture  = d > today
                  const isDone    = dayStatus[key] === 'complete'
                  const isPartial = dayStatus[key] === 'partial'

                  return (
                    <button
                      key={key}
                      onClick={() => pickDay(d)}
                      style={{
                        height: 28,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        background: isSel
                          ? 'rgba(8,145,178,0.22)'
                          : isToday ? 'rgba(8,145,178,0.08)' : 'transparent',
                        border: isSel
                          ? '1px solid rgba(8,145,178,0.55)'
                          : isToday ? '1px solid rgba(8,145,178,0.25)' : '1px solid transparent',
                        color: isFuture ? '#18273a'
                          : isDone ? '#10b981'
                          : isSel ? '#ffffff'
                          : isToday ? '#0891b2'
                          : '#4a6070',
                        fontFamily: 'Barlow, sans-serif',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: isFuture ? 'default' : 'pointer',
                        textDecoration: isDone ? 'line-through' : 'none',
                        textDecorationColor: '#10b981',
                        transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { if (!isFuture && !isSel) e.currentTarget.style.background = 'rgba(8,145,178,0.12)' }}
                      onMouseLeave={e => {
                        if (!isSel) e.currentTarget.style.background = isToday ? 'rgba(8,145,178,0.08)' : 'transparent'
                      }}
                    >
                      {d.getDate()}
                      {isPartial && !isFuture && (
                        <span style={{
                          position: 'absolute', bottom: 3, right: 3,
                          width: 4, height: 4, borderRadius: '50%',
                          background: '#f0c040',
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section label ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 10, flexShrink: 0,
        }}
      >
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, #1a2d45, transparent)' }} />
        <span
          style={{
            fontFamily: 'Barlow, sans-serif', fontWeight: 700,
            fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
            color: '#1e3050', flexShrink: 0,
          }}
        >
          {selKey === todayKey ? 'BUGÜNÜN GÖREVLERİ' : `${fmtShort(sel).toUpperCase()} GÖREVLERİ`}
        </span>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, #1a2d45, transparent)' }} />
      </div>

      {/* ── Todo list ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {todos.map(todo => {
            const isGoal = todo.text === GOAL_TEXT
            const checkColor  = isGoal ? '#f0c040' : '#10b981'
            const checkBorder = todo.completed
              ? `1px solid ${checkColor}`
              : isGoal ? '1px solid rgba(240,192,64,0.5)' : '1px solid rgba(8,145,178,0.35)'
            const checkBg = todo.completed
              ? isGoal ? 'rgba(240,192,64,0.12)' : 'rgba(16,185,129,0.12)'
              : 'transparent'
            const textColor = todo.completed ? '#2a3d50' : isGoal ? '#f0c040' : '#8fb0c8'
            const strikeColor = isGoal ? '#f0c040' : '#10b981'

            return (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.14 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0',
                paddingLeft: isGoal ? 6 : 0,
                borderBottom: '1px solid rgba(18,35,55,0.9)',
                borderLeft: isGoal ? '2px solid rgba(240,192,64,0.35)' : '2px solid transparent',
                background: isGoal ? 'rgba(240,192,64,0.03)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredId(todo.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleTodo(todo)}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: checkBorder,
                  background: checkBg,
                  color: checkColor,
                  fontSize: 10,
                  cursor: 'pointer',
                  clipPath: 'polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 0 100%)',
                  transition: 'all 0.15s',
                }}
              >
                {todo.completed ? '✓' : ''}
              </button>

              {/* Text */}
              <span
                style={{
                  flex: 1,
                  fontFamily: 'Barlow, sans-serif',
                  fontWeight: isGoal ? 700 : 500,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: textColor,
                  textDecoration: todo.completed ? 'line-through' : 'none',
                  textDecorationColor: strikeColor,
                  textDecorationThickness: '1.5px',
                  wordBreak: 'break-word',
                  letterSpacing: isGoal ? '0.04em' : 'normal',
                }}
              >
                {todo.text}
              </span>

              {/* Delete */}
              <button
                onClick={() => deleteTodo(todo.id)}
                style={{
                  flexShrink: 0,
                  marginTop: 2,
                  fontFamily: 'Barlow, sans-serif',
                  fontSize: 11,
                  color: '#ef4444',
                  cursor: 'pointer',
                  opacity: hoveredId === todo.id ? 0.65 : 0,
                  pointerEvents: hoveredId === todo.id ? 'auto' : 'none',
                  transition: 'opacity 0.15s',
                  lineHeight: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = hoveredId === todo.id ? '0.65' : '0'}
              >
                ✕
              </button>
            </motion.div>
            )
          })
          ))}
        </AnimatePresence>

        {todos.length === 0 && (
          <p
            style={{
              fontFamily: 'Barlow, sans-serif',
              fontSize: 12,
              letterSpacing: '0.06em',
              color: '#152030',
              padding: '8px 0',
            }}
          >
            — henüz görev eklenmedi
          </p>
        )}
      </div>

      {/* ── Input ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 8,
          paddingTop: 10,
          borderTop: '1px solid rgba(8,145,178,0.1)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 18,
            lineHeight: 1,
            color: 'rgba(8,145,178,0.4)',
            flexShrink: 0,
          }}
        >
          +
        </span>
        <input
          ref={inputRef}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTodo()
            }
          }}
          placeholder="Görev ekle… (Enter)"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Barlow, sans-serif',
            fontWeight: 500,
            fontSize: 13,
            color: '#8fb0c8',
            caretColor: '#0891b2',
          }}
        />
      </div>
    </div>
  )
}
