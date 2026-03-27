import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { processCard, newCard, getEstimatedTime, RATINGS, CARD_STATUS, isDue } from '../lib/sm2'

const RATING_CONFIG = [
  {
    rating: RATINGS.AGAIN,
    label: 'TEKRAR',
    color: '#cc0000',
    textColor: '#fff',
    borderColor: '#cc0000',
  },
  {
    rating: RATINGS.HARD,
    label: 'ZOR',
    color: '#ff6600',
    textColor: '#fff',
    borderColor: '#ff6600',
  },
  {
    rating: RATINGS.GOOD,
    label: 'İYİ',
    color: 'transparent',
    textColor: '#fff',
    borderColor: '#fff',
  },
  {
    rating: RATINGS.EASY,
    label: 'KOLAY',
    color: '#f0c040',
    textColor: '#000',
    borderColor: '#f0c040',
  },
]

export default function QuestionPanel({ topicId, onClose }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [cards, setCards] = useState({})
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [eliminatedOptions, setEliminatedOptions] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ newCount: 0, learningCount: 0, reviewCount: 0 })
  const [finished, setFinished] = useState(false)
  const [answering, setAnswering] = useState(false)

  function toggleElimination(i) {
    setEliminatedOptions(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const DAILY_NEW_LIMIT = 20

  useEffect(() => {
    loadData()
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [topicId])

  async function loadData() {
    setLoading(true)
    try {
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .order('id')

      if (!qs || qs.length === 0) {
        setLoading(false)
        return
      }

      setQuestions(qs)
      const qIds = qs.map(q => q.id)

      const { data: userCards } = await supabase
        .from('user_cards')
        .select('*')
        .eq('user_id', user.id)
        .in('question_id', qIds)

      const cardsMap = {}
      userCards?.forEach(c => { cardsMap[c.question_id] = c })

      setCards(cardsMap)
      buildQueue(qs, cardsMap)
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  function buildQueue(qs, cardsMap) {
    const due = []
    const newOnes = []

    qs.forEach(q => {
      const card = cardsMap[q.id]
      if (!card || card.status === CARD_STATUS.NEW) {
        newOnes.push(q.id)
      } else if (isDue(card)) {
        if (card.status === CARD_STATUS.LEARNING || card.status === CARD_STATUS.RELEARNING) {
          due.unshift(q.id)
        } else {
          due.push(q.id)
        }
      }
    })

    const todayNew = newOnes.slice(0, DAILY_NEW_LIMIT)
    const fullQueue = [...due, ...todayNew]

    const newCount = qs.filter(q => !cardsMap[q.id] || cardsMap[q.id]?.status === CARD_STATUS.NEW).length
    const learningCount = qs.filter(q => {
      const c = cardsMap[q.id]
      return c?.status === CARD_STATUS.LEARNING || c?.status === CARD_STATUS.RELEARNING
    }).length
    const reviewCount = qs.filter(q => {
      const c = cardsMap[q.id]
      return c?.status === CARD_STATUS.REVIEW && isDue(c)
    }).length

    setStats({ newCount, learningCount, reviewCount })
    setQueue(fullQueue)
    setCurrentIndex(0)
    setFinished(fullQueue.length === 0)
  }

  async function handleRating(rating) {
    if (answering) return
    setAnswering(true)

    const currentQId = queue[currentIndex]
    const question = questions.find(q => q.id === currentQId)
    if (!question) { setAnswering(false); return }

    const existingCard = cards[currentQId] || newCard(user.id, currentQId)
    const updatedCard = processCard(existingCard, rating)

    try {
      await supabase
        .from('user_cards')
        .upsert({ ...updatedCard, user_id: user.id, question_id: currentQId })

      const newCardsMap = { ...cards, [currentQId]: updatedCard }
      setCards(newCardsMap)

      let newQueue = [...queue]
      if (
        (updatedCard.status === CARD_STATUS.LEARNING || updatedCard.status === CARD_STATUS.RELEARNING) &&
        isDue(updatedCard)
      ) {
        const insertAt = Math.min(currentIndex + 3, newQueue.length)
        newQueue.splice(insertAt, 0, currentQId)
      }

      const nextIndex = currentIndex + 1
      if (nextIndex >= newQueue.length) {
        const updatedStats = computeStats(questions, newCardsMap)
        setStats(updatedStats)
        setFinished(true)
      } else {
        setQueue(newQueue)
        setCurrentIndex(nextIndex)
        setShowAnswer(false)
        setSelectedOption(null)
        setEliminatedOptions(new Set())
      }
    } catch (err) {
      console.error('Save error:', err)
    }
    setAnswering(false)
  }

  function computeStats(qs, cardsMap) {
    const newCount = qs.filter(q => !cardsMap[q.id] || cardsMap[q.id]?.status === CARD_STATUS.NEW).length
    const learningCount = qs.filter(q => {
      const c = cardsMap[q.id]
      return c?.status === CARD_STATUS.LEARNING || c?.status === CARD_STATUS.RELEARNING
    }).length
    const reviewCount = qs.filter(q => {
      const c = cardsMap[q.id]
      return c?.status === CARD_STATUS.REVIEW && isDue(c)
    }).length
    return { newCount, learningCount, reviewCount }
  }

  const currentQuestion = questions.find(q => q.id === queue[currentIndex])
  const currentCard = currentQuestion ? (cards[currentQuestion.id] || newCard(user.id, currentQuestion.id)) : null

  if (loading) {
    return (
      <PanelWrapper onClose={onClose} stats={null} currentIndex={0} queueLength={0}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[rgba(8,145,178,0.2)] border-t-[#0891b2] rounded-full animate-spin" />
            <p className="font-bebas text-gray-600 tracking-widest text-sm">KARTLAR YÜKLENİYOR</p>
          </div>
        </div>
      </PanelWrapper>
    )
  }

  if (questions.length === 0) {
    return (
      <PanelWrapper onClose={onClose} stats={null} currentIndex={0} queueLength={0}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="font-bebas text-6xl text-[#0891b2] mb-4 tracking-widest">—</div>
            <h3 className="font-bebas text-2xl text-white tracking-widest mb-2">SORU YOK</h3>
            <p className="text-gray-600 text-xs uppercase tracking-widest">Bu konuda henüz soru eklenmemiş.</p>
          </div>
        </div>
      </PanelWrapper>
    )
  }

  if (finished) {
    return (
      <PanelWrapper onClose={onClose} stats={stats} currentIndex={queue.length} queueLength={queue.length}>
        <FinishedScreen stats={stats} total={questions.length} onClose={onClose} />
      </PanelWrapper>
    )
  }

  if (!currentQuestion) return null

  const options = currentQuestion.options || []
  const correctIndex = currentQuestion.correct_answer

  return (
    <PanelWrapper onClose={onClose} stats={stats} currentIndex={currentIndex} queueLength={queue.length}>
      {/* Progress bar */}
      <div className="h-[3px] flex-shrink-0" style={{ background: '#1a2d45' }}>
        <motion.div
          className="h-full bg-[#0891b2]"
          animate={{ width: `${(currentIndex / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question area */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id + '-' + showAnswer}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="p-6 sm:p-10 max-w-2xl mx-auto w-full"
          >
            {/* Question text */}
            <div
              className="mb-7 p-5 relative"
              style={{
                background: '#0d1e35',
                borderLeft: '4px solid #0891b2',
              }}
            >
              <p className="text-gray-100 text-base sm:text-lg leading-relaxed font-medium">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Options */}
            {options.length > 0 && (
              <div className="space-y-2 mb-6">
                {options.map((opt, i) => {
                  const isEliminated = !showAnswer && eliminatedOptions.has(i)
                  let bg = '#111'
                  let borderColor = '#2a2a2a'
                  let textColor = '#aaa'

                  if (showAnswer) {
                    if (i === correctIndex) {
                      bg = 'rgba(16,185,129,0.1)'
                      borderColor = 'rgba(16,185,129,0.5)'
                      textColor = '#6ee7b7'
                    } else if (i === selectedOption && i !== correctIndex) {
                      bg = 'rgba(255,23,68,0.08)'
                      borderColor = 'rgba(255,23,68,0.4)'
                      textColor = '#ff8888'
                    } else {
                      bg = '#0a1628'
                      borderColor = '#1a2d45'
                      textColor = '#444'
                    }
                  } else if (i === selectedOption) {
                    bg = 'rgba(8,145,178,0.08)'
                    borderColor = '#0891b2'
                    textColor = '#67d9f0'
                  }

                  return (
                    <div key={i} style={{ display: 'flex', gap: '3px', alignItems: 'stretch' }}>
                      <motion.button
                        whileHover={!showAnswer ? { x: 4 } : {}}
                        whileTap={!showAnswer ? { scale: 0.99 } : {}}
                        onClick={() => !showAnswer && setSelectedOption(i)}
                        disabled={showAnswer}
                        className="flex-1 text-left px-4 py-3 flex items-start gap-3 transition-all duration-150 cursor-pointer disabled:cursor-default"
                        style={{
                          background: bg,
                          border: `1px solid ${borderColor}`,
                          borderLeft: `3px solid ${borderColor}`,
                          opacity: isEliminated ? 0.35 : 1,
                        }}
                      >
                        <span className="text-xs font-semibold mt-0.5 w-5 flex-shrink-0" style={{ color: textColor, opacity: 0.7 }}>
                          {String.fromCharCode(65 + i)}.
                        </span>
                        <span
                          className="text-sm leading-relaxed"
                          style={{
                            color: textColor,
                            textDecoration: isEliminated ? 'line-through' : 'none',
                            textDecorationColor: '#0891b2',
                            textDecorationThickness: '2px',
                          }}
                        >
                          {opt}
                        </span>
                        {showAnswer && i === correctIndex && (
                          <span className="ml-auto text-emerald-400 flex-shrink-0">✓</span>
                        )}
                      </motion.button>
                      {!showAnswer && (
                        <button
                          onClick={() => toggleElimination(i)}
                          className="w-7 flex-shrink-0 flex items-center justify-center text-[10px] transition-all duration-150"
                          style={{
                            background: isEliminated ? 'rgba(8,145,178,0.12)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isEliminated ? 'rgba(8,145,178,0.5)' : '#1a2d45'}`,
                            color: isEliminated ? '#0891b2' : '#333',
                            fontWeight: 700,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Explanation */}
            {showAnswer && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 mb-4"
                style={{ background: 'rgba(8,145,178,0.05)', borderLeft: '3px solid rgba(8,145,178,0.4)' }}
              >
                <p className="text-[10px] font-semibold text-[#0891b2] mb-1.5 uppercase tracking-[0.2em]">Açıklama</p>
                <p className="text-gray-400 text-sm leading-relaxed">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom actions */}
      <div
        className="p-4 sm:p-6 flex-shrink-0"
        style={{ borderTop: '1px solid #1a2d45', background: '#0a1628' }}
      >
        {!showAnswer ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowAnswer(true); setEliminatedOptions(new Set()) }}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 px-6 font-bebas tracking-[0.15em] text-base text-white"
            style={{
              background: '#0891b2',
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              boxShadow: '0 4px 24px rgba(8,145,178,0.3)',
            }}
          >
            CEVABI GÖSTER
            <ChevronRight size={18} />
          </motion.button>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
            {RATING_CONFIG.map((cfg) => (
              <motion.button
                key={cfg.rating}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRating(cfg.rating)}
                disabled={answering}
                className="flex flex-col items-center gap-1 py-3 px-2 transition-all duration-150 cursor-pointer disabled:opacity-50"
                style={{
                  background: cfg.color,
                  border: `2px solid ${cfg.borderColor}`,
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                <span
                  className="font-bebas text-sm tracking-[0.12em] leading-none"
                  style={{ color: cfg.textColor }}
                >
                  {cfg.label}
                </span>
                <span className="text-[9px] uppercase tracking-wider" style={{ color: cfg.textColor, opacity: 0.6 }}>
                  {currentCard ? getEstimatedTime(currentCard, cfg.rating) : '—'}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </PanelWrapper>
  )
}

function PanelWrapper({ children, onClose, stats, currentIndex, queueLength }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0a1628' }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 relative"
        style={{ borderBottom: '1px solid #1a2d45', background: '#0a1628' }}
      >
        {/* Left teal accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />

        <div className="flex items-center gap-4 pl-3">
          <span
            className="font-bebas text-white tracking-[0.15em] text-lg"
            style={{ transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            DAVY'S <span className="text-[#0891b2]">DENTAL</span>
          </span>
          <span
            className="font-bebas text-[#0891b2] text-xs tracking-[0.2em] px-2 py-0.5"
            style={{ background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}
          >
            SORU MODU
          </span>
        </div>

        <div className="flex items-center gap-4">
          {stats && queueLength > 0 && (
            <div className="hidden sm:flex items-center gap-3">
              <StatPill color="#4466ff" label="Yeni" count={stats.newCount} />
              <StatPill color="#0891b2" label="Öğrenme" count={stats.learningCount} />
              <StatPill color="#22c55e" label="İnceleme" count={stats.reviewCount} />
              <span className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                {currentIndex}/{queueLength}
              </span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-white transition-colors"
            style={{ background: '#0d1e35', border: '1px solid #1a2d45' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {children}
    </motion.div>
  )
}

function StatPill({ color, label, count }) {
  return (
    <div
      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <span className="font-bold">{count}</span>
      <span style={{ opacity: 0.7 }}>{label}</span>
    </div>
  )
}

function FinishedScreen({ stats, total, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Background slash elements */}
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{ background: '#0891b2', opacity: 0.05, clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
        style={{ background: '#0891b2', opacity: 0.05, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
      />

      <div className="text-center max-w-sm relative z-10">
        {/* Big TEBRİKLER text */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.1 }}
        >
          <h2
            className="font-bebas text-[#0891b2] tracking-widest leading-none mb-1"
            style={{ fontSize: 'clamp(48px, 10vw, 80px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            TEBRİKLER!
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-xs uppercase tracking-[0.25em] mb-8"
        >
          Bugünlük bu kadar. Harika iş çıkardın!
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-3 mb-8"
          style={{ gap: '2px', background: '#0d1e35' }}
        >
          <div className="bg-[#0a1628] px-4 py-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500" />
            <div className="font-bebas text-3xl text-blue-400">{stats.newCount}</div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">Yeni</div>
          </div>
          <div className="bg-[#0a1628] px-4 py-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ff6600]" />
            <div className="font-bebas text-3xl text-orange-400">{stats.learningCount}</div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">Öğrenme</div>
          </div>
          <div className="bg-[#0a1628] px-4 py-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500" />
            <div className="font-bebas text-3xl text-emerald-400">{stats.reviewCount}</div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">İnceleme</div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3.5 font-bebas tracking-[0.15em] text-base text-white"
          style={{
            background: '#0891b2',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          <Trophy size={16} />
          KONUYA DÖN
        </motion.button>
      </div>
    </motion.div>
  )
}
