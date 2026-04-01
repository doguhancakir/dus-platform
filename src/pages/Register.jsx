import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nickname.trim() || !password) return
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }
    setLoading(true)
    setError('')
    try {
      await register(nickname, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: '#070c18' }}
    >
      {/* Background diagonals */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: '45%',
          height: '100%',
          background: 'rgba(8,145,178,0.02)',
          clipPath: 'polygon(0 0, 60% 0, 30% 100%, 0 100%)',
        }}
      />
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: '40%',
          height: '100%',
          background: 'rgba(8,145,178,0.025)',
          clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 70% 100%)',
        }}
      />
      {/* Left stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#0891b2] opacity-50" />
      {/* Top stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#0891b2] opacity-30" />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none p5-scanlines" style={{ opacity: 0.2 }} />

      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(80px, 16vw, 180px)',
          color: 'rgba(8,145,178,0.03)',
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}
      >
        KAYIT
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              className="font-bebas text-white leading-none"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', transform: 'skewX(-5deg)', display: 'inline-block' }}
            >
              DAVY'S <span style={{ color: '#0891b2' }}>DENTAL</span>
            </h1>
            <p
              className="font-barlow font-bold text-[10px] uppercase tracking-[0.25em] mt-1"
              style={{ color: '#2a3a50' }}
            >
              DUS Hazırlık Platformu
            </p>
          </motion.div>
        </div>

        {/* Form container */}
        <div
          className="relative"
          style={{
            background: '#080f1e',
            borderLeft: '4px solid #0891b2',
            border: '1px solid #1a2d45',
            borderLeftWidth: 4,
            borderLeftColor: '#0891b2',
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
            padding: '2rem',
          }}
        >
          {/* Corner slash accent */}
          <div
            className="absolute top-0 right-0 w-16 h-8 pointer-events-none"
            style={{
              background: '#0891b2',
              clipPath: 'polygon(calc(100% - 16px) 0, 100% 0, 100% 16px)',
              opacity: 0.4,
            }}
          />

          <div className="mb-6">
            <span
              className="font-barlow font-bold text-[10px] tracking-[0.22em] uppercase block mb-1"
              style={{ color: '#0891b2' }}
            >
              Yeni Hesap
            </span>
            <h2
              className="font-bebas text-white tracking-[0.12em] leading-none"
              style={{ fontSize: '2rem', transform: 'skewX(-3deg)', display: 'inline-block' }}
            >
              KAYIT OL
            </h2>
          </div>

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
              />
              <p
                className="font-barlow font-bold text-[10px] uppercase tracking-wider mt-1.5"
                style={{ color: '#1e3040' }}
              >
                Boşluksuz, benzersiz bir isim seç
              </p>
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
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label
                className="block font-barlow font-bold text-[10px] uppercase tracking-[0.22em] mb-2"
                style={{ color: '#3a5070' }}
              >
                Şifre Tekrar
              </label>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Şifreni tekrar gir"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
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
              disabled={loading || !nickname.trim() || !password || !confirm}
              whileHover={!loading ? { y: -2, boxShadow: '0 8px 32px rgba(8,145,178,0.4)' } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full flex items-center justify-center gap-2 py-4 mt-2 font-bebas tracking-[0.2em] text-base text-white disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(105deg, #0779a0, #0891b2)',
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                transition: 'box-shadow 0.2s ease, transform 0.15s ease',
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'KAYIT YAPILIYOR...' : 'HESAP OLUŞTUR'}
            </motion.button>
          </form>
        </div>

        <p
          className="text-center font-barlow font-bold text-[11px] uppercase tracking-[0.2em] mt-5"
          style={{ color: '#2a3a50' }}
        >
          Hesabın var mı?{' '}
          <Link
            to="/login"
            className="transition-colors"
            style={{ color: '#0891b2' }}
            onMouseEnter={e => e.currentTarget.style.color = '#67d9f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#0891b2'}
          >
            Giriş Yap
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
