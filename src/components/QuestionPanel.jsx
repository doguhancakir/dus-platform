import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Trophy, RotateCcw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { processCard, newCard, getEstimatedTime, RATINGS, CARD_STATUS, isDue } from '../lib/sm2'

const RATING_CONFIG = [
  {
    rating: RATINGS.AGAIN,
    label: 'Tekrar',
    emoji: '🔴',
    color: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400',
    activeColor: 'border-red-500 bg-red-500/15',
  },
  {
    rating: RATINGS.HARD,
    label: 'Zor',
    emoji: '🟠',
    color: 'border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 text-orange-400',
    activeColor: 'border-orange-500 bg-orange-500/15',
  },
  {
    rating: RATINGS.GOOD,
    label: 'İyi',
    emoji: '🩵',
    color: 'border-accent/30 bg-accent/5 hover:bg-accent/10 text-accent',
    activeColor: 'border-accent bg-accent/15',
  },
  {
    rating: RATINGS.EASY,
    label: 'Kolay',
    emoji: '🟢',
    color: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400',
    activeColor: 'border-emerald-500 bg-emerald-500/15',
  },
]

export default function QuestionPanel({ topicId, onClose }) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [cards, setCards] = useState({}) // questionId → card data
  const [queue, setQueue] = useState([]) // question IDs to show
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ newCount: 0, learningCount: 0, reviewCount: 0 })
  const [finished, setFinished] = useState(false)
  const [answering, setAnswering] = useState(false)

  const DAILY_NEW_LIMIT = 20

  useEffect(() => {
    loadData()
    // ESC key to close
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [topicId])

  async function loadData() {
    setLoading(true)
    try {
      // Sorular
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

      // Kullanıcının kart verileri
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
    const now = new Date()
    const due = []
    const newOnes = []

    qs.forEach(q => {
      const card = cardsMap[q.id]
      if (!card || card.status === CARD_STATUS.NEW) {
        newOnes.push(q.id)
      } else if (isDue(card)) {
        if (card.status === CARD_STATUS.LEARNING || card.status === CARD_STATUS.RELEARNING) {
          due.unshift(q.id) // Learning kartlar önce
        } else {
          due.push(q.id) // Review kartlar
        }
      }
    })

    // Yeni kartları günlük limite göre sınırla
    const todayNew = newOnes.slice(0, DAILY_NEW_LIMIT)
    const fullQueue = [...due, ...todayNew]

    // İstatistikler
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

    // Supabase'e kaydet
    try {
      await supabase
        .from('user_cards')
        .upsert({
          ...updatedCard,
          user_id: user.id,
          question_id: currentQId,
        })

      const newCardsMap = { ...cards, [currentQId]: updatedCard }
      setCards(newCardsMap)

      // Eğer learning/relearning ise ve due_date şimdiden büyükse kuyruğa geri ekle
      let newQueue = [...queue]
      if (
        (updatedCard.status === CARD_STATUS.LEARNING || updatedCard.status === CARD_STATUS.RELEARNING) &&
        isDue(updatedCard)
      ) {
        // Hemen tekrar göster (kuyruğun biraz ilerisine ekle)
        const insertAt = Math.min(currentIndex + 3, newQueue.length)
        newQueue.splice(insertAt, 0, currentQId)
      }

      // Sonraki karta geç
      const nextIndex = currentIndex + 1
      if (nextIndex >= newQueue.length) {
        // İstatistikleri güncelle
        const updatedStats = computeStats(questions, newCardsMap)
        setStats(updatedStats)
        setFinished(true)
      } else {
        setQueue(newQueue)
        setCurrentIndex(nextIndex)
        setShowAnswer(false)
        setSelectedOption(null)
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
      <PanelWrapper onClose={onClose}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Kartlar yükleniyor...</p>
          </div>
        </div>
      </PanelWrapper>
    )
  }

  if (questions.length === 0) {
    return (
      <PanelWrapper onClose={onClose}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Bu konuda soru yok</h3>
            <p className="text-gray-500 text-sm">Yakında eklenecek.</p>
          </div>
        </div>
      </PanelWrapper>
    )
  }

  if (finished) {
    return (
      <PanelWrapper onClose={onClose}>
        <FinishedScreen stats={stats} total={questions.length} onClose={onClose} />
      </PanelWrapper>
    )
  }

  if (!currentQuestion) return null

  const options = currentQuestion.options || []
  const correctIndex = currentQuestion.correct_answer

  return (
    <PanelWrapper onClose={onClose}>
      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-6 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(37,37,64,0.5)' }}>
        <StatBadge color="blue" label="Yeni" count={stats.newCount} />
        <StatBadge color="red" label="Öğrenme" count={stats.learningCount} />
        <StatBadge color="green" label="İnceleme" count={stats.reviewCount} />
        <div className="ml-auto text-xs text-gray-600 font-medium">
          {currentIndex + 1} / {queue.length}
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5 flex-shrink-0" style={{ background: 'rgba(37,37,64,0.5)' }}>
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${((currentIndex) / queue.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id + '-' + showAnswer}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-6 max-w-2xl mx-auto w-full"
          >
            {/* Question Text */}
            <div className="mb-6">
              <p className="text-gray-100 text-lg leading-relaxed font-medium">
                {currentQuestion.question_text}
              </p>
            </div>

            {/* Options */}
            {options.length > 0 && (
              <div className="space-y-2.5 mb-6">
                {options.map((opt, i) => {
                  let optClass = 'border-[#252540] bg-[#14142a]/60 text-gray-300 hover:border-[#353555] hover:bg-[#1a1a35]/60'
                  if (showAnswer) {
                    if (i === correctIndex) {
                      optClass = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    } else if (i === selectedOption && i !== correctIndex) {
                      optClass = 'border-red-500/50 bg-red-500/10 text-red-300'
                    } else {
                      optClass = 'border-[#1e1e35] bg-[#10101e]/40 text-gray-600'
                    }
                  } else if (i === selectedOption) {
                    optClass = 'border-accent/50 bg-accent/10 text-accent'
                  }

                  return (
                    <motion.button
                      key={i}
                      whileHover={!showAnswer ? { x: 2 } : {}}
                      whileTap={!showAnswer ? { scale: 0.99 } : {}}
                      onClick={() => !showAnswer && setSelectedOption(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-150
                        flex items-start gap-3 cursor-pointer ${optClass}`}
                      disabled={showAnswer}
                    >
                      <span className="text-xs font-semibold mt-0.5 w-5 flex-shrink-0 opacity-60">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className="text-sm leading-relaxed">{opt}</span>
                      {showAnswer && i === correctIndex && (
                        <span className="ml-auto text-emerald-400 flex-shrink-0">✓</span>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Explanation */}
            {showAnswer && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl mb-6"
                style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)' }}
              >
                <p className="text-xs font-semibold text-accent/60 mb-1.5 uppercase tracking-widest">Açıklama</p>
                <p className="text-gray-300 text-sm leading-relaxed">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(37,37,64,0.5)' }}>
        {!showAnswer ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAnswer(true)}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2
              text-white font-bold py-4 px-6 rounded-2xl transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
              boxShadow: '0 4px 20px rgba(0,212,170,0.3)',
            }}
          >
            <span>Cevabı Göster</span>
            <ChevronRight size={18} />
          </motion.button>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
            {RATING_CONFIG.map((cfg) => (
              <motion.button
                key={cfg.rating}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleRating(cfg.rating)}
                disabled={answering}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border
                  transition-all duration-150 cursor-pointer disabled:opacity-50 ${cfg.color}`}
              >
                <span className="text-xl">{cfg.emoji}</span>
                <span className="text-xs font-semibold">{cfg.label}</span>
                <span className="text-[10px] opacity-60">
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

function PanelWrapper({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#0a0a0f' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(37,37,64,0.6)', background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🦷</span>
          <span className="text-sm font-bold text-white tracking-tight">Davy's Dental</span>
          <span className="text-gray-600 text-xs mx-1">·</span>
          <span className="text-xs text-gray-500 font-medium">Soru Modu</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-200 transition-colors"
          style={{ background: 'rgba(20,20,40,0.5)' }}
        >
          <X size={18} />
        </button>
      </div>
      {children}
    </motion.div>
  )
}

function StatBadge({ color, label, count }) {
  const colors = {
    blue: 'text-blue-400 bg-blue-500/10',
    red: 'text-red-400 bg-red-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
  }
  return (
    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${colors[color]}`}>
      <span className="font-bold">{count}</span>
      <span className="opacity-70">{label}</span>
    </div>
  )
}

function FinishedScreen({ stats, total, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex items-center justify-center p-6"
    >
      <div className="text-center max-w-sm">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2">Tebrikler!</h2>
        <p className="text-gray-500 mb-6">Bugünlük bu kadar. Harika iş çıkardın!</p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="card p-4 text-center">
            <div className="text-2xl font-black text-blue-400">{stats.newCount}</div>
            <div className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">Yeni</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-black text-orange-400">{stats.learningCount}</div>
            <div className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">Öğrenme</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-black text-accent">{stats.reviewCount}</div>
            <div className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">İnceleme</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Trophy size={16} />
          <span>Konuya Dön</span>
        </button>
      </div>
    </motion.div>
  )
}
