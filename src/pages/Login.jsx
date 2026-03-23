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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Background diagonals */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-1/2 h-full opacity-[0.025]"
          style={{
            background: '#ff1744',
            clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 60% 100%)',
          }}
        />
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff1744] opacity-60" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.7, 0, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <h1
              className="font-bebas text-white tracking-[0.12em] leading-none"
              style={{ fontSize: '3.5rem', transform: 'skewX(-6deg)', display: 'inline-block' }}
            >
              DAVY'S{' '}
              <span style={{ color: '#ff1744' }}>DENTAL</span>
            </h1>
            <p className="text-gray-600 text-[10px] uppercase tracking-[0.3em] mt-2">
              DUS HAZIRLIK PLATFORMU
            </p>
          </motion.div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#111',
            border: '1px solid #222',
            borderLeft: '3px solid #ff1744',
            padding: '2rem',
          }}
        >
          <h2 className="font-bebas text-2xl text-white tracking-[0.15em] mb-6">GİRİŞ YAP</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-[0.2em]">
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
              <label className="block text-[10px] font-semibold text-gray-600 mb-1.5 uppercase tracking-[0.2em]">
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
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-sm text-[#ff6b6b] px-3 py-2 text-xs uppercase tracking-wider"
                style={{ background: 'rgba(255,23,68,0.08)', borderLeft: '2px solid #ff1744' }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !nickname.trim() || !password}
              className="w-full flex items-center justify-center gap-2 py-3 mt-2 font-bebas tracking-[0.15em] text-base text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: '#ff1744',
                clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = '#e8143c')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ff1744')}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? 'GİRİŞ YAPILIYOR...' : 'GİRİŞ YAP'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-5 uppercase tracking-widest">
          Hesabın yok mu?{' '}
          <Link
            to="/register"
            className="text-[#ff1744] hover:text-[#e8143c] transition-colors font-semibold"
          >
            Kayıt Ol
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
