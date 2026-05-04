import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Trophy, Zap, Sparkles, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { processCard, newCard, getEstimatedTime, RATINGS, CARD_STATUS, isDue } from '../lib/sm2'
import AskAI from './AskAI'

/* ── Rating command config ── */
const RATING_CONFIG = [
  {
    rating: RATINGS.AGAIN,
    label: 'TEKRAR',
    sub: 'Yeniden',
    color: '#cc0000',
    bg: 'rgba(204,0,0,0.12)',
    border: '#cc0000',
    textColor: '#fff',
  },
  {
    rating: RATINGS.HARD,
    label: 'ZOR',
    sub: 'Zorlandım',
    color: '#ff6600',
    bg: 'rgba(255,102,0,0.12)',
    border: '#ff6600',
    textColor: '#fff',
  },
  {
    rating: RATINGS.GOOD,
    label: 'İYİ',
    sub: 'Bildim',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.12)',
    border: '#0891b2',
    textColor: '#fff',
  },
  {
    rating: RATINGS.EASY,
    label: 'KOLAY',
    sub: 'Ezber',
    color: '#f0c040',
    bg: 'rgba(240,192,64,0.12)',
    border: '#f0c040',
    textColor: '#000',
  },
]

const DAILY_NEW_LIMIT = 20

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
  const [showAI,    setShowAI]    = useState(false)
  // Shuffled options — re-randomized on every card appearance
  const [shuffledDisplay, setShuffledDisplay] = useState(null) // { forIndex, options, correctIndex }
  // Double-click tracking
  const lastClickRef = useRef({ time: 0, index: -1 })

  function shuffleOptions(question, forIndex) {
    if (!question?.options?.length) return
    const opts = [...question.options]
    const correctText = opts[question.correct_answer]
    // Fisher-Yates shuffle
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[opts[i], opts[j]] = [opts[j], opts[i]]
    }
    setShuffledDisplay({ forIndex, options: opts, correctIndex: opts.indexOf(correctText) })
  }

  function toggleElimination(i) {
    setEliminatedOptions(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  useEffect(() => {
    loadData()
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [topicId])

  // Re-shuffle every time a new card position is shown (same question = new shuffle)
  useEffect(() => {
    const q = questions.find(q => q.id === queue[currentIndex])
    if (q) shuffleOptions(q, currentIndex)
  }, [currentIndex, queue.length, questions.length])

  async function loadData() {
    setLoading(true)
    try {
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicId)
        .order('id')

      if (!qs || qs.length === 0) { setLoading(false); return }

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
        setShowAI(false)
      }
    } catch (err) {
      console.error('Save error:', err)
    }
    setAnswering(false)
  }

  async function deleteQuestion() {
    const q = currentQuestion
    if (!q) return

    try {
      // Önce user_cards'ı sil (cascade olmayabilir)
      await supabase.from('user_cards').delete().eq('question_id', q.id)
      // Soruyu sil
      const { error } = await supabase.from('questions').delete().eq('id', q.id)
      if (error) throw error

      // Local state güncelle
      const newQuestions = questions.filter(x => x.id !== q.id)
      setQuestions(newQuestions)

      // Kuyruktaki tüm bu soruyu kaldır
      const newQueue = queue.filter(id => id !== q.id)

      if (newQuestions.length === 0 || newQueue.length === 0) {
        setFinished(true)
      } else {
        const nextIdx = Math.min(currentIndex, newQueue.length - 1)
        setQueue(newQueue)
        setCurrentIndex(nextIdx)
        setShowAnswer(false)
        setSelectedOption(null)
        setEliminatedOptions(new Set())
        setShowAI(false)
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
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
      <BattleScreen onClose={onClose}>
        <HUDBar stats={null} currentIndex={0} queueLength={0} onClose={onClose} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            {/* Scan-line loader */}
            <div className="relative w-48 h-[2px] overflow-hidden" style={{ background: '#1a2d45' }}>
              <motion.div
                className="absolute inset-y-0 left-0 w-full bg-[#0891b2]"
                animate={{ scaleX: [0, 1, 0], originX: [0, 0, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: 'left' }}
              />
            </div>
            <p
              className="font-barlow font-bold text-[#0891b2] tracking-[0.25em] text-xs uppercase"
            >
              KARTLAR YÜKLENİYOR
            </p>
          </div>
        </div>
      </BattleScreen>
    )
  }

  if (questions.length === 0) {
    return (
      <BattleScreen onClose={onClose}>
        <HUDBar stats={null} currentIndex={0} queueLength={0} onClose={onClose} />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div
              className="font-bebas text-[#0891b2] mb-4 tracking-widest"
              style={{ fontSize: 'clamp(48px, 10vw, 80px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
            >
              —
            </div>
            <h3 className="font-bebas text-2xl text-white tracking-widest mb-2">SORU YOK</h3>
            <p className="font-barlow font-bold text-[11px] text-gray-600 uppercase tracking-[0.2em]">
              Bu konuda henüz soru eklenmemiş.
            </p>
          </div>
        </div>
      </BattleScreen>
    )
  }

  if (finished) {
    const allNew = questions.every(q => !cards[q.id] || cards[q.id]?.status === 'new')
    const hitDailyLimit = allNew && questions.length > DAILY_NEW_LIMIT
    return (
      <BattleScreen onClose={onClose}>
        <HUDBar stats={stats} currentIndex={queue.length} queueLength={queue.length} onClose={onClose} />
        <FinishedScreen stats={stats} total={questions.length} hitDailyLimit={hitDailyLimit} onClose={onClose} />
      </BattleScreen>
    )
  }

  // Guard: wait until shuffle is ready for this exact card position
  if (!currentQuestion || !shuffledDisplay || shuffledDisplay.forIndex !== currentIndex) return null

  const options = shuffledDisplay.options
  const correctIndex = shuffledDisplay.correctIndex
  const progress = queue.length > 0 ? currentIndex / queue.length : 0

  // Determine answer state for accent color
  const answerState = showAnswer && selectedOption !== null
    ? (selectedOption === correctIndex ? 'correct' : 'wrong')
    : 'neutral'

  const accentColor = answerState === 'correct'
    ? '#10b981'
    : answerState === 'wrong'
    ? '#ff1744'
    : '#0891b2'

  // questionContext — AI'a gönderilecek soru bilgileri
  const aiContext = currentQuestion ? {
    questionText:        currentQuestion.question_text,
    options:             options,
    correctOptionText:   options[correctIndex] ?? '',
    selectedOptionText:  selectedOption !== null ? options[selectedOption] ?? '' : null,
    explanation:         currentQuestion.explanation ?? '',
  } : null

  return (
    <BattleScreen onClose={onClose} accentColor={accentColor}>
      <HUDBar
        stats={stats}
        currentIndex={currentIndex}
        queueLength={queue.length}
        onClose={onClose}
        accentColor={accentColor}
        isAdmin={!!user?.is_admin}
        onDeleteQuestion={deleteQuestion}
      />

      {/* ── Progress bar ── */}
      <div className="h-[3px] flex-shrink-0 relative" style={{ background: '#0d1a2e' }}>
        <motion.div
          className="h-full"
          animate={{ width: `${progress * 100}%`, background: accentColor }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Glow dot at tip */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2"
          animate={{ left: `calc(${progress * 100}% - 4px)`, background: accentColor }}
          transition={{ duration: 0.5 }}
          style={{
            boxShadow: `0 0 8px ${accentColor}`,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        />
      </div>

      {/* ── Question area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id + '-' + showAnswer}
            initial={{ opacity: 0, x: 40, skewX: 3 }}
            animate={{ opacity: 1, x: 0, skewX: 0 }}
            exit={{ opacity: 0, x: -40, skewX: -3 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto w-full px-5 sm:px-8 pt-6 pb-4 relative"
          >
            {/* Watermark */}
            <div
              className="absolute top-0 right-0 pointer-events-none select-none overflow-hidden"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(80px, 16vw, 140px)',
                color: `${accentColor}06`,
                letterSpacing: '0.05em',
                lineHeight: 1,
                transition: 'color 0.5s ease',
                zIndex: 0,
              }}
            >
              SORU
            </div>

            {/* ── Question text ── */}
            <div className="relative z-10 mb-6">
              {/* Question number badge */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-2 py-0.5"
                  style={{
                    color: accentColor,
                    background: `${accentColor}14`,
                    border: `1px solid ${accentColor}30`,
                    transition: 'all 0.4s ease',
                  }}
                >
                  SORU {currentIndex + 1}
                </div>
                <CardStatusBadge card={currentCard} />
              </div>

              <motion.div
                className="relative overflow-hidden"
                animate={{ borderLeftColor: accentColor }}
                transition={{ duration: 0.4 }}
                style={{
                  background: '#080f1e',
                  borderLeft: `4px solid ${accentColor}`,
                  padding: '1.25rem 1.5rem',
                  transition: 'border-left-color 0.4s ease',
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)',
                }}
              >
                {/* Diagonal flash line */}
                <motion.div
                  key={currentQuestion.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(105deg, transparent 0%, ${accentColor}18 50%, transparent 100%)`,
                    transform: 'translateX(-100%) skewX(-20deg)',
                  }}
                  animate={{ transform: ['translateX(-100%) skewX(-20deg)', 'translateX(300%) skewX(-20deg)'] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
                <p className="text-gray-100 text-base sm:text-lg leading-relaxed font-medium relative z-10">
                  {currentQuestion.question_text}
                </p>
              </motion.div>
            </div>

            {/* ── Options ── */}
            {options.length > 0 && (
              <div className="space-y-[3px] mb-5 relative z-10">
                {options.map((opt, i) => {
                  const isEliminated = !showAnswer && eliminatedOptions.has(i)
                  const isSelected = i === selectedOption
                  const isCorrect = showAnswer && i === correctIndex
                  const isWrong = showAnswer && isSelected && i !== correctIndex

                  let bg = 'rgba(8,14,24,0.6)'
                  let borderLeft = '#1a2d45'
                  let textColor = '#6a7a90'
                  let labelColor = '#3a4a60'

                  if (isCorrect) {
                    bg = 'rgba(16,185,129,0.08)'
                    borderLeft = '#10b981'
                    textColor = '#6ee7b7'
                    labelColor = '#10b981'
                  } else if (isWrong) {
                    bg = 'rgba(255,23,68,0.07)'
                    borderLeft = '#ff1744'
                    textColor = '#ff8888'
                    labelColor = '#ff1744'
                  } else if (!showAnswer && isSelected) {
                    bg = `${accentColor}10`
                    borderLeft = accentColor
                    textColor = '#c8e8f4'
                    labelColor = accentColor
                  } else if (showAnswer) {
                    bg = '#050c18'
                    borderLeft = '#111e30'
                    textColor = '#2a3a50'
                    labelColor = '#1a2a3a'
                  }

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="flex gap-[3px] items-stretch"
                    >
                      {/* Main option button */}
                      <motion.button
                        whileHover={!showAnswer ? { x: 6, transition: { duration: 0.1 } } : {}}
                        whileTap={!showAnswer ? { scale: 0.99 } : {}}
                        onClick={() => {
                          if (showAnswer) return
                          const now = Date.now()
                          const last = lastClickRef.current
                          if (last.index === i && now - last.time < 350) {
                            // Double-click: select + reveal
                            setSelectedOption(i)
                            setShowAnswer(true)
                            setEliminatedOptions(new Set())
                            lastClickRef.current = { time: 0, index: -1 }
                          } else {
                            // Single click: just select
                            setSelectedOption(i)
                            lastClickRef.current = { time: now, index: i }
                          }
                        }}
                        disabled={showAnswer}
                        className="flex-1 text-left flex items-start gap-3 transition-all duration-200 cursor-pointer disabled:cursor-default relative overflow-hidden"
                        style={{
                          background: bg,
                          borderLeft: `3px solid ${borderLeft}`,
                          padding: '0.75rem 1rem',
                          opacity: isEliminated ? 0.28 : 1,
                          transition: 'background 0.25s ease, border-color 0.25s ease, opacity 0.2s ease',
                        }}
                      >
                        {/* Selected flash */}
                        {isSelected && !showAnswer && (
                          <motion.div
                            className="absolute inset-0 pointer-events-none"
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{ background: `${accentColor}20` }}
                          />
                        )}

                        {/* Letter */}
                        <span
                          className="font-barlow font-bold text-[11px] mt-0.5 w-5 flex-shrink-0 tracking-wider"
                          style={{ color: labelColor, transition: 'color 0.25s ease' }}
                        >
                          {String.fromCharCode(65 + i)}.
                        </span>

                        {/* Text */}
                        <span
                          className="text-sm leading-relaxed flex-1"
                          style={{
                            color: textColor,
                            textDecoration: isEliminated ? 'line-through' : 'none',
                            textDecorationColor: '#0891b2',
                            textDecorationThickness: '2px',
                            transition: 'color 0.25s ease',
                          }}
                        >
                          {opt}
                        </span>

                        {/* Correct/Wrong icons */}
                        {isCorrect && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="ml-auto flex-shrink-0 text-[#10b981] font-bold"
                          >
                            ✓
                          </motion.span>
                        )}
                        {isWrong && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                            className="ml-auto flex-shrink-0 text-[#ff1744]"
                          >
                            ✗
                          </motion.span>
                        )}
                      </motion.button>

                      {/* Elimination button */}
                      {!showAnswer && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleElimination(i)}
                          className="w-8 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-all duration-150"
                          style={{
                            background: isEliminated ? 'rgba(8,145,178,0.15)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isEliminated ? 'rgba(8,145,178,0.5)' : '#1a2d45'}`,
                            color: isEliminated ? '#0891b2' : '#2a3a50',
                          }}
                        >
                          ✕
                        </motion.button>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* ── Explanation ── */}
            <AnimatePresence>
              {showAnswer && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 12, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10"
                  style={{
                    background: 'rgba(8,145,178,0.05)',
                    borderLeft: '3px solid rgba(8,145,178,0.35)',
                    padding: '0.9rem 1.1rem',
                    marginBottom: '0.75rem',
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
                  }}
                >
                  <p
                    className="font-barlow font-bold text-[#0891b2] mb-1.5 uppercase tracking-[0.2em]"
                    style={{ fontSize: '10px' }}
                  >
                    Açıklama
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── AI Panel ── */}
      <AnimatePresence>
        {showAI && aiContext && (
          <AskAI
            questionContext={aiContext}
            sessionKey={`${currentQuestion?.id ?? ''}-${currentIndex}`}
            onClose={() => setShowAI(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Bottom command strip ── */}
      <div
        className="flex-shrink-0 relative"
        style={{
          borderTop: `1px solid ${accentColor}25`,
          background: '#060d1a',
          transition: 'border-color 0.4s ease',
        }}
      >
        {/* Top accent line */}
        <motion.div
          className="absolute top-0 left-0 h-[2px]"
          animate={{ width: showAnswer ? '100%' : '0%', background: accentColor }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="p-4 sm:p-5">

          {/* ── AI'a Sor — rating butonlarının üstünde sabit ── */}
          {showAnswer && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => setShowAI(true)}
                className="flex items-center gap-2 px-3 py-1.5 font-barlow font-bold text-[11px] tracking-wider uppercase"
                style={{
                  background: 'rgba(8,145,178,0.08)',
                  border: '1px solid rgba(8,145,178,0.3)',
                  borderLeft: '3px solid #0891b2',
                  color: '#0891b2',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.18)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.08)' }}
              >
                <Sparkles size={12} />
                AI'a Sor
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!showAnswer ? (
              /* ── REVEAL BUTTON ── */
              <motion.button
                key="reveal"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShowAnswer(true); setEliminatedOptions(new Set()) }}
                className="w-full max-w-lg mx-auto flex items-center justify-center gap-3 py-4 px-8 font-bebas tracking-[0.2em] text-lg text-white block relative overflow-hidden"
                style={{
                  background: `linear-gradient(105deg, #0779a0, #0891b2)`,
                  clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
                  boxShadow: '0 4px 32px rgba(8,145,178,0.35)',
                }}
              >
                {/* Diagonal sweep on hover */}
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
              /* ── RATING COMMANDS ── */
              <motion.div
                key="ratings"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-4 gap-[3px] max-w-2xl mx-auto"
              >
                {RATING_CONFIG.map((cfg, idx) => (
                  <motion.button
                    key={cfg.rating}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3, scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRating(cfg.rating)}
                    disabled={answering}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 transition-all duration-150 cursor-pointer disabled:opacity-50 relative overflow-hidden"
                    style={{
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}40`,
                      borderTop: `2px solid ${cfg.border}`,
                      clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                    }}
                  >
                    <span
                      className="font-bebas text-sm tracking-[0.12em] leading-none"
                      style={{ color: cfg.textColor }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className="font-barlow font-bold text-[9px] uppercase tracking-wider leading-none"
                      style={{ color: cfg.textColor, opacity: 0.55 }}
                    >
                      {currentCard ? getEstimatedTime(currentCard, cfg.rating) : '—'}
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

/* ── Battle Screen wrapper ── */
function BattleScreen({ children, accentColor = '#0891b2' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#06101e' }}
    >
      {/* Diagonal background slash — top right */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: '40%',
          height: '100%',
          background: `linear-gradient(to left, ${accentColor}03, transparent)`,
          clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 60% 100%)',
          transition: 'background 0.5s ease',
        }}
      />
      {/* Bottom left corner */}
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          width: '30%',
          height: '30%',
          background: `${accentColor}04`,
          clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
          transition: 'background 0.5s ease',
        }}
      />
      {/* Scan-line texture */}
      <div
        className="absolute inset-0 pointer-events-none p5-scanlines"
        style={{ opacity: 0.3, zIndex: 0 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </motion.div>
  )
}

/* ── HUD Bar ── */
function HUDBar({ stats, currentIndex, queueLength, onClose, accentColor = '#0891b2', isAdmin = false, onDeleteQuestion }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDeleteClick() {
    setConfirmDelete(true)
  }
  function handleConfirm() {
    setConfirmDelete(false)
    onDeleteQuestion?.()
  }
  function handleCancel() {
    setConfirmDelete(false)
  }

  return (
    <div
      className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0 relative"
      style={{
        borderBottom: `1px solid ${accentColor}20`,
        background: 'rgba(4,8,18,0.9)',
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* Left accent */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        animate={{ background: accentColor }}
        transition={{ duration: 0.4 }}
      />

      {/* Logo + mode */}
      <div className="flex items-center gap-3 pl-2">
        <span
          className="font-bebas text-white tracking-[0.15em] text-lg leading-none"
          style={{ transform: 'skewX(-4deg)', display: 'inline-block' }}
        >
          DAVY'S <span style={{ color: accentColor, transition: 'color 0.4s' }}>DENTAL</span>
        </span>
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1"
          style={{
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}25`,
            transition: 'all 0.4s ease',
          }}
        >
          <Zap size={9} color={accentColor} strokeWidth={2.5} />
          <span
            className="font-barlow font-bold text-[10px] tracking-[0.18em] uppercase"
            style={{ color: accentColor, transition: 'color 0.4s' }}
          >
            SORU MODU
          </span>
        </div>
      </div>

      {/* Right: stats + progress counter + close */}
      <div className="flex items-center gap-3">
        {stats && queueLength > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <HUDPill color="#4466ff" count={stats.newCount} label="YENİ" />
            <HUDPill color="#ff9800" count={stats.learningCount} label="ÖĞR" />
            <HUDPill color="#10b981" count={stats.reviewCount} label="İNC" />
            <div
              className="font-bebas text-white tracking-[0.12em] text-base leading-none px-2 py-0.5"
              style={{
                background: '#0d1a2e',
                border: '1px solid #1e3555',
              }}
            >
              <span style={{ color: accentColor, transition: 'color 0.4s' }}>{currentIndex}</span>
              <span className="text-gray-700 text-sm">/{queueLength}</span>
            </div>
          </div>
        )}

        {/* Mobile progress counter */}
        {queueLength > 0 && (
          <div className="sm:hidden font-bebas text-sm tracking-wider" style={{ color: accentColor }}>
            {currentIndex}/{queueLength}
          </div>
        )}

        {/* Admin: soru sil */}
        {isAdmin && (
          <AnimatePresence mode="wait">
            {confirmDelete ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <span
                  className="font-barlow font-bold text-[10px] uppercase tracking-wider"
                  style={{ color: '#cc4444' }}
                >
                  Sil?
                </span>
                <button
                  onClick={handleConfirm}
                  className="font-barlow font-bold text-[10px] uppercase tracking-wider px-2 py-1 transition-colors"
                  style={{ background: 'rgba(204,0,0,0.15)', border: '1px solid #cc0000', color: '#ff6b6b' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,0,0,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(204,0,0,0.15)'}
                >
                  Evet
                </button>
                <button
                  onClick={handleCancel}
                  className="font-barlow font-bold text-[10px] uppercase tracking-wider px-2 py-1 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #1e3555', color: '#4a6080' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#8ab0c8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4a6080'}
                >
                  Hayır
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="trash"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleDeleteClick}
                className="p-1.5 transition-colors"
                style={{ border: '1px solid #2a1515', background: '#150808', color: '#663333' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = '#cc2222' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#663333'; e.currentTarget.style.borderColor = '#2a1515' }}
                title="Bu soruyu sil (Admin)"
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </AnimatePresence>
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

/* ── HUD Pill ── */
function HUDPill({ color, count, label }) {
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5"
      style={{
        color,
        background: `${color}10`,
        border: `1px solid ${color}25`,
      }}
    >
      <span className="font-bebas text-sm leading-none">{count}</span>
      <span
        className="font-barlow font-bold text-[9px] uppercase tracking-wider"
        style={{ opacity: 0.7 }}
      >
        {label}
      </span>
    </div>
  )
}

/* ── Card status badge ── */
function CardStatusBadge({ card }) {
  if (!card) return null
  const statusMap = {
    new: { label: 'YENİ', color: '#4466ff' },
    learning: { label: 'ÖĞRENİYOR', color: '#ff9800' },
    review: { label: 'İNCELEME', color: '#10b981' },
    relearning: { label: 'TEKRAR', color: '#ff1744' },
  }
  const s = statusMap[card.status]
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

/* ── Finished Screen ── */
function FinishedScreen({ stats, total, hitDailyLimit, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Background diagonals */}
      <div
        className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
        style={{ background: '#10b981', opacity: 0.04, clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
        style={{ background: '#0891b2', opacity: 0.04, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
      />

      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(100px, 20vw, 200px)',
          color: 'rgba(16,185,129,0.03)',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        TAMAMLANDI
      </div>

      <div className="text-center max-w-sm relative z-10 w-full">
        {/* Tebrikler */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.05 }}
        >
          <h2
            className="font-bebas text-[#10b981] tracking-widest leading-none mb-1"
            style={{ fontSize: 'clamp(52px, 11vw, 88px)', transform: 'skewX(-4deg)', display: 'inline-block' }}
          >
            TEBRİKLER!
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="font-barlow font-bold text-gray-600 text-[11px] uppercase tracking-[0.25em] mb-2"
        >
          Bugünlük seans tamamlandı
        </motion.p>
        {hitDailyLimit && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="font-barlow font-bold text-[10px] uppercase tracking-wider mb-8 px-3 py-2"
            style={{ background: 'rgba(240,192,64,0.06)', borderLeft: '2px solid rgba(240,192,64,0.4)', color: '#f0c040' }}
          >
            ◈ Günlük yeni kart limiti: {DAILY_NEW_LIMIT} — kalan sorular yarın açılır
          </motion.p>
        )}
        {!hitDailyLimit && <div className="mb-8" />}

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-3 mb-8"
          style={{ gap: '2px' }}
        >
          {[
            { label: 'YENİ', value: stats.newCount, color: '#4466ff' },
            { label: 'ÖĞRENİYOR', value: stats.learningCount, color: '#ff9800' },
            { label: 'İNCELEME', value: stats.reviewCount, color: '#10b981' },
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
              <div
                className="font-bebas leading-none mb-1"
                style={{ fontSize: '2.2rem', color: s.color }}
              >
                {s.value}
              </div>
              <div
                className="font-barlow font-bold uppercase tracking-wider"
                style={{ fontSize: '9px', color: '#2a3a50' }}
              >
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Close button */}
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
            clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
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
