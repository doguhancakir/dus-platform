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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0a0f' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[100px]"
          style={{ background: 'radial-gradient(ellipse, rgba(0,212,170,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full blur-[80px]"
          style={{ background: 'radial-gradient(ellipse, rgba(22,33,62,0.6) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-3xl"
            style={{
              background: 'rgba(0,212,170,0.1)',
              border: '1px solid rgba(0,212,170,0.25)',
              boxShadow: '0 0 24px rgba(0,212,170,0.15)'
            }}
          >
            🦷
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Davy's <span className="text-accent">Dental</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1.5 font-light tracking-wide">Diş Hekimliği Uzmanlık Sınavı Hazırlık Platformu</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-bold text-gray-100 mb-6">Giriş Yap</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Kullanıcı Adı</label>
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
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Şifre</label>
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
                className="text-sm text-red-400 rounded-lg px-3 py-2"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !nickname.trim() || !password}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Hesabın yok mu?{' '}
          <Link to="/register" className="text-accent hover:text-accent-hover transition-colors font-semibold">
            Kayıt Ol
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
