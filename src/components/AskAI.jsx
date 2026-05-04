/**
 * AskAI — Soru bazlı AI chat paneli
 * Her yeni soru → yeni session (messages sıfırlanır)
 * Model seçimi: Gemini Flash veya Groq (Llama 3.3 70B)
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-ai`
const GREETING = 'Soruyu görüyorum. Ne sormak istersin?'

const MODELS = [
  { id: 'gemini', label: 'Gemini', sub: 'Flash' },
  { id: 'groq',   label: 'Groq',   sub: 'Llama 3.3' },
]

export default function AskAI({ questionContext, sessionKey, onClose }) {
  const [messages,    setMessages]    = useState([])   // { role:'user'|'ai', text:string }
  const [input,       setInput]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [retryAfter,  setRetryAfter]  = useState(null) // countdown seconds
  const [model,       setModel]       = useState(() => localStorage.getItem('askai_model') ?? 'gemini')
  const bottomRef    = useRef(null)
  const inputRef     = useRef(null)
  const retryTimerRef = useRef(null)
  const pendingMsgRef = useRef(null)  // mesajlar: retry sırasında tekrar gönderilecek

  function selectModel(id) {
    setModel(id)
    localStorage.setItem('askai_model', id)
    // Model değişince mevcut session'ı sıfırla
    setMessages([])
    setError(null)
    setRetryAfter(null)
    clearInterval(retryTimerRef.current)
    pendingMsgRef.current = null
  }

  // Yeni soru → session sıfırla
  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
    setLoading(false)
    setRetryAfter(null)
    clearInterval(retryTimerRef.current)
    pendingMsgRef.current = null
    setTimeout(() => inputRef.current?.focus(), 300)
  }, [sessionKey])

  // Otomatik scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Countdown başlat: retryAfter saniye geri sayar, 0'da otomatik send() çağırır
  function startRetryCountdown(seconds, msgList) {
    setRetryAfter(seconds)
    pendingMsgRef.current = msgList
    clearInterval(retryTimerRef.current)

    retryTimerRef.current = setInterval(() => {
      setRetryAfter(prev => {
        if (prev <= 1) {
          clearInterval(retryTimerRef.current)
          // 0'a ulaştı → otomatik retry
          sendWithMessages(pendingMsgRef.current)
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  async function sendWithMessages(msgList) {
    setLoading(true)
    setError(null)
    setRetryAfter(null)
    clearInterval(retryTimerRef.current)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 28000) // 28sn max

    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgList.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text })),
          questionContext,
          model,
        }),
      })

      const data = await res.json()

      // Rate limit → countdown + auto-retry
      if (res.status === 429 || data.error === 'RATE_LIMIT') {
        const wait = data.retryAfter ?? 60
        startRetryCountdown(Math.ceil(wait), msgList)
        return
      }

      if (!res.ok || data.error) {
        const msg = data.error || 'Sunucu hatası'
        if (msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate')) {
          throw new Error('Limit doldu — birkaç dakika bekleyip tekrar dene.')
        }
        throw new Error(msg)
      }

      setMessages(prev => [...prev, { role: 'ai', text: data.text }])
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Yanıt süresi doldu — tekrar dene.')
      } else {
        setError(err.message)
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }

  async function send() {
    const text = input.trim()
    if (!text || loading || retryAfter !== null) return

    const userMsg = { role: 'user', text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    await sendWithMessages(nextMessages)
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

      {/* ── Model seçici ── */}
      <div
        className="flex-shrink-0 flex items-center gap-[3px] px-4 py-2"
        style={{ background: '#040910', borderBottom: '1px solid #0d2a40' }}
      >
        {MODELS.map(m => {
          const active = model === m.id
          return (
            <button
              key={m.id}
              onClick={() => selectModel(m.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 transition-all duration-150"
              style={{
                background: active ? 'rgba(8,145,178,0.15)' : 'transparent',
                border: active ? '1px solid rgba(8,145,178,0.45)' : '1px solid #1a3050',
                borderLeft: active ? '2px solid #0891b2' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <span
                className="font-bebas tracking-[0.12em] text-sm leading-none"
                style={{ color: active ? '#0891b2' : '#2a4060' }}
              >
                {m.label}
              </span>
              <span
                className="font-barlow font-bold text-[9px] uppercase tracking-wider leading-none"
                style={{ color: active ? 'rgba(8,145,178,0.65)' : '#1a3050' }}
              >
                {m.sub}
              </span>
            </button>
          )
        })}
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

        {retryAfter !== null && (
          <RetryCountdownBubble seconds={retryAfter} />
        )}

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
            disabled={loading || retryAfter !== null}
            placeholder={retryAfter !== null ? `${retryAfter}sn sonra otomatik tekrar deneniyor…` : 'Sorunuzu yazın… (Enter = gönder)'}
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
            disabled={!input.trim() || loading || retryAfter !== null}
            whileHover={input.trim() && !loading && retryAfter === null ? { scale: 1.05 } : {}}
            whileTap={input.trim() && !loading && retryAfter === null ? { scale: 0.95 } : {}}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9"
            style={{
              background: input.trim() && !loading && retryAfter === null
                ? 'linear-gradient(135deg, #0779a0, #0891b2)'
                : '#0a1525',
              border: `1px solid ${input.trim() && !loading && retryAfter === null ? '#0891b2' : '#1a3050'}`,
              cursor: input.trim() && !loading && retryAfter === null ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            {loading
              ? <Loader2 size={14} color="#0891b2" className="animate-spin" />
              : <Send size={13} color={input.trim() && retryAfter === null ? '#fff' : '#2a4060'} />
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

function RetryCountdownBubble({ seconds }) {
  return (
    <div className="flex justify-start">
      <div
        className="max-w-[92%] text-xs leading-relaxed px-3 py-2.5"
        style={{
          background: '#100a00',
          border: '1px solid #3a2000',
          borderLeft: '3px solid #f0a020',
          color: '#c89040',
          fontFamily: "'Barlow', sans-serif",
          fontWeight: 600,
        }}
      >
        <span style={{ color: '#f0a020' }}>⏱</span>
        {' '}API limiti aşıldı — <span style={{ color: '#f0c040', fontWeight: 700 }}>{seconds}sn</span> sonra otomatik tekrar deneniyor…
      </div>
    </div>
  )
}
