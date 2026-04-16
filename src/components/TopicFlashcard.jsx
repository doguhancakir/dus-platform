import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function TopicFlashcard({ topicId, topicTitle, onClose }) {
  const [cards, setCards]       = useState([])
  const [index, setIndex]       = useState(0)
  const [flipped, setFlipped]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('topic_cards')
        .select('*')
        .eq('topic_id', topicId)
        .order('card_index')
      setCards(data || [])
      setLoading(false)
    }
    load()
  }, [topicId])

  const goNext = useCallback(() => {
    if (index < cards.length - 1) {
      setIndex(i => i + 1)
      setFlipped(false)
    } else {
      setFinished(true)
    }
  }, [index, cards.length])

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(i => i - 1)
      setFlipped(false)
    }
  }, [index])

  useEffect(() => {
    function onKey(e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setFlipped(f => !f) }
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  const card    = cards[index]
  const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#060a16' }}
    >
      {/* ── HUD Bar ── */}
      <div
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: '#080e1c', borderBottom: '1px solid #1a2d45' }}
      >
        <div className="flex items-center gap-4">
          <span
            className="font-barlow font-bold text-[10px] tracking-[0.28em] uppercase px-2.5 py-1"
            style={{ color: '#0891b2', background: 'rgba(8,145,178,0.1)', border: '1px solid rgba(8,145,178,0.2)' }}
          >
            KONU TEKRARı
          </span>
          <span className="font-barlow font-bold text-[11px] tracking-[0.1em] text-gray-400 hidden sm:block">
            {topicTitle}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-bebas text-[#0891b2] tracking-widest" style={{ fontSize: '1.2rem' }}>
            {cards.length > 0 ? `${index + 1} / ${cards.length}` : '—'}
          </span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Progress Bar ── */}
      <div className="h-[3px] flex-shrink-0" style={{ background: '#0f1d32' }}>
        <motion.div
          className="h-full"
          style={{ background: '#0891b2' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">

        {loading && (
          <p className="font-barlow font-bold text-[#0891b2] tracking-[0.2em] text-[11px] uppercase">
            Yükleniyor…
          </p>
        )}

        {!loading && cards.length === 0 && (
          <p className="font-barlow font-bold text-gray-500 tracking-[0.2em] text-[11px] uppercase">
            Bu konu için henüz kart yok.
          </p>
        )}

        {!loading && finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div
              className="font-bebas tracking-widest mb-4"
              style={{ fontSize: 'clamp(3rem, 10vw, 6rem)', color: '#10b981' }}
            >
              TAMAMLANDI!
            </div>
            <p className="font-barlow font-bold text-gray-400 text-[11px] tracking-[0.2em] uppercase mb-8">
              {cards.length} kart tamamlandı
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { setIndex(0); setFlipped(false); setFinished(false) }}
                className="flex items-center gap-2 font-barlow font-bold text-[11px] tracking-[0.2em] uppercase px-5 py-3"
                style={{
                  color: '#0891b2',
                  background: 'rgba(8,145,178,0.1)',
                  border: '1px solid rgba(8,145,178,0.3)',
                  clipPath: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)',
                }}
              >
                <RotateCcw size={13} />
                Tekrar Başla
              </button>
              <button
                onClick={onClose}
                className="font-barlow font-bold text-[11px] tracking-[0.2em] uppercase px-5 py-3"
                style={{
                  color: '#374151',
                  border: '1px solid #1a2d45',
                  clipPath: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)',
                }}
              >
                Çık
              </button>
            </div>
          </motion.div>
        )}

        {!loading && !finished && card && (
          <div className="w-full max-w-2xl">
            {/* Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${index}-${flipped}`}
                initial={{ opacity: 0, y: flipped ? -20 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setFlipped(f => !f)}
                className="relative cursor-pointer select-none"
                style={{
                  background: flipped ? 'rgba(8,145,178,0.07)' : '#0a1628',
                  border: `1px solid ${flipped ? 'rgba(8,145,178,0.4)' : '#1a2d45'}`,
                  borderLeft: `3px solid ${flipped ? '#0891b2' : '#1a2d45'}`,
                  clipPath: 'polygon(0 0,calc(100% - 16px) 0,100% 16px,100% 100%,0 100%)',
                  minHeight: 220,
                  padding: '2rem',
                }}
              >
                {/* Label */}
                <div
                  className="font-barlow font-bold text-[9px] tracking-[0.28em] uppercase mb-4"
                  style={{ color: flipped ? '#0891b2' : '#1a2d45' }}
                >
                  {flipped ? '◈ CEVAP' : '◈ SORU'}
                </div>

                {/* Content */}
                <p
                  className="leading-relaxed"
                  style={{
                    color: flipped ? '#e2e8f0' : '#94a3b8',
                    fontSize: flipped ? '1rem' : '1.1rem',
                    fontWeight: flipped ? 400 : 600,
                  }}
                >
                  {flipped ? card.back : card.front}
                </p>

                {/* Flip hint */}
                {!flipped && (
                  <div
                    className="absolute bottom-4 right-5 font-barlow font-bold text-[9px] tracking-[0.2em] uppercase"
                    style={{ color: '#1a2d45' }}
                  >
                    SPACE / TIKLA → ÇEVİR
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={goPrev}
                disabled={index === 0}
                className="flex items-center gap-2 font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 transition-colors disabled:opacity-30"
                style={{
                  color: '#0891b2',
                  border: '1px solid rgba(8,145,178,0.25)',
                  clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%)',
                }}
              >
                <ChevronLeft size={13} />
                Önceki
              </button>

              {/* Dot indicators */}
              <div className="flex gap-1.5">
                {cards.slice(Math.max(0, index - 4), Math.min(cards.length, index + 5)).map((_, i) => {
                  const realI = Math.max(0, index - 4) + i
                  return (
                    <div
                      key={realI}
                      onClick={() => { setIndex(realI); setFlipped(false) }}
                      className="cursor-pointer transition-all"
                      style={{
                        width: realI === index ? 20 : 6,
                        height: 6,
                        background: realI === index ? '#0891b2' : '#1a2d45',
                        clipPath: 'polygon(0 0,calc(100% - 2px) 0,100% 2px,100% 100%,0 100%)',
                      }}
                    />
                  )
                })}
              </div>

              <button
                onClick={goNext}
                className="flex items-center gap-2 font-barlow font-bold text-[10px] tracking-[0.2em] uppercase px-4 py-2.5 transition-colors"
                style={{
                  color: '#0891b2',
                  background: 'rgba(8,145,178,0.08)',
                  border: '1px solid rgba(8,145,178,0.3)',
                  clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,0 100%)',
                }}
              >
                {index === cards.length - 1 ? 'Bitir' : 'Sonraki'}
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Keyboard hint */}
            <p
              className="text-center font-barlow font-bold text-[9px] tracking-[0.2em] uppercase mt-5"
              style={{ color: '#1a2d45' }}
            >
              ← → ok tuşları · ESC çık
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
