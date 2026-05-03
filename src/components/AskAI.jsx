/**
 * AskAI — Soru bazlı Gemini chat paneli
 * Her yeni soru → yeni session (messages sıfırlanır)
 * Gemini API key'i Supabase Edge Function üzerinden gizli tutulur
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-ai`
const GREETING = 'Soruyu görüyorum. Ne sormak istersin?'

export default function AskAI({ questionContext, sessionKey, onClose }) {
  const [messages,  setMessages]  = useState([])   // { role:'user'|'ai', text:string }
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Yeni soru → session sıfırla
  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [sessionKey])

  // Otomatik scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
          questionContext,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Sunucu hatası')

      setMessages(prev => [...prev, { role: 'ai', text: data.text }])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-y-0 right-0 z-[60] flex flex-col"
      style={{
        width: 'min(420px, 100vw)',
        background: '#060d1a',
        borderLeft: '1px solid #0d2a40',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #0d2a40', background: '#040910' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center w-6 h-6"
            style={{ background: 'rgba(8,145,178,0.15)', border: '1px solid rgba(8,145,178,0.3)' }}
          >
            <Sparkles size={12} color="#0891b2" />
          </div>
          <span
            className="font-bebas tracking-[0.15em] text-sm"
            style={{ color: '#0891b2' }}
          >
            AI'A SOR
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:text-white transition-colors"
          style={{ border: '1px solid #1e3555', background: '#0d1a2e' }}
        >
          <X size={13} />
        </button>
      </div>

      {/* ── Soru özeti ── */}
      <div
        className="px-4 py-2.5 flex-shrink-0"
        style={{ background: '#040c18', borderBottom: '1px solid #091525' }}
      >
        <p
          className="font-barlow font-bold text-[9px] tracking-[0.18em] uppercase mb-1"
          style={{ color: '#1a4060' }}
        >
          AKTİF SORU
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: '#3a5a70' }}
        >
          {questionContext.questionText.length > 90
            ? questionContext.questionText.slice(0, 90) + '…'
            : questionContext.questionText}
        </p>
      </div>

      {/* ── Mesajlar ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Karşılama mesajı */}
        <AIBubble text={GREETING} />

        {messages.map((m, i) =>
          m.role === 'user'
            ? <UserBubble key={i} text={m.text} />
            : <AIBubble key={i} text={m.text} />
        )}

        {loading && <LoadingBubble />}

        {error && (
          <div
            className="text-xs px-3 py-2"
            style={{ background: 'rgba(204,0,0,0.08)', border: '1px solid rgba(204,0,0,0.25)', color: '#ff6b6b' }}
          >
            ⚠ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 p-3"
        style={{ borderTop: '1px solid #0d2a40', background: '#040910' }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            placeholder="Sorunuzu yazın… (Enter = gönder)"
            rows={2}
            className="flex-1 resize-none text-xs text-gray-200 placeholder-gray-700 outline-none"
            style={{
              background: '#0a1525',
              border: '1px solid #1a3050',
              padding: '8px 10px',
              lineHeight: 1.5,
              fontFamily: "'Barlow', sans-serif",
              fontWeight: 600,
            }}
          />
          <motion.button
            onClick={send}
            disabled={!input.trim() || loading}
            whileHover={input.trim() && !loading ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !loading ? { scale: 0.95 } : {}}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9"
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #0779a0, #0891b2)'
                : '#0a1525',
              border: `1px solid ${input.trim() && !loading ? '#0891b2' : '#1a3050'}`,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            {loading
              ? <Loader2 size={14} color="#0891b2" className="animate-spin" />
              : <Send size={13} color={input.trim() ? '#fff' : '#2a4060'} />
            }
          </motion.button>
        </div>
        <p
          className="font-barlow font-bold text-[8px] tracking-[0.12em] uppercase mt-1.5"
          style={{ color: '#1a3050' }}
        >
          Shift+Enter = yeni satır
        </p>
      </div>
    </motion.div>
  )
}

/* ── Bubble bileşenleri ── */

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[85%] text-xs leading-relaxed px-3 py-2"
        style={{
          background: 'rgba(8,145,178,0.12)',
          border: '1px solid rgba(8,145,178,0.25)',
          color: '#c8e8f4',
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
        }}
      >
        {text}
      </div>
    </div>
  )
}

function AIBubble({ text }) {
  // Basit markdown: **bold**, satır başı - madde
  const lines = text.split('\n')
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[92%] text-xs leading-relaxed px-3 py-2.5 space-y-1"
        style={{
          background: '#080f1e',
          border: '1px solid #0d2035',
          borderLeft: '3px solid #0891b2',
          color: '#8ab4c8',
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
        }}
      >
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1" />
          // Bold markers
          const parts = line.split(/\*\*(.*?)\*\*/g)
          return (
            <p key={i}>
              {parts.map((p, j) =>
                j % 2 === 1
                  ? <span key={j} style={{ color: '#d8e8f4', fontWeight: 700 }}>{p}</span>
                  : <span key={j}>{p}</span>
              )}
            </p>
          )
        })}
      </div>
    </div>
  )
}

function LoadingBubble() {
  return (
    <div className="flex justify-start">
      <div
        className="px-4 py-3 flex items-center gap-1.5"
        style={{ background: '#080f1e', border: '1px solid #0d2035', borderLeft: '3px solid #0891b2' }}
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#0891b2' }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  )
}
