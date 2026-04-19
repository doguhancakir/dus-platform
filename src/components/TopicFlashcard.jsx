/**
 * TopicFlashcard — SM-2 powered topic card review
 * Mirrors QuestionPanel exactly; uses separate user_topic_cards table.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Trophy, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { processCard, getEstimatedTime, RATINGS, CARD_STATUS, isDue } from '../lib/sm2'

// ── Config ────────────────────────────────────────────────────────────────────

const RATING_CONFIG = [
  { rating: RATINGS.AGAIN, label: 'TEKRAR', sub: 'Yeniden',   color: '#cc0000', bg: 'rgba(204,0,0,0.12)',    border: '#cc0000', textColor: '#fff' },
  { rating: RATINGS.HARD,  label: 'ZOR',    sub: 'Zorlandım', color: '#ff6600', bg: 'rgba(255,102,0,0.12)',  border: '#ff6600', textColor: '#fff' },
  { rating: RATINGS.GOOD,  label: 'İYİ',    sub: 'Bildim',    color: '#0891b2', bg: 'rgba(8,145,178,0.12)',  border: '#0891b2', textColor: '#fff' },
  { rating: RATINGS.EASY,  label: 'KOLAY',  sub: 'Ezber',     color: '#f0c040', bg: 'rgba(240,192,64,0.12)', border: '#f0c040', textColor: '#000' },
]

const DAILY_NEW_LIMIT = 20
const ACCENT = '#0891b2'

// ── Helpers ───────────────────────────────────────────────────────────────────

function mkCard(userId, topicCardId) {
  return {
    user_id: userId,
    topic_card_id: topicCardId,
    status: CARD_STATUS.NEW,
    interval: 0,
    ease_factor: 2.5,
    repetitions: 0,
    due_date: new Date().toISOString(),
    learning_step: 0,
    last_review: null,
  }
}

function calcStats(tc, m) {
  const newCount = tc.filter(c => !m[c.id] || m[c.id].status === CARD_STATUS.NEW).length
  const learningCount = tc.filter(c => {
    const u = m[c.id]
    return u?.status === CARD_STATUS.LEARNING || u?.status === CARD_STATUS.RELEARNING
  }).length
  const reviewCount = tc.filter(c => {
    const u = m[c.id]
    return u?.status === CARD_STATUS.REVIEW && isDue(u)
  }).length
  return { newCount, learningCount, reviewCount }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TopicFlashcard({ topicId, topicTitle, onClose }) {
  const { user } = useAuth()

  const [cards,    setCards]    = useState([])   // topic_cards rows
  const [ucMap,    setUcMap]    = useState({})   // topic_card_id → SM-2 state
  const [queue,    setQueue]    = useState([])   // ordered list of topic_card ids
  const [idx,      setIdx]      = useState(0)
  const [showAns,  setShowAns]  = useState(false)
  const [stats,    setStats]    = useState({ newCount: 0, learningCount: 0, reviewCount: 0 })
  const [loading,  setLoading]  = useState(true)
  const [finished, setFinished] = useState(false)
  const [busy,     setBusy]     = useState(false)

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadData()
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [topicId])

  async function loadData() {
    setLoading(true)
    try {
      const { data: tc } = await supabase
        .from('topic_cards')
        .select('*')
        .eq('topic_id', topicId)
        .order('card_index')

      if (!tc?.length) { setLoading(false); return }
      setCards(tc)

      const { data: uc } = await supabase
        .from('user_topic_cards')
        .select('*')
        .eq('user_id', user.id)
        .in('topic_card_id', tc.map(c => c.id))

      const m = {}
      uc?.forEach(c => { m[c.topic_card_id] = c })
      setUcMap(m)
      buildQueue(tc, m)
    } catch (err) {
      console.error('TopicFlashcard loadData error:', err)
    }
    setLoading(false)
  }

  // ── Queue ───────────────────────────────────────────────────────────────────

  function buildQueue(tc, m) {
    const due = [], fresh = []
    tc.forEach(c => {
      const uc = m[c.id]
      if (!uc || uc.status === CARD_STATUS.NEW) {
        fresh.push(c.id)
      } else if (isDue(uc)) {
        if (uc.status === CARD_STATUS.LEARNING || uc.status === CARD_STATUS.RELEARNING) {
          due.unshift(c.id)   // learning cards go to front
        } else {
          due.push(c.id)
        }
      }
    })
    const q = [...due, ...fresh.slice(0, DAILY_NEW_LIMIT)]
    setStats(calcStats(tc, m))
    setQueue(q)
    setIdx(0)
    setFinished(q.length === 0)
  }

  // ── Rating ──────────────────────────────────────────────────────────────────

  async function rate(rating) {
    if (busy) return
    setBusy(true)

    const cardId  = queue[idx]
    const existing = ucMap[cardId] || mkCard(user.id, cardId)
    const updated  = processCard(existing, rating)

    try {
      await supabase.from('user_topic_cards').upsert(updated)

      const nm = { ...ucMap, [cardId]: updated }
      setUcMap(nm)

      // Re-insert learning/relearning cards that are due again
      let nq = [...queue]
      if (
        (updated.status === CARD_STATUS.LEARNING || updated.status === CARD_STATUS.RELEARNING) &&
        isDue(updated)
      ) {
        nq.splice(Math.min(idx + 3, nq.length), 0, cardId)
      }

      const next = idx + 1
      if (next >= nq.length) {
        setStats(calcStats(cards, nm))
        setFinished(true)
      } else {
        setQueue(nq)
        setIdx(next)
        setShowAns(false)
      }
    } catch (err) {
      console.error('TopicFlashcard rate error:', err)
    }
    setBusy(false)
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const cardId   = queue[idx]
  const card     = cards.find(c => c.id === cardId)
  const uc       = card ? (ucMap[card.id] || mkCard(user.id, card.id)) : null
  const progress = queue.length > 0 ? idx / queue.length : 0

  // ── Screens ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <BattleScreen>
      <HUDBar stats={null} idx={0} total={0} title={topicTitle} onClose={onClose} />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-48 h-[2px] overflow-hidden" style={{ background: '#1a2d45' }}>
            <motion.div
              className="absolute inset-y-0 left-0 w-full bg-[#0891b2]"
              animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'left' }}
            />
          </div>
          <p className="font-barlow font-bold text-[#0891b2] tracking-[0.25em] text-xs uppercase">KARTLAR YÜKLENİYOR</p>
        </div>
      </div>
    </BattleScreen>
  )

  if (cards.length === 0) return (
    <BattleScreen>
      <HUDBar stats={null} idx={0} total={0} title={topicTitle} onClose={onClose} />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="font-bebas text-[#0891b2] mb-4 tracking-widest" style={{ fontSize: 'clamp(48px,10vw,80px)', transform: 'skewX(-4deg)', display: 'inline-block' }}>—</div>
          <h3 className="font-bebas text-2xl text-white tracking-widest mb-2">KART YOK</h3>
          <p className="font-barlow font-bold text-[11px] text-gray-600 uppercase tracking-[0.2em]">Bu konuda henüz kart eklenmemiş.</p>
        </div>
      </div>
    </BattleScreen>
  )

  if (finished) return (
    <BattleScreen>
      <HUDBar stats={stats} idx={queue.length} total={queue.length} title={topicTitle} onClose={onClose} />
      <FinishedScreen stats={stats} total={cards.length} onClose={onClose} />
    </BattleScreen>
  )

  if (!card) return null

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <BattleScreen>
      <HUDBar stats={stats} idx={idx} total={queue.length} title={topicTitle} onClose={onClose} />

      {/* ── Progress bar ── */}
      <div className="h-[3px] flex-shrink-0 relative" style={{ background: '#0d1a2e' }}>
        <motion.div
          className="h-full"
          animate={{ width: `${progress * 100}%`, background: ACCENT }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2"
          animate={{ left: `calc(${progress * 100}% - 4px)`, background: ACCENT }}
          transition={{ duration: 0.5 }}
          style={{ boxShadow: `0 0 8px ${ACCENT}`, clipPath: 'polygon(50% 0%,100% 50%,50% 100%,0% 50%)' }}
        />
      </div>

      {/* ── Card area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id + '-' + showAns}
            initial={{ opacity: 0, x: 40, skewX: 3 }}
            animate={{ opacity: 1, x: 0, skewX: 0 }}
            exit={{ opacity: 0, x: -40, skewX: -3 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto w-full px-5 sm:px-8 pt-6 pb-4 relative"
          >
            {/* Watermark */}
            <div
              className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
              style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: 'clamp(80px,16vw,140px)', color: `${ACCENT}05`, letterSpacing: '0.05em', lineHeight: 1, zIndex: 0 }}
            >
              TEKRAR
            </div>

            <div className="relative z-10 mb-6">
              {/* Badge row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-2 py-0.5"
                  style={{ color: ACCENT, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30` }}
                >
                  KART {idx + 1}
                </div>
                <CardStatusBadge uc={uc} />
              </div>

              {/* Front */}
              <motion.div
                style={{
                  background: '#080f1e',
                  borderLeft: `4px solid ${ACCENT}`,
                  padding: '1.25rem 1.5rem',
                  clipPath: 'polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Flash sweep */}
                <motion.div
                  key={card.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(105deg,transparent 0%,${ACCENT}18 50%,transparent 100%)`, transform: 'translateX(-100%) skewX(-20deg)' }}
                  animate={{ transform: ['translateX(-100%) skewX(-20deg)', 'translateX(300%) skewX(-20deg)'] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <p className="text-gray-100 text-base sm:text-lg leading-relaxed font-medium relative z-10">
                  {card.front}
                </p>
              </motion.div>
            </div>

            {/* Back / answer reveal */}
            <AnimatePresence>
              {showAns && (
                <motion.div
                  initial={{ opacity: 0, y: 12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10"
                  style={{
                    background: 'rgba(8,145,178,0.05)',
                    borderLeft: '3px solid rgba(8,145,178,0.45)',
                    padding: '1rem 1.1rem',
                    marginBottom: '0.5rem',
                    clipPath: 'polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)',
                  }}
                >
                  <p className="font-barlow font-bold text-[#0891b2] mb-1.5 uppercase tracking-[0.2em]" style={{ fontSize: '10px' }}>
                    ◈ CEVAP
                  </p>
                  <p className="text-gray-300 text-sm leading-relaxed">{card.back}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom command strip ── */}
      <div
        className="flex-shrink-0 relative"
        style={{ borderTop: `1px solid ${ACCENT}25`, background: '#060d1a', transition: 'border-color 0.4s ease' }}
      >
        <motion.div
          className="absolute top-0 left-0 h-[2px]"
          animate={{ width: showAns ? '100%' : '0%', background: ACCENT }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="p-4 sm:p-5">
          <AnimatePresence mode="wait">
            {!showAns ? (
              /* REVEAL button — identical to QuestionPanel */
              <motion.button
                key="reveal"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAns(true)}
                className="w-full max-w-lg mx-auto flex items-center justify-center gap-3 py-4 px-8 font-bebas tracking-[0.2em] text-lg text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(105deg, #0779a0, #0891b2)',
                  clipPath: 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))',
                  boxShadow: '0 4px 32px rgba(8,145,178,0.35)',
                  display: 'flex',
                }}
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ x: '-100%', skewX: '-20deg' }}
                  whileHover={{ x: '200%' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ background: 'rgba(255,255,255,0.1)', width: '60%' }}
                />
                CEVABI GÖSTER
                <ChevronRight size={20} strokeWidth={2.5} />
              </motion.button>
            ) : (
              /* RATING buttons — identical to QuestionPanel */
              <motion.div
                key="ratings"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-4 gap-[3px] max-w-2xl mx-auto"
              >
                {RATING_CONFIG.map((cfg, i) => (
                  <motion.button
                    key={cfg.rating}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => rate(cfg.rating)}
                    disabled={busy}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 transition-all duration-150 cursor-pointer disabled:opacity-50 relative overflow-hidden"
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}40`,
                      borderTop: `2px solid ${cfg.border}`,
                      clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))',
                    }}
                  >
                    <span className="font-bebas text-sm tracking-[0.12em] leading-none" style={{ color: cfg.textColor }}>
                      {cfg.label}
                    </span>
                    <span
                      className="font-barlow font-bold text-[9px] uppercase tracking-wider leading-none"
                      style={{ color: cfg.textColor, opacity: 0.55 }}
                    >
                      {uc ? getEstimatedTime(uc, cfg.rating) : '—'}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BattleScreen>
  )
}

// ── Sub-components (mirrors QuestionPanel exactly) ────────────────────────────

function BattleScreen({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#06101e' }}
    >
      <div className="absolute top-0 right-0 pointer-events-none" style={{ width: '40%', height: '100%', background: 'linear-gradient(to left,rgba(8,145,178,0.03),transparent)', clipPath: 'polygon(20% 0,100% 0,100% 100%,60% 100%)' }} />
      <div className="absolute bottom-0 left-0 pointer-events-none" style={{ width: '30%', height: '30%', background: 'rgba(8,145,178,0.04)', clipPath: 'polygon(0 0,100% 100%,0 100%)' }} />
      <div className="absolute inset-0 pointer-events-none p5-scanlines" style={{ opacity: 0.3, zIndex: 0 }} />
      <div className="relative z-10 flex flex-col h-full">{children}</div>
    </motion.div>
  )
}

function HUDBar({ stats, idx, total, title, onClose }) {
  return (
    <div
      className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0 relative"
      style={{ borderBottom: `1px solid ${ACCENT}20`, background: 'rgba(4,8,18,0.9)' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: ACCENT }} />

      <div className="flex items-center gap-3 pl-2">
        <span className="font-bebas text-white tracking-[0.15em] text-lg leading-none" style={{ transform: 'skewX(-4deg)', display: 'inline-block' }}>
          DAVY'S <span style={{ color: ACCENT }}>DENTAL</span>
        </span>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}25` }}>
          <Zap size={9} color={ACCENT} strokeWidth={2.5} />
          <span className="font-barlow font-bold text-[10px] tracking-[0.18em] uppercase" style={{ color: ACCENT }}>KONU TEKRAR</span>
        </div>
        {title && (
          <span className="hidden md:block font-barlow font-bold text-[11px] tracking-[0.1em] text-gray-600 truncate max-w-[200px]">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {stats && total > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <HUDPill color="#4466ff" count={stats.newCount}      label="YENİ" />
            <HUDPill color="#ff9800" count={stats.learningCount} label="ÖĞR" />
            <HUDPill color="#10b981" count={stats.reviewCount}   label="İNC" />
            <div
              className="font-bebas text-white tracking-[0.12em] text-base leading-none px-2 py-0.5"
              style={{ background: '#0d1a2e', border: '1px solid #1e3555' }}
            >
              <span style={{ color: ACCENT }}>{idx}</span>
              <span className="text-gray-700 text-sm">/{total}</span>
            </div>
          </div>
        )}
        {total > 0 && (
          <div className="sm:hidden font-bebas text-sm tracking-wider" style={{ color: ACCENT }}>
            {idx}/{total}
          </div>
        )}
        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:text-white transition-colors"
          style={{ border: '1px solid #1e3555', background: '#0d1a2e' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

function HUDPill({ color, count, label }) {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5"
      style={{ color, background: `${color}10`, border: `1px solid ${color}25` }}
    >
      <span className="font-bebas text-sm leading-none">{count}</span>
      <span className="font-barlow font-bold text-[9px] uppercase tracking-wider" style={{ opacity: 0.7 }}>{label}</span>
    </div>
  )
}

function CardStatusBadge({ uc }) {
  if (!uc) return null
  const MAP = {
    new:        { label: 'YENİ',       color: '#4466ff' },
    learning:   { label: 'ÖĞRENİYOR', color: '#ff9800' },
    review:     { label: 'İNCELEME',  color: '#10b981' },
    relearning: { label: 'TEKRAR',    color: '#ff1744' },
  }
  const s = MAP[uc.status]
  if (!s) return null
  return (
    <div
      className="font-barlow font-bold text-[9px] tracking-[0.18em] uppercase px-1.5 py-0.5"
      style={{ color: s.color, background: `${s.color}12`, border: `1px solid ${s.color}25` }}
    >
      {s.label}
    </div>
  )
}

function FinishedScreen({ stats, total, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: '#10b981', opacity: 0.04, clipPath: 'polygon(100% 0,100% 100%,0 100%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none" style={{ background: '#0891b2', opacity: 0.04, clipPath: 'polygon(0 0,100% 0,0 100%)' }} />
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ fontFamily: '"Bebas Neue",sans-serif', fontSize: 'clamp(100px,20vw,200px)', color: 'rgba(16,185,129,0.03)', letterSpacing: '0.05em', lineHeight: 1 }}
      >
        TAMAMLANDI
      </div>

      <div className="text-center max-w-sm relative z-10 w-full">
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        >
          <h2
            className="font-bebas text-[#10b981] tracking-widest leading-none mb-1"
            style={{ fontSize: 'clamp(52px,11vw,88px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            TEBRİKLER!
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="font-barlow font-bold text-gray-600 text-[11px] uppercase tracking-[0.25em] mb-8"
        >
          Seans tamamlandı · {total} kart
        </motion.p>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 mb-8"
          style={{ gap: '2px' }}
        >
          {[
            { label: 'YENİ',       value: stats.newCount,      color: '#4466ff' },
            { label: 'ÖĞRENİYOR', value: stats.learningCount, color: '#ff9800' },
            { label: 'İNCELEME',  value: stats.reviewCount,   color: '#10b981' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="relative px-4 py-5"
              style={{ background: '#080f1e' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: s.color }} />
              <div className="font-bebas leading-none mb-1" style={{ fontSize: '2.2rem', color: s.color }}>{s.value}</div>
              <div className="font-barlow font-bold uppercase tracking-wider" style={{ fontSize: '9px', color: '#2a3a50' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-4 font-bebas tracking-[0.18em] text-base text-white"
          style={{
            background: 'linear-gradient(105deg, #0d9170, #10b981)',
            clipPath: 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))',
            boxShadow: '0 4px 32px rgba(16,185,129,0.3)',
          }}
        >
          <Trophy size={16} />
          KONUYA DÖN
        </motion.button>
      </div>
    </motion.div>
  )
}
