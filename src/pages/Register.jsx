import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Stethoscope, Eye, EyeOff, Loader2 } from 'lucide-react'
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
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4 shadow-glow"
          >
            <Stethoscope size={28} className="text-accent" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-100">DUS Platform</h1>
          <p className="text-gray-500 text-sm mt-1">Hesap Oluştur</p>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-semibold text-gray-200 mb-6">Kayıt Ol</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Kullanıcı Adı</label>
              <input
                className="input"
                type="text"
                placeholder="kullanici_adi"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-600 mt-1">Boşluk kullanmadan, benzersiz bir isim seç</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şifre</label>
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
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Şifre Tekrar</label>
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
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || !nickname.trim() || !password || !confirm}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              <span>{loading ? 'Kayıt yapılıyor...' : 'Hesap Oluştur'}</span>
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Hesabın var mı?{' '}
          <Link to="/login" className="text-accent hover:text-accent-hover transition-colors font-medium">
            Giriş Yap
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
