import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      await login(nickname, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: '#070c18' }}
    >
      {/* ── Left decorative column ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-2/5 relative overflow-hidden"
        style={{ background: '#040910', borderRight: '1px solid #1a2d45' }}
      >
        {/* Top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0891b2]" />
        {/* Left accent stripe */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />

        {/* Diagonal accent */}
        <div
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{
            width: '70%',
            height: '60%',
            background: 'rgba(8,145,178,0.035)',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />

        {/* Watermark */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 right-0 text-center pointer-events-none select-none"
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(60px, 10vw, 120px)',
            color: 'rgba(8,145,178,0.05)',
            letterSpacing: '0.08em',
            lineHeight: 1.1,
          }}
        >
          DAVY'S<br />DENTAL
        </div>

        {/* Logo block */}
        <div className="p-10 pt-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="font-bebas text-white leading-none"
              style={{ fontSize: 'clamp(40px, 5vw, 64px)', transform: 'skewX(-5deg)', display: 'inline-block' }}
            >
              DAVY'S{' '}
              <span style={{ color: '#0891b2' }}>DENTAL</span>
            </h1>
            <p
              className="font-barlow font-bold text-[11px] tracking-[0.25em] uppercase mt-2"
              style={{ color: '#2a3a50' }}
            >
              DUS Hazırlık Platformu
            </p>
          </motion.div>
        </div>

        {/* Bottom feature list */}
        <div className="p-10 pb-16 relative z-10">
          {[
            { icon: '◈', text: 'SM-2 Algoritması ile akıllı tekrar' },
            { icon: '◈', text: 'Tüm branşlar tek platformda' },
            { icon: '◈', text: 'Kişisel ilerleme takibi' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 mb-4"
            >
              <span className="text-[#0891b2] text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
              <span
                className="font-barlow font-bold text-[12px] tracking-wider uppercase"
                style={{ color: '#3a5070' }}
              >
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Background diagonals */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: '50%',
            height: '100%',
            background: 'rgba(8,145,178,0.025)',
            clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 70% 100%)',
          }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none p5-scanlines"
          style={{ opacity: 0.25 }}
        />

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-left mb-10">
            <h1
              className="font-bebas text-white tracking-[0.12em] leading-none"
              style={{ fontSize: '3rem', transform: 'skewX(-5deg)', display: 'inline-block' }}
            >
              DAVY'S <span style={{ color: '#0891b2' }}>DENTAL</span>
            </h1>
            <p
              className="font-barlow font-bold text-[10px] uppercase tracking-[0.25em] mt-1"
              style={{ color: '#2a3a50' }}
            >
              DUS Hazırlık Platformu
            </p>
          </div>

          {/* Form header */}
          <div className="mb-8 relative">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2]" />
            <div className="pl-4">
              <span
                className="font-barlow font-bold text-[11px] tracking-[0.25em] uppercase block mb-1"
                style={{ color: '#0891b2' }}
              >
                Sisteme Giriş
              </span>
              <h2
                className="font-bebas text-white tracking-[0.12em] leading-none"
                style={{ fontSize: '2.2rem', transform: 'skewX(-3deg)', display: 'inline-block' }}
              >
                GİRİŞ YAP
              </h2>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block font-barlow font-bold text-[10px] uppercase tracking-[0.22em] mb-2"
                style={{ color: '#3a5070' }}
              >
                Kullanıcı Adı
              </label>
              <input
                className="input"
                type="text"
                placeholder="kullanici_adi"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label
                className="block font-barlow font-bold text-[10px] uppercase tracking-[0.22em] mb-2"
                style={{ color: '#3a5070' }}
              >
                Şifre
              </label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="font-barlow font-bold text-[11px] text-[#ff6b6b] px-3 py-2 uppercase tracking-wider"
                style={{ background: 'rgba(255,23,68,0.07)', borderLeft: '2px solid #ff1744' }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !nickname.trim() || !password}
              whileHover={!loading ? { y: -2, boxShadow: '0 8px 32px rgba(8,145,178,0.4)' } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 py-4 mt-2 font-bebas tracking-[0.2em] text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(105deg, #0779a0, #0891b2)',
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
            </motion.button>
          </form>

          <p
            className="text-center font-barlow font-bold text-[11px] uppercase tracking-[0.2em] mt-6"
            style={{ color: '#2a3a50' }}
          >
            Hesabın yok mu?{' '}
            <Link
              to="/register"
              className="transition-colors"
              style={{ color: '#0891b2' }}
              onMouseEnter={e => e.currentTarget.style.color = '#67d9f0'}
              onMouseLeave={e => e.currentTarget.style.color = '#0891b2'}
            >
              Kayıt Ol
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
