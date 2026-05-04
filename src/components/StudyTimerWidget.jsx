/**
 * StudyTimerWidget — her sayfada görünen fixed timer overlay
 * Soru çözülmeden görünmez.
 * Running = cyan, Paused = soluk gri
 */
import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { useStudyTimer, formatTimerDisplay } from '../contexts/StudyTimerContext'

export default function StudyTimerWidget() {
  const { seconds, running, started } = useStudyTimer()

  // Hiç soru çözülmediyse gösterme
  if (!started && seconds === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        zIndex: 48,   // QuestionPanel z-50'nin altında, diğer her şeyin üstünde
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px 6px 10px',
        background: running ? 'rgba(4, 12, 26, 0.97)' : 'rgba(4, 8, 18, 0.88)',
        border:     running ? '1px solid rgba(8,145,178,0.35)' : '1px solid #111e30',
        borderLeft: running ? '3px solid #0891b2'               : '3px solid #1a2d45',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.4s ease',
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
      }}
    >
      {/* İkon + pulse ring */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Timer size={12} color={running ? '#0891b2' : '#1e3555'} />
        {running && (
          <motion.div
            style={{
              position: 'absolute',
              inset: -3,
              border: '1px solid rgba(8,145,178,0.5)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      {/* Süre */}
      <span
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 15,
          letterSpacing: '0.1em',
          color: running ? '#c8e8f4' : '#2a4060',
          transition: 'color 0.4s ease',
          lineHeight: 1,
        }}
      >
        {formatTimerDisplay(seconds)}
      </span>

      {/* Duraklatıldı etiketi */}
      {!running && started && (
        <span
          style={{
            fontFamily: '"Barlow", sans-serif',
            fontWeight: 700,
            fontSize: 8,
            letterSpacing: '0.14em',
            color: '#1a3050',
            textTransform: 'uppercase',
          }}
        >
          DURDU
        </span>
      )}
    </motion.div>
  )
}
